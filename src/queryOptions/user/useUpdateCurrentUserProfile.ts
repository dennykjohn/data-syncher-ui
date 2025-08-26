import ServerRoutes from "@/constants/server-routes";
import AxiosInstance from "@/lib/axios/api-client";
import { type Destination } from "@/types/destination";

import { useMutation } from "@tanstack/react-query";

const updateDestination = async (
  id: string,
  payload: Destination,
): Promise<Destination> => {
  const response = await AxiosInstance.put(
    ServerRoutes.destination.updateDestination(id),
    payload,
  );
  return response.data;
};

export function useUpdateDestination({ id }: { id: string }) {
  return useMutation<Destination, Error, Destination>({
    mutationFn: (payload) => updateDestination(id, payload),
  });
}
