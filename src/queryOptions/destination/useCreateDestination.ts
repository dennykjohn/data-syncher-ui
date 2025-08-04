import ServerRoutes from "@/constants/server-routes";
import AxiosInstance from "@/lib/axios/api-client";
import { type Destination } from "@/types/destination";

import { useMutation } from "@tanstack/react-query";

interface CreateDestinationResponse {
  message: string;
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
  return useMutation<CreateDestinationResponse, Error, Destination>({
    mutationFn: createDestination,
  });
}
