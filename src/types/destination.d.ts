type MasterDestination = {
  dst_id: number;
  name: string;
};

export type MasterDestinationList = {
  content: Array<MasterDestination>;
  totalElements: number;
  size: number;
};

export interface NewDestinationFormState {
  dst: string;
  destinationName: string;
}

export interface Destination {
  dst: string;
  name: string;
  config_data: Record<string, string>;
}

export type DestinationTableItem = {
  dst_config_id: number;
  name: string;
  dst: string;
  created_at: string;
  updated_at: string;
  cmp: number;
  is_active: boolean;
};
