import { createContext, useEffect, useState } from "react";

import Cookies from "js-cookie";

import ClientRoutes from "@/constants/client-routes";
import ServerRoutes from "@/constants/server-routes";
import AxiosInstance from "@/lib/axios/api-client";
import { type AuthContextType, type AuthState, type User } from "@/types/auth";

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
  }: {
    access_token: string;
    refresh_token: string;
  }) => {
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

      // Fetch User Profile
      const { data: user }: { data: User } = await AxiosInstance({
        method: "GET",
        url: ServerRoutes.auth.profile(),
      });

      setAuthState({
        isAuthenticated: true,
        user: user,
        access_token,
        refresh_token,
      });

      // Redirect to Dashboard after successful login
      window.location.href = ClientRoutes.DASHBOARD;
    } catch (error) {
      console.error("Login failed:", error);
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
