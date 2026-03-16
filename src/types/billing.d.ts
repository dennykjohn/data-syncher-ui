export interface MonthlyBillingData {
  cmp_id: number;
  current_month_labels: string[];
  current_month_billing: number[];
  billing_period: string;
}

export interface YearlyBillingData {
  years: number[];
  selected_year: number;
  monthly_labels: string[];
  monthly_total_rec_values: number[];
  cmp_id: string;
}
