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

export interface BillingDetail {
  period?: string;
  total_usage?: number;
}

export interface InvoiceItem {
  id?: number;
  invoice_number?: string;
  created_at?: string;
  billing_start_date?: string;
  billing_end_date?: string;
  total_amount?: number;
  payment_status?: string;
  payment_reference?: string;
  payment_date?: string;
  receipt_url?: string;
}

export interface ConnectionUsageRecord {
  connection_id: number;
  total_rec?: number[];
  current_month_new_rec?: number;
  current_month_mod_rec?: number;
  current_month_del_rec?: number;
  current_month_total_rec?: number;
}

export interface CurrentMonthAggregatedRecords {
  newRecords: number;
  modifiedRecords: number;
  deletedRecords: number;
  totalRecords: number;
}

export interface BillingDataMap {
  daily_labels?: string[];
  current_month_labels?: string[];
  labels?: string[];
  total_rec?: number[];
  current_month_billing?: number[];
  current_month_new_rec?: number;
  current_month_mod_rec?: number;
  current_month_del_rec?: number;
  current_month_total_rec?: number;
  data?: number[];
  billing_details?: BillingDetail[];
  invoices?: InvoiceItem[];
  monthly_labels?: string[];
  monthly_total_rec_values?: number[];
}

export interface MonthlyUsageResponse extends BillingDataMap {
  selected_year?: number;
  selected_month?: number;
  selected_connection_ids?: number[];
  available_connections?: {
    connection_id: number;
    src_config__name: string;
    dst_config__name: string;
    source_type?: string;
  }[];
  amazon_s3_rec?: number[];
  salesforce_rec?: number[];
  dynamics_rec?: number[];
  google_reviews_rec?: number[];
  years?: number[];
  months?: [number, string][];
  connection_usage?: ConnectionUsageRecord[];
  connections_usage?: ConnectionUsageRecord[];
  connection_usage_data?: ConnectionUsageRecord[];
  connection_usage_map?: ConnectionUsageRecord[];
  connection_wise_usage?: ConnectionUsageRecord[];
}
