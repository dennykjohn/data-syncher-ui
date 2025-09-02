export type UserRole = {
  role_id: number;
  role_name: string;
};

export type UpdateUserPayload = {
  first_name: string;
  last_name: string;
  company_email: string;
  password: string;
  confirm_password: string;
  role: string;
};

export type UserTableItem = {
  user_id: number;
  first_name: string;
  last_name: string;
  company_email: string;
  company_name: string;
  role: string;
};

export type User = UserTableItem;

export type UserProfile = {
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  company: {
    cmp_name: string;
    start_date: string;
    end_date: string;
  };
  profile_image?: string | null;
};
