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
  user_id: number;
  first_name: string;
  last_name: string;
  company_email: string;
  role: string;
  profile_image: string | null;
  company: {
    cmp_id: number;
    cmp_name: string;
    start_date: string;
    end_date: string;
  };
  is_trial: boolean;
  trial_days_remaining: number;
  is_trial_expired: boolean;
  message?: string;
};

type AuthState = {
  isAuthenticated: boolean;
  user: User | null;
  access_token: string | null;
  refresh_token: string | null;
};
