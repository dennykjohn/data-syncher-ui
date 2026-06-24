import { createContext, useCallback, useEffect, useState } from "react";

import Cookies from "js-cookie";

import { toaster } from "@/components/ui/toaster";
import ClientRoutes from "@/constants/client-routes";
import ServerRoutes from "@/constants/server-routes";
import AxiosInstance from "@/lib/axios/api-client";
import {
  type AuthContextType,
  type AuthState,
  type LoginResponse,
  type User,
} from "@/types/auth";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const authCookieOpts = {
  expires: 7,
  /** Secure cookies are not stored on http:// — required for local Vite + Django. */
  secure:
    typeof window !== "undefined" && window.location.protocol === "https:",
  sameSite: "lax" as const,
};

const IDLE_TIMEOUT_MS = 30 * 60 * 1000;
const IDLE_CHECK_INTERVAL_MS = 60 * 1000;

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    access_token: null,
    refresh_token: null,
  });

  // Check for existing token and fetch profile on mount/reload
  useEffect(() => {
    const checkAuthStatus = async () => {
      const access_token = Cookies.get("access_token");
      const refresh_token = Cookies.get("refresh_token");

      if (access_token) {
        try {
          // Fetch User Profile
          const { data: user }: { data: User } = await AxiosInstance({
            method: "GET",
            url: ServerRoutes.auth.profile(),
          });

          setAuthState({
            isAuthenticated: true,
            user,
            access_token,
            refresh_token: refresh_token || null,
          });

          // Show trial expiration message if present
          if (user.is_trial_expired && user.message) {
            toaster.error({
              title: "Trial Expired",
              description: user.message,
              id: "trial-expired",
            });
          }
        } catch (error) {
          console.error("Failed to fetch profile:", error);
          // Clear invalid tokens
          Cookies.remove("access_token");
          Cookies.remove("refresh_token");
        }
      }
    };

    checkAuthStatus();
  }, []);

  const login = async ({
    access_token,
    refresh_token,
    user,
  }: LoginResponse) => {
    try {
      Cookies.set("access_token", access_token, authCookieOpts);
      Cookies.set("refresh_token", refresh_token, authCookieOpts);

      // Fetch latest profile so permissions/role-based redirects are stable.
      let profile = user;
      try {
        const { data }: { data: User } = await AxiosInstance({
          method: "GET",
          url: ServerRoutes.auth.profile(),
        });
        profile = data;
      } catch (error) {
        console.error("Failed to fetch profile after login:", error);
      }

      setAuthState({
        isAuthenticated: true,
        user: profile,
        access_token,
        refresh_token,
      });
    } catch (error) {
      console.error("Login failed:", error);
      Cookies.remove("access_token");
      Cookies.remove("refresh_token");
      throw error;
    }
  };

  const logout = useCallback(() => {
    setAuthState({
      isAuthenticated: false,
      user: null,
      access_token: null,
      refresh_token: null,
    });
    Cookies.remove("access_token");
    Cookies.remove("refresh_token");
    window.location.href = ClientRoutes.AUTH;
  }, []);

  useEffect(() => {
    if (!authState.isAuthenticated) return;

    let lastActivityAt = Date.now();
    const resetIdleTimer = () => {
      lastActivityAt = Date.now();
    };

    const activityEvents = ["mousemove", "keydown", "scroll"];
    activityEvents.forEach((eventName) => {
      window.addEventListener(eventName, resetIdleTimer, { passive: true });
    });

    const idleInterval = window.setInterval(() => {
      if (Date.now() - lastActivityAt >= IDLE_TIMEOUT_MS) {
        logout();
      }
    }, IDLE_CHECK_INTERVAL_MS);

    return () => {
      activityEvents.forEach((eventName) => {
        window.removeEventListener(eventName, resetIdleTimer);
      });
      window.clearInterval(idleInterval);
    };
  }, [authState.isAuthenticated, logout]);

  return (
    <AuthContext.Provider value={{ authState, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthProvider, AuthContext };
