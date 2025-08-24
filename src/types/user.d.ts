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
