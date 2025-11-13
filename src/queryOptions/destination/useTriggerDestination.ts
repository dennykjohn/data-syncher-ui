import ServerRoutes from "@/constants/server-routes";
import AxiosInstance from "@/lib/axios/api-client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

const triggerDestination = async (destinationId: string): Promise<string> => {
  const response = await AxiosInstance.post(
    ServerRoutes.destination.testDestination(Number(destinationId)),
  );
  return response.data.message;
};

export default function useTriggerDestination(destinationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => triggerDestination(destinationId),
    onSuccess: (message: string) => {
      queryClient.invalidateQueries({
        queryKey: ["destinations", "allUserCreatedDestinationList"],
      });
      return message;
    },
  });
}
