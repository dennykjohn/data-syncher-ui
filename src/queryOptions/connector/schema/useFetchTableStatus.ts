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
      // Don't poll if disabled
      if (!enabled || !id) return false;

      const data = query.state.data;

      // If we don't have data yet, poll to get initial data
      if (!data) return 2000;

      // If forcePolling is true, keep polling even if no tables are in-progress yet
      // This is useful when we just triggered a refresh and waiting for backend to update status
      if (forcePolling) return 2000;

      // Check if any table has "in_progress" status
      const hasInProgress = data?.tables?.some(
        (table) => table.status === "in_progress",
      );

      // Poll every 2 seconds if any table is in progress, otherwise stop
      return hasInProgress ? 2000 : false;
    },
  });
}
