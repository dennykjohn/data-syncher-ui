import { createContext, useCallback, useEffect, useState } from "react";

import { toaster } from "@/components/ui/toaster";
import ClientRoutes from "@/constants/client-routes";
import ServerRoutes from "@/constants/server-routes";
import {
  clearAuthTokens,
  getAccessToken,
  getRefreshToken,
  setAuthTokens,
} from "@/lib/auth/token-cookies";
import AxiosInstance from "@/lib/axios/api-client";
import {
  type AuthContextType,
  type AuthState,
  type LoginResponse,
  type User,
} from "@/types/auth";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const IDLE_TIMEOUT_MS = 30 * 60 * 1000;
const IDLE_CHECK_INTERVAL_MS = 60 * 1000;

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    isCheckingAuth: true,
    user: null,
    access_token: null,
    refresh_token: null,
  });

  // Check for existing token and fetch profile on mount/reload
  useEffect(() => {
    const checkAuthStatus = async () => {
      const access_token = getAccessToken();
      const refresh_token = getRefreshToken();

      if (access_token) {
        try {
          // Fetch User Profile
          const { data: user }: { data: User } = await AxiosInstance({
            method: "GET",
            url: ServerRoutes.auth.profile(),
          });

          setAuthState({
            isAuthenticated: true,
            isCheckingAuth: false,
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
          clearAuthTokens();
          setAuthState({
            isAuthenticated: false,
            isCheckingAuth: false,
            user: null,
            access_token: null,
            refresh_token: null,
          });
        }
      } else {
        setAuthState((current) => ({
          ...current,
          isCheckingAuth: false,
        }));
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
      setAuthTokens(access_token, refresh_token);

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
        isCheckingAuth: false,
        user: profile,
        access_token,
        refresh_token,
      });
    } catch (error) {
      console.error("Login failed:", error);
      clearAuthTokens();
      throw error;
    }
  };

  const logout = useCallback(() => {
    setAuthState({
      isAuthenticated: false,
      isCheckingAuth: false,
      user: null,
      access_token: null,
      refresh_token: null,
    });
    clearAuthTokens();
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
