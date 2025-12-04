import ServerRoutes from "@/constants/server-routes";
import AxiosInstance from "@/lib/axios/api-client";
import { type Destination } from "@/types/destination";

import { useMutation, useQueryClient } from "@tanstack/react-query";

interface CreateDestinationResponse {
  message?: string;
  auth_url?: string;
}

const createDestination = async (
  payload: Destination,
): Promise<CreateDestinationResponse> => {
  const { data } = await AxiosInstance.post<CreateDestinationResponse>(
    ServerRoutes.destination.createDestination(),
    payload,
  );
  return data;
};

export default function useCreateDestination() {
  const queryClient = useQueryClient();
  return useMutation<CreateDestinationResponse, Error, Destination>({
    mutationFn: createDestination,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["destinations", "allUserCreatedDestinationList"],
      });
    },
  });
}
