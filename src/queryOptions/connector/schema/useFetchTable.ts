import ServerRoutes from "@/constants/server-routes";
import AxiosInstance from "@/lib/axios/api-client";
import { type ConnectorTable } from "@/types/connectors";

import { useQuery } from "@tanstack/react-query";

const fetchConnectorTableById = async (id: number) => {
  const { data } = await AxiosInstance.get(
    ServerRoutes.connector.fetchConnectorTable(id),
  );
  return data.tables as ConnectorTable[];
};

export default function useFetchConnectorTableById(id: number) {
  return useQuery<ConnectorTable[]>({
    queryKey: ["ConnectorTable", id],
    queryFn: () => fetchConnectorTableById(id),
    enabled: !!id,
  });
}
