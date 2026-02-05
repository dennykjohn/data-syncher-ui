import { type FieldConfig } from "./form";

export type ConnectorStatus = "A" | "P" | "B";

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
  destination_name: string;
  status: ConnectorStatus;
  readable_time_frequency: string;
  last_synced_new: string;
  next_sync_time: string;
  connected_on: number;
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
  dst_min_count: number;
  dst_max_count: number;
  source_name: string;
  destination_name: string;
  source_title: string;
  destination_title: string;
  company_name: string;
};

export type ConnectorTable = {
  table: string;
  selected: boolean;
  sequence: number | null;
  is_delta: boolean;
  table_fields: Record<string, string>;
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
