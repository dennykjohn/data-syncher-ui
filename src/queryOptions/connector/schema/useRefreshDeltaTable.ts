import { toaster } from "@/components/ui/toaster";
import ServerRoutes from "@/constants/server-routes";
import AxiosInstance from "@/lib/axios/api-client";

import { useMutation } from "@tanstack/react-query";

interface RefreshDeltaTablePayload {
  connection_id: number;
  table_name: string;
}

const refreshDeltaTable = (payload: RefreshDeltaTablePayload) =>
  AxiosInstance.post(ServerRoutes.connector.refreshDeltaTable(), payload);

const useRefreshDeltaTable = () => {
  return useMutation({
    mutationFn: refreshDeltaTable,
    onSuccess: (response) => {
      toaster.warning({
        title: response.data.message,
      });
    },
  });
};

export default useRefreshDeltaTable;
