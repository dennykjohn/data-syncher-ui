type Destination = {
  dst_id: number;
  name: string;
};

export type MasterDestinationList = {
  content: Array<Destination>;
  totalElements: number;
  size: number;
};
