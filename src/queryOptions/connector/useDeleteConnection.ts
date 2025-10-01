import ServerRoutes from "@/constants/server-routes";
import AxiosInstance from "@/lib/axios/api-client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

const deleteConnection = (connectorId: number) =>
  AxiosInstance.post(ServerRoutes.connector.deleteConnection(connectorId));

const useDeleteConnection = ({ connectorId }: { connectorId: number }) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => deleteConnection(connectorId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["connector", connectorId],
      });
    },
  });
};

export default useDeleteConnection;
