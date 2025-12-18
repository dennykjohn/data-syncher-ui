import ServerRoutes from "@/constants/server-routes";
import AxiosInstance from "@/lib/axios/api-client";
import { type ConnectorSelectedTable } from "@/types/connectors";

import { useQuery } from "@tanstack/react-query";

type FetchSelectedTablesResponse = {
  tables: ConnectorSelectedTable[];
};

type GetTableStatusResponse = {
  table_statuses: Array<{
    table_name: string;
    status: string;
  }>;
};

const fetchSelectedTables = async (
  id: number,
): Promise<FetchSelectedTablesResponse> => {
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
