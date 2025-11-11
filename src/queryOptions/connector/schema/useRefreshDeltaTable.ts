import { toaster } from "@/components/ui/toaster";
import ServerRoutes from "@/constants/server-routes";
import AxiosInstance from "@/lib/axios/api-client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

interface RefreshDeltaTablePayload {
  connection_id: number;
  table_name: string;
}

const refreshDeltaTable = (payload: RefreshDeltaTablePayload) =>
  AxiosInstance.post(ServerRoutes.connector.refreshDeltaTable(), payload);

export default function useRefreshDeltaTable() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: refreshDeltaTable,
    onSuccess: (response, variables) => {
      toaster.success({ title: response.data.message });

      queryClient.invalidateQueries({
        queryKey: ["SelectedTables", variables.connection_id],
      });
    },
  });
}
