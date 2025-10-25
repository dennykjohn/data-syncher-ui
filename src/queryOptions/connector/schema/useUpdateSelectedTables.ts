import ServerRoutes from "@/constants/server-routes";
import AxiosInstance from "@/lib/axios/api-client";

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
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["SelectedTables", connectorId],
      });
    },
  });
};

export default useUpdateSelectedTables;
