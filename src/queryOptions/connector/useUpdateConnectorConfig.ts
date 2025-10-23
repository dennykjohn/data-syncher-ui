import ServerRoutes from "@/constants/server-routes";
import AxiosInstance from "@/lib/axios/api-client";
import { type CreateConnectionPayload } from "@/types/connectors";

import { useMutation, useQueryClient } from "@tanstack/react-query";

const updateConnectorConfig = (
  connectorId: number,
  type: string,
  payload: CreateConnectionPayload,
) =>
  AxiosInstance.post(
    ServerRoutes.connector.updateConnectorConfig({ connectorId, type }),
    payload,
  );

const useUpdateConnectorConfig = ({
  connectorId,
  type,
}: {
  connectorId: number;
  type: string;
}) => {
  const queryClient = useQueryClient();
  return useMutation<unknown, unknown, CreateConnectionPayload>({
    mutationFn: (payload) => updateConnectorConfig(connectorId, type, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["connectorConfig", connectorId],
      });
    },
  });
};

export default useUpdateConnectorConfig;
