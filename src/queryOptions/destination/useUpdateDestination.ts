import ServerRoutes from "@/constants/server-routes";
import AxiosInstance from "@/lib/axios/api-client";
import { type Destination } from "@/types/destination";

import { useMutation, useQueryClient } from "@tanstack/react-query";

const updateDestination = async (
  id: string,
  payload: Destination | FormData,
): Promise<Destination> => {
  const { data } = await AxiosInstance.put(
    ServerRoutes.destination.updateDestination(id),
    payload,
  );
  return data;
};

export function useUpdateDestination({ id }: { id: string }) {
  const queryClient = useQueryClient();
  return useMutation<Destination, Error, Destination | FormData>({
    mutationFn: (payload) => updateDestination(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["destinations", "allUserCreatedDestinationList"],
      });
    },
  });
}
