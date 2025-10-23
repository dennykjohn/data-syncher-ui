import { toaster } from "@/components/ui/toaster";
import ServerRoutes from "@/constants/server-routes";
import AxiosInstance from "@/lib/axios/api-client";

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
    onSuccess: (response) => {
      toaster.warning({
        title: response.data.message,
      });
    },
  });
};

export default useReloadSingleTable;
