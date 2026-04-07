export type AccountBillingDetails = {
  card_number?: string | null;
  card_holder_name?: string | null;
  card_expiry?: string | null;
  valid_through?: string | null;
  next_billing_date?: string | null;
};

export type AccountAddress = {
  full_name?: string | null;
  phone?: string | null;
  line1?: string | null;
  line2?: string | null;
  city?: string | null;
  state?: string | null;
  zip_code?: string | null;
  country?: string | null;
};

export type UpdateAccountProfilePayload = {
  billing_address?: AccountAddress | null;
  shipping_address?: AccountAddress | null;
};

export type AccountProfile = {
  company_name?: string | null;
  account_created_at?: string | null;
  created_by?: string | null;
  account_status?: string | null;
  is_trial?: boolean | null;
  trial_days_remaining?: number | null;
  billing?: AccountBillingDetails | null;
  billing_address?: AccountAddress | null;
  shipping_address?: AccountAddress | null;

  // Allow backend to return nested structures without breaking typings
  company?: {
    name?: string | null;
    cmp_name?: string | null;
    created_at?: string | null;
    created_by?: string | null;
    status?: string | null;
    valid_from?: string | null;
    valid_to?: string | null;
  } | null;
  subscription?: {
    is_trial?: boolean | null;
    trial_days_remaining?: number | null;
    status?: string | null;
  } | null;
};
