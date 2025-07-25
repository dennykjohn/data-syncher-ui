import ServerRoutes from "@/constants/server-routes";
import AxiosInstance from "@/lib/axios/api-client";
import { type CreateDestinationPayload } from "@/types/destination";

import { useMutation } from "@tanstack/react-query";

interface CreateDestinationResponse {
  message: string;
}

const createDestination = async (
  payload: CreateDestinationPayload,
): Promise<CreateDestinationResponse> => {
  const { data } = await AxiosInstance.post<CreateDestinationResponse>(
    ServerRoutes.destination.createDestination(),
    payload,
  );
  return data;
};

export default function useCreateDestination() {
  return useMutation<
    CreateDestinationResponse,
    Error,
    CreateDestinationPayload
  >({
    mutationFn: createDestination,
  });
}
