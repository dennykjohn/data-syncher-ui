import ServerRoutes from "@/constants/server-routes";
import AxiosInstance from "@/lib/axios/api-client";

import { useQuery } from "@tanstack/react-query";

const fetchConnectorActivity = async (
  id: number,
): Promise<ConnectorActivityResponse> => {
  const { data } = await AxiosInstance.get<ConnectorActivityResponse>(
    ServerRoutes.connector.fetchConnectionActivity(id),
  );
  return data;
};

export const useFetchConnectorActivity = (id: number) => {
  return useQuery({
    queryKey: ["connectorActivity", id],
    queryFn: () => fetchConnectorActivity(id),
    enabled: !!id,
  });
};

export type ConnectorActivityLog = {
  message: string;
  user: string;
  timestamp: string;
  status: string;
};

export type MigrationRecord = {
  table_name: string;
  status: string;
  timestamp: string;
  job_message: string;
};

export type ConnectorActivityResponse = {
  logs: ConnectorActivityLog[];
  migration_records: MigrationRecord[];
};
