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
  destinationName: string;
  accountName: string;
  databaseName: string;
  warehouseName: string;
  username: string;
  password: string;
}

export interface Destination {
  dst: string;
  name: string;
  config_data: {
    account: string;
    database: string;
    warehouse: string;
    username: string;
    password: string;
  };
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
