import ServerRoutes from "@/constants/server-routes";
import AxiosInstance from "@/lib/axios/api-client";
import { type SaveMappingsPayload } from "@/types/connectors";

import { useMutation, useQueryClient } from "@tanstack/react-query";

const saveTableMappings = (payload: SaveMappingsPayload) =>
  AxiosInstance.post(ServerRoutes.connector.saveTableMappings(), payload);

const useSaveTableMappings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: SaveMappingsPayload) => saveTableMappings(payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["ReverseSchema", variables.connection_id],
      });
    },
  });
};

export default useSaveTableMappings;
