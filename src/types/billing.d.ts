export interface MonthlyBillingData {
  cmp_id: number;
  current_month_labels?: string[];
  current_month_billing?: number[];
  billing_period?: string;
  daily_labels?: string[];
  total_rec?: number[];
  selected_year?: number;
  selected_month?: number;
  available_connections?: Array<{
    connection_id: number;
    connection_name: string;
  }>;
  selected_connection_ids?: number[];
  months?: Array<[number, string]>;
  invoices?: InvoiceItem[];
  billing_details?: BillingDetail[];
}

export interface MonthlyUsageResponse {
  years: number[];
  daily_labels: string[];
  total_rec: number[];
  selected_year: number;
  selected_month: number;
  available_connections: Array<{
    connection_id: number;
    connection_name?: string;
    src_config__name?: string;
    dst_config__name?: string;
  }>;
  selected_connection_ids: number[];
  months: Array<[number, string]>;
}

export interface YearlyBillingData {
  years: number[];
  selected_year: number;
  monthly_labels: string[];
  monthly_total_rec_values: number[];
  cmp_id: string;
}

export interface BillingDetail {
  period: string;
  total_usage: number;
  amount: number;
}

export interface InvoiceItem {
  id?: number;
  invoice_number?: string;
  created_at?: string;
  billing_start_date?: string;
  billing_end_date?: string;
  total_amount?: number | string;
  payment_status?: string;
  payment_date?: string | null;
  download_url?: string;
}
