import { type FieldConfig } from "./form";

export type ConnectorStatus = "A" | "P" | "E" | "S" | "B";

export type AuditUser = {
  user_id?: number;
  email?: string;
  first_name?: string | null;
  last_name?: string | null;
};

export interface CreateConnectionPayload {
  connection_name: string;
  destination_schema: string;
  form_data: Record<string, unknown>;
}

export interface ConnectorConfigResponse {
  source_schema: FieldConfig[]; // Array of fields with read_only property from backend in edit mode
  initial_data: Record<string, string>;
  destination_config: {
    name: string;
    dst: string;
  };
  fields?: FieldConfig[]; // Alias for source_schema (for backward compatibility)
}

export interface ConnectorTableItem {
  connection_id: number;
  connector_name: string;
  source_name: string;
  display_name: string;
  dst_config_name: string;
  destination_name: string;
  status: ConnectorStatus;
  readable_time_frequency: string;
  last_synced_new: string;
  next_sync_time: string;
  connected_on: number;
  created_at?: string | number | null;
  modified_at?: string | number | null;
  migration_status: string;
  migration_status_name: string;
  error_message?: string | null;
  created_by?: AuditUser | string | null;
  updated_by?: AuditUser | string | null;
  modified_by?: AuditUser | string | null;
  created_by_name?: string | null;
  updated_by_name?: string | null;
  modified_by_name?: string | null;
}

export interface Connector {
  connection_id: number;
  time_frequency: string;
  safety_interval: string;
  execution_order: string;
  sync_start_date: string | null;
  chunk_count: number;
  status: ConnectorStatus;
  readable_time_frequency: string;
  readable_safety_interval: string;
  effective_max_chunk?: number;
  min_count?: number;
  max_count?: number;
  dst_min_count: number;
  dst_max_count: number;
  source_name: string;
  destination_name: string;
  source_title: string;
  destination_title: string;
  company_name: string;
  target_database: string;
  target_schema: string;
  next_sync_time: string;
  is_reverse_etl: boolean;
  connected_on: number | string;
  created_at?: string | number | null;
  modified_at?: string | number | null;
  migration_status?: string;
  reloadingTables?: string[];
  setReloadingTables?: React.Dispatch<React.SetStateAction<string[]>>;
  disable_update_schema?: boolean;
  created_by?: AuditUser | string | null;
  updated_by?: AuditUser | string | null;
  modified_by?: AuditUser | string | null;
  created_by_name?: string | null;
  updated_by_name?: string | null;
  modified_by_name?: string | null;
  is_file_based?: boolean;
  supports_notification_groups?: boolean;
  root_folder?: string | null;
  display_name?: string;
}

export interface ConnectorTabsProps {
  connector?: Connector;
}

export interface ConnectorSyncStats {
  daily_labels: string[];
  new_rec_values_daily: number[];
  mod_rec_values_daily: number[];
  del_rec_values_daily: number[];
  monthly_labels: string[];
  new_rec_values_monthly: number[];
  mod_rec_values_monthly: number[];
  del_rec_values_monthly: number[];
  readable_time_frequency: string;
  cmp_id: number;
}

export type ConnectorSettingsApiResponse = {
  connection_id: number;
  time_frequency: string;
  safety_interval: string;
  execution_order: string;
  sync_start_date: string | null;
  chunk_count: number;
  status: ConnectorStatus;
  readable_time_frequency: string;
  readable_safety_interval: string;
  effective_max_chunk?: number;
  min_count?: number;
  max_count?: number;
  dst_min_count: number;
  dst_max_count: number;
  source_name: string;
  destination_name: string;
  source_title: string;
  destination_title: string;
  company_name: string;
  migration_status?: string;
  created_at?: string | number | null;
  modified_at?: string | number | null;
  created_by?: AuditUser | string | null;
  updated_by?: AuditUser | string | null;
  modified_by?: AuditUser | string | null;
  created_by_name?: string | null;
  updated_by_name?: string | null;
  modified_by_name?: string | null;
  is_file_based?: boolean;
  supports_notification_groups?: boolean;
};

