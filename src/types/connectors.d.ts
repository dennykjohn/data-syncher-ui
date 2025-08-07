type ConnectorStatus = "A" | "P" | "B";

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
  company_name: string;
}
