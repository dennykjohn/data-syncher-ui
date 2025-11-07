import { toaster } from "@/components/ui/toaster";
import ServerRoutes from "@/constants/server-routes";
import AxiosInstance from "@/lib/axios/api-client";
import { queryClient } from "@/lib/react-query-client";

import { useMutation } from "@tanstack/react-query";

interface ReloadSingleTablePayload {
  connection_id: number;
  table_name: string;
}

const reloadSingleTable = (payload: ReloadSingleTablePayload) =>
  AxiosInstance.post(ServerRoutes.connector.reloadSingleTable(), payload);

const useReloadSingleTable = () => {
  return useMutation({
    mutationFn: reloadSingleTable,
    onSuccess: (response, variables) => {
      toaster.warning({ title: response.data.message });
      // ensure schema lists refresh
      queryClient.invalidateQueries({
        queryKey: ["ConnectorTable", variables.connection_id],
      });
      queryClient.invalidateQueries({
        queryKey: ["SelectedTables", variables.connection_id],
      });
    },
  });
};

export default useReloadSingleTable;
