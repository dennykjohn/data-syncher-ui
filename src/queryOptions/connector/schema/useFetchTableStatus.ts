import ServerRoutes from "@/constants/server-routes";
import AxiosInstance from "@/lib/axios/api-client";
import { type ConnectorSelectedTable } from "@/types/connectors";

import { useQuery } from "@tanstack/react-query";

type FetchTableStatusResponse = {
  tables: ConnectorSelectedTable[];
};

type GetTableStatusResponse = {
  table_statuses: Array<{
    table_name: string;
    status: string;
  }>;
};

const fetchTableStatus = async (
  id: number,
): Promise<FetchTableStatusResponse> => {
  const { data } = await AxiosInstance.get<GetTableStatusResponse>(
    ServerRoutes.connector.getTableStatus(id),
  );

  const tables: ConnectorSelectedTable[] =
    data.table_statuses?.map((item, index) => ({
      tbl_id: index,
      table: item.table_name,
      sequence: index,
      status: item.status as "in_progress" | "completed" | "failed",
    })) || [];

  return { tables };
};

export default function useFetchTableStatus(
  id: number,
  enabled: boolean = true,
  forcePolling: boolean = false,
) {
  return useQuery<FetchTableStatusResponse>({
    queryKey: ["TableStatus", id],
    queryFn: () => fetchTableStatus(id),
    enabled: !!id && enabled,
    refetchInterval: (query) => {
      if (!enabled || !id) return false;

      const data = query.state.data;

      if (!data) return 2000;

      if (forcePolling) return 2000;

      const hasInProgress = data?.tables?.some(
        (table) => table.status === "in_progress",
      );

      return hasInProgress ? 2000 : false;
    },
  });
}
