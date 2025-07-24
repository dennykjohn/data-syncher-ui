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
