import ServerRoutes from "@/constants/server-routes";
import AxiosInstance from "@/lib/axios/api-client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

const refreshSchema = (connectorId: number) =>
  AxiosInstance.post(ServerRoutes.connector.refreshSchema(connectorId));

const useRefreshSchema = ({ connectorId }: { connectorId: number }) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => refreshSchema(connectorId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["ConnectorTable", connectorId],
      });
    },
  });
};

export default useRefreshSchema;
