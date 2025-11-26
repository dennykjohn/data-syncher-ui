import { toaster } from "@/components/ui/toaster";
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
    onSuccess: (response) => {
      toaster.success({ title: response.data.message });
      // Enable and start the status query to begin polling
      queryClient.setQueryData(["updateSchemaStatus", connectorId], null);
      queryClient.refetchQueries({
        queryKey: ["updateSchemaStatus", connectorId],
      });
      queryClient.invalidateQueries({
        queryKey: ["ConnectorTable", connectorId],
      });
      queryClient.invalidateQueries({
        queryKey: ["SelectedTables", connectorId],
      });
    },
  });
};

export default useUpdateSchema;
