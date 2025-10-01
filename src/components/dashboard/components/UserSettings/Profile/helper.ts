export type FormState = {
  firstName: string;
  lastName: string;
  company_email: string;
  cmp_name: string;
  start_date: string;
  end_date: string;
};

export const initialState: FormState = {
  firstName: "",
  lastName: "",
  company_email: "",
  cmp_name: "",
  start_date: "",
  end_date: "",
};
