export type LoginResponse = {
  accessToken: string;
  refreshToken: string;
};

export interface AuthContextType {
  login: (_arg0: LoginResponse) => void;
  logout: () => void;
  authState: AuthState;
}

type User = {
  username: string;
  email: string;
};

type AuthState = {
  isAuthenticated: boolean;
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
};
