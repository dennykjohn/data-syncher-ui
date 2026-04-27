import ServerRoutes from "@/constants/server-routes";
import AxiosInstance from "@/lib/axios/api-client";
import { batchesQueryKey } from "@/queryOptions/connector/schema/useBatches";

import { useMutation, useQueryClient } from "@tanstack/react-query";

type UpdateSelectedTablesPayload = {
  selected_tables: string[];
};

const updateSelectedTables = (
  connectorId: number,
  payload: UpdateSelectedTablesPayload,
) =>
  AxiosInstance.post(
    ServerRoutes.connector.updateSelectedTables(connectorId),
    payload,
  );

const useUpdateSelectedTables = ({ connectorId }: { connectorId: number }) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateSelectedTablesPayload) =>
      updateSelectedTables(connectorId, payload),

    onSuccess: async () => {
      // Wait for refetch to complete before resolving
      await queryClient.refetchQueries({
        queryKey: ["ConnectorTable", connectorId],
      });

      queryClient.invalidateQueries({
        queryKey: ["TableStatus", connectorId],
      });

      await queryClient.invalidateQueries({
        queryKey: batchesQueryKey(connectorId),
      });
    },
  });
};

export default useUpdateSelectedTables;
