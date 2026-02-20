import { createContext, useEffect, useState } from "react";

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
      Cookies.set("access_token", access_token, {
        expires: 7,
        secure: true,
        sameSite: "Strict",
      });
      Cookies.set("refresh_token", refresh_token, {
        expires: 7,
        secure: true,
        sameSite: "Strict",
      });

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

  const logout = () => {
    setAuthState({
      isAuthenticated: false,
      user: null,
      access_token: null,
      refresh_token: null,
    });
    Cookies.remove("access_token");
    window.location.href = ClientRoutes.AUTH;
  };

  return (
    <AuthContext.Provider value={{ authState, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthProvider, AuthContext };
