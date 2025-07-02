import { createContext, useState } from "react";

import Cookies from "js-cookie";

import ClientRoutes from "@/constants/client-routes";
import { type AuthContextType, type AuthState } from "@/types/auth";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    access_token: null,
    refresh_token: null,
  });

  const login = ({
    access_token,
    refresh_token,
  }: {
    access_token: string;
    refresh_token: string;
  }) => {
    try {
      setAuthState({
        isAuthenticated: true,
        user: null,
        access_token,
        refresh_token,
      });
      Cookies.set("access_token", access_token, {
        expires: 7,
        secure: true,
        sameSite: "Strict",
      });
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
