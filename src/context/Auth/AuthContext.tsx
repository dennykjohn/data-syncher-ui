import { createContext, useState } from "react";

//import { useNavigate } from "react-router";

import ClientRoutes from "@/constants/client-routes";
import { type AuthContextType, type AuthState } from "@/types/auth";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  //const navigate = useNavigate();
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    accessToken: null,
    refreshToken: null,
  });

  const login = ({
    accessToken,
    refreshToken,
  }: {
    accessToken: string;
    refreshToken: string;
  }) => {
    try {
      setAuthState({
        isAuthenticated: true,
        user: null,
        accessToken,
        refreshToken,
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
      accessToken: null,
      refreshToken: null,
    });
    window.location.href = ClientRoutes.AUTH;
  };

  return (
    <AuthContext.Provider value={{ authState, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthProvider, AuthContext };
