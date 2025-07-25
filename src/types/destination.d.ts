type Destination = {
  dst_id: number;
  name: string;
};

export type MasterDestinationList = {
  content: Array<Destination>;
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

export interface CreateDestinationPayload {
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
