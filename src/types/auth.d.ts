export type LoginResponse = {
  access_token: string;
  refresh_token: string;
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
  access_token: string | null;
  refresh_token: string | null;
};