export interface ExcelHeaderStyle {
  fill?: string;
  font_color?: string;
  bold?: boolean;
  italic?: boolean;
  font_name?: string;
  font_size?: number;
  horizontal?: string;
  vertical?: string;
  wrap_text?: boolean;
}

export interface ExcelColumnStyle {
  column_name: string;
  width?: number;
  horizontal?: string;
  vertical?: string;
  number_format?: string;
}

export interface ExcelBodyStyle {
  font_name?: string;
  font_size?: number;
  font_color?: string;
  bold?: boolean;
  italic?: boolean;
  fill?: string;
  fill_color?: string;
  background_color?: string;
  banding_fill?: string;
  banding_fill_color?: string;
  banding_background_color?: string;
  banding_font_color?: string;
  banding_frequency?: number;
}

export interface ExcelOptions {
  sheet_name?: string;
  auto_filter?: boolean;
  freeze_panes?: string;
  freeze_header?: boolean;
  auto_width?: boolean;
  date_format?: string;
  datetime_format?: string;
  time_format?: string;
  header_style?: ExcelHeaderStyle;
  sheet_header_style?: ExcelHeaderStyle;
  sheet_header?: string;
  sheet_header_row_span?: number;
  sheet_header_enabled?: boolean;
  hidden_columns?: string[];
  column_styles?: ExcelColumnStyle[];
  body_style?: ExcelBodyStyle;
}

export interface ExcelDifferentialStyle {
  fill?: string;
  fill_color?: string;
  background_color?: string;
  font_color?: string;
  bold?: boolean;
  italic?: boolean;
  horizontal?: string;
  vertical?: string;
  wrap_text?: boolean;
}

export interface ExcelConditionalFormat {
  type: string;
  range?: string;
  column_name?: string;
  highlight_scope?: "cell" | "entire_row";
  formula?: string | string[];
  stop_if_true?: boolean;
  operator?: string;
  text?: string;
  rank?: number;
  percent?: boolean;
  bottom?: boolean;
  above_average?: boolean;
  below_average?: boolean;
  equal_average?: boolean;
  time_period?: string;
  colors?: string[];
  color?: string;
  show_value?: boolean;
  icon_style?: string;
  value_type?: string;
  values?: (number | string)[];
  start_type?: string;
  start_value?: string | number;
  end_type?: string;
  end_value?: string | number;
  reverse?: boolean;
  style?: ExcelDifferentialStyle;
}

export type ConnectorTable = {
  table: string;
  selected: boolean;
  sequence: number | null;
  is_delta: boolean;
  table_fields: Record<string, string>;
  selected_fields?: string[] | null;
  output_file_name?: string | null;
  target_folder?: string | null;
  file_format?: "csv" | "json" | "parquet" | "excel" | string | null;
  csv_delimiter?: string | null;
  csv_quote_char?: string | null;
  add_utc_timestamp?: boolean | null;
  notification_email_group_ids?: number[] | null;
  email_custom_fields?: {
    subject?: string;
    subject_styles?: {
      bold?: boolean;
      italic?: boolean;
      color?: string;
      font_family?: string;
      font_size?: string;
    } | null;
    body_fields?: string[];
    greeting_name?: string;
    greeting_styles?: {
      bold?: boolean;
      italic?: boolean;
      color?: string;
      font_family?: string;
      font_size?: string;
    } | null;
    body_content?: string;
    body_styles?: {
      bold?: boolean;
      italic?: boolean;
      color?: string;
      font_family?: string;
      font_size?: string;
    } | null;
    team_name?: string;
    team_styles?: {
      bold?: boolean;
      italic?: boolean;
      color?: string;
      font_family?: string;
      font_size?: string;
    } | null;
    styles?: {
      bold?: boolean;
      italic?: boolean;
      color?: string;
      font_family?: string;
      font_size?: string;
    } | null;
  } | null;
  excel_sheet_name?: string | null;
  excel_options?: ExcelOptions | null;
  excel_conditional_formats?: ExcelConditionalFormat[] | null;
};

