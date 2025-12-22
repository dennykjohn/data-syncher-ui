import ServerRoutes from "@/constants/server-routes";
import AxiosInstance from "@/lib/axios/api-client";
import { queryClient } from "@/lib/react-query-client";

import { useMutation } from "@tanstack/react-query";

const updateSchema = (connectorId: number) =>
  AxiosInstance.post(ServerRoutes.connector.updateSchema(connectorId));

const useUpdateSchema = ({ connectorId }: { connectorId: number }) => {
  return useMutation({
    mutationKey: ["updateSchema", connectorId],
    mutationFn: () => updateSchema(connectorId),
    onSuccess: () => {
      // Don't show success message here - it will be shown when schema update actually completes
      // The API call succeeded, but the schema update is still processing in the background
      // The completion message will be shown in the Actions component when is_in_progress becomes false
      // Invalidate and refetch queries immediately
      queryClient.invalidateQueries({
        queryKey: ["ConnectorTable", connectorId],
        refetchType: "all",
      });
      // Explicitly refetch to ensure data is updated immediately
      queryClient.refetchQueries({
        queryKey: ["ConnectorTable", connectorId],
      });
    },
  });
};

export default useUpdateSchema;
