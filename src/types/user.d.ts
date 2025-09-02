export type UserRole = "Administrator" | "Analyst";

export type UserTableItem = {
  user_id: number;
  first_name: string;
  last_name: string;
  company_email: string;
  company_name: string;
  role: UserRole;
};

export type User = UserTableItem;

export type UserProfile = {
  first_name: string;
  last_name: string;
  email: string;
  role: UserRole;
  company: {
    cmp_name: string;
    start_date: string;
    end_date: string;
  };
  profile_image?: string | null;
};