export type ConnectorTablesResponse = {
  tables: ConnectorTable[];
  pagination_limit?: number;
};

export interface ConnectorSelectedTable {
  tbl_id: number;
  table: string;
  sequence: number;
  status: "in_progress" | "completed" | "failed" | null;
  output_file_name?: string | null;
  target_folder?: string | null;
  file_format?: "csv" | "json" | "parquet" | "excel" | string | null;
  csv_delimiter?: string | null;
  csv_quote_char?: string | null;
  add_utc_timestamp?: boolean | null;
  notification_email_group_ids?: number[] | null;
  email_custom_fields?: {
    subject?: string;
    subject_styles?: {
      bold?: boolean;
      italic?: boolean;
      color?: string;
      font_family?: string;
      font_size?: string;
    } | null;
    body_fields?: string[];
    greeting_name?: string;
    greeting_styles?: {
      bold?: boolean;
      italic?: boolean;
      color?: string;
      font_family?: string;
      font_size?: string;
    } | null;
    body_content?: string;
    body_styles?: {
      bold?: boolean;
      italic?: boolean;
      color?: string;
      font_family?: string;
      font_size?: string;
    } | null;
    team_name?: string;
    team_styles?: {
      bold?: boolean;
      italic?: boolean;
      color?: string;
      font_family?: string;
      font_size?: string;
    } | null;
    styles?: {
      bold?: boolean;
      italic?: boolean;
      color?: string;
      font_family?: string;
      font_size?: string;
    } | null;
  } | null;
  excel_sheet_name?: string | null;
  excel_options?: ExcelOptions | null;
  excel_conditional_formats?: ExcelConditionalFormat[] | null;
}

// ------------------ Connector Activity Types ------------------

export type Status = "S" | "W" | "E" | "P" | "I";

export type ConnectorActivityLog = {
  message: string;
  user?: string;
  user_name?: string;
  timestamp: string;
  status: Status;
  session_id: number | null;
  is_clickable?: boolean;
  migration_id?: number | null;
  log_id?: number;
  log_type?: string;
  ui_state?: string;
  trigger_type?: string;
};

export type MigrationRecord = {
  table_name: string;
  status: Status;
  timestamp: string;
  job_message: string;
};

export type ConnectorActivityResponse = {
  logs: ConnectorActivityLog[];
  migration_records: MigrationRecord[];
};

export interface TableChange {
  table: string;
  action: string;
  timestamp: string;
  changed_by: string;
  sequence?: number;
  old_sequence?: number;
  new_sequence?: number;
}

export interface ConnectorActivityDetailResponse {
  job_name?: string;
  migration_session_id?: number;
  connection_id?: number;
  overall_status?: string;
  tables?: {
    table_name: string;
    status: string;
    status_icon?: string;
    start_time: string | null;
    end_time: string | null;
    mod_rec?: number;
    del_rec?: number;
    duration?: string | null;
    migration_record_id?: number;
    message?: string;
    error_message?: string;
    staging_records_count?: number;
    already_mapped?: boolean;
    table_name_locked?: boolean;
    mapped_table?: string;
    locked_table_name?: string | null;
  }[];
  total_tables?: number;
  logs?: {
    table: string;
    status: string;
    timestamp: string;
    message: string;
  }[];
  // Fields for table selection logs
  log_id?: number;
  changes?: TableChange[];
  type?: string;
  summary?: string;
  user?: string | null;
}

export interface SchemaStatusResponse {
  is_in_progress: boolean;
  current_job: string | null;
  message?: string;
  tables_fetched?: number;
  total_tables?: number;
}

export type ReverseSchemaResponse = {
  source_tables?: ConnectorTable[];
  destination_tables?: ConnectorTable[];
  tables?: ConnectorTable[];
};
