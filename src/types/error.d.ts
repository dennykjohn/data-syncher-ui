export type ErrorResponseType = {
  code: number;
  error: string;
  message: string;
  trial_expired?: boolean;
  redirect_to?: string;
};
