import ServerRoutes from "@/constants/server-routes";
import AxiosInstance from "@/lib/axios/api-client";
import { type ConnectorSelectedTable } from "@/types/connectors";

import { useQuery } from "@tanstack/react-query";

const fetchSelectedTables = async (id: number) => {
  const { data } = await AxiosInstance.get(
    ServerRoutes.connector.fetchConnectorSelectedTable(id),
  );
  return data as ConnectorSelectedTable[];
};

export default function useFetchSelectedTables(id: number) {
  return useQuery<ConnectorSelectedTable[]>({
    queryKey: ["SelectedTables", id],
    queryFn: () => fetchSelectedTables(id),
    enabled: !!id,
  });
}
