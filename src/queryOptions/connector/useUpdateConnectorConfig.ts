import ServerRoutes from "@/constants/server-routes";
import AxiosInstance from "@/lib/axios/api-client";
import { type CreateConnectionPayload } from "@/types/connectors";

import { useMutation, useQueryClient } from "@tanstack/react-query";

interface UpdateConnectionResponse {
  message: string;
  auth_url?: string;
}

const updateConnectorConfig = async (
  connectorId: number,
  type: string,
  payload: CreateConnectionPayload,
): Promise<UpdateConnectionResponse> => {
  const { data } = await AxiosInstance.post(
    ServerRoutes.connector.updateConnectorConfig({ connectorId, type }),
    payload,
  );
  return data;
};

const useUpdateConnectorConfig = ({
  connectorId,
  type,
}: {
  connectorId: number;
  type: string;
}) => {
  const queryClient = useQueryClient();
  return useMutation<
    UpdateConnectionResponse,
    unknown,
    CreateConnectionPayload
  >({
    mutationFn: (payload) => updateConnectorConfig(connectorId, type, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["connectorConfig", connectorId],
      });
    },
  });
};

export default useUpdateConnectorConfig;
