import { toaster } from "@/components/ui/toaster";
import ServerRoutes from "@/constants/server-routes";
import AxiosInstance from "@/lib/axios/api-client";

import { useMutation } from "@tanstack/react-query";

const updateSchema = (connectorId: number) =>
  AxiosInstance.post(ServerRoutes.connector.updateSchema(connectorId));

const useUpdateSchema = ({ connectorId }: { connectorId: number }) => {
  return useMutation({
    mutationFn: () => updateSchema(connectorId),
    onSuccess: (response) => {
      toaster.warning({
        title: response.data.message,
      });
    },
  });
};

export default useUpdateSchema;
