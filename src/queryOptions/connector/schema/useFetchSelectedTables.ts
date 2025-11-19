import ServerRoutes from "@/constants/server-routes";
import AxiosInstance from "@/lib/axios/api-client";
import { type ConnectorSelectedTable } from "@/types/connectors";

import { useQuery } from "@tanstack/react-query";

type FetchSelectedTablesResponse = {
  tables: ConnectorSelectedTable[];
};

const fetchSelectedTables = async (
  id: number,
): Promise<FetchSelectedTablesResponse> => {
  const { data } = await AxiosInstance.get(
    ServerRoutes.connector.fetchConnectorSelectedTable(id),
  );
  return data as FetchSelectedTablesResponse;
};

export default function useFetchSelectedTables(id: number) {
  return useQuery<FetchSelectedTablesResponse>({
    queryKey: ["SelectedTables", id],
    queryFn: () => fetchSelectedTables(id),
    enabled: !!id,
    refetchInterval: (query) => {
      const data = query.state.data;
      // Check if any table has "in_progress" status
      const hasInProgress = data?.tables?.some(
        (table) => table.status === "in_progress",
      );
      return hasInProgress ? 2000 : false;
    },
  });
}
