export type ConnectorStatus = "A" | "P" | "B";

export interface CreateConnectionPayload {
  connection_name: string;
  destination_schema: string;
  form_data: Record<string, string>;
}

export interface ConnectorConfigResponse {
  source_schema: FieldConfig[]; // Array of fields with read_only property from backend in edit mode
  initial_data: Record<string, string>;
  destination_config: {
    name: string;
    dst: string;
  };
}

export interface ConnectorTableItem {
  connection_id: number;
  connector_name: string;
  source_name: string;
  destination_name: string;
  status: ConnectorStatus;
  readable_time_frequency: string;
  last_synced_new: string;
  next_sync_time: string;
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
  sequence: null;
  is_delta: boolean;
  table_fields: Record<string, string>;
};

export interface ConnectorSelectedTable {
  tbl_id: number;
  table: string;
  sequence: number;
  status: "in_progress" | "completed" | "failed";
}

// ------------------ Connector Activity Types ------------------

type Status = "S" | "W" | "E";

export type ConnectorActivityLog = {
  message: string;
  user: string;
  timestamp: string;
  status: Status;
  session_id: number | null;
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

export interface ConnectorActivityDetailResponse {
  logs: {
    table: string;
    status: string;
    timestamp: string;
    message: string;
  }[];
}

export interface SchemaStatusResponse {
  is_in_progress: boolean;
  current_job?: string;
}
