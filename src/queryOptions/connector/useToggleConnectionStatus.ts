import ServerRoutes from "@/constants/server-routes";
import AxiosInstance from "@/lib/axios/api-client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

const toggleConnectionStatus = (connectorId: number) =>
  AxiosInstance.post(ServerRoutes.connector.toggleStatus(connectorId));

const useToggleConnectionStatus = ({
  connectorId,
}: {
  connectorId: number;
}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => toggleConnectionStatus(connectorId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["connector"],
      });
    },
  });
};

export default useToggleConnectionStatus;
