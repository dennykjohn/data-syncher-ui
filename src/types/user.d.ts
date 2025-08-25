export type UserRole = "Administrator";

export type UserTableItem = {
  first_name: string;
  last_name: string;
  email: string;
  company_email: string;
  company_name: string;
};

export type User = {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  confirm_password: string;
  role: UserRole;
};

export type UserProfile = {
  first_name: string;
  last_name: string;
  email: string;
  role: UserRole | null;
  company: {
    cmp_name: string;
    start_date: string;
    end_date: string;
  };
  profile_image: string | null;
};
