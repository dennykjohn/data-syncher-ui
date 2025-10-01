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
  first_name: string;
  last_name: string;
  email: string;
  role: null;
  profile_image: null;
  company: {
    cmp_name: string;
    cmp_id: number;
  };
};

type AuthState = {
  isAuthenticated: boolean;
  user: User | null;
  access_token: string | null;
  refresh_token: string | null;
};
