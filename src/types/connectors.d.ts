export interface ConnectorTableItem {
  connector_name: string;
  source_name: string;
  destination_name: string;
  status: boolean;
  readable_time_frequency: string;
  last_synced_new: string;
  next_sync_time: string;
}
