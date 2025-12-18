import ServerRoutes from "@/constants/server-routes";
import AxiosInstance from "@/lib/axios/api-client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

interface TestDestinationResponse {
  message?: string;
  auth_url?: string;
}

// Generic payload so backend can receive unsaved edits from the form.
// Shape should match what the test API expects (e.g. { config_data: {...} }).
export type TestDestinationPayload = Record<string, unknown>;

const triggerDestination = async (
  destinationId: string,
  payload?: TestDestinationPayload,
): Promise<TestDestinationResponse> => {
  const response = await AxiosInstance.post<TestDestinationResponse>(
    ServerRoutes.destination.testDestination(Number(destinationId)),
    payload ?? {},
  );
  return response.data;
};

export default function useTriggerDestination(destinationId: string) {
  const queryClient = useQueryClient();

  return useMutation<
    TestDestinationResponse,
    unknown,
    TestDestinationPayload | undefined
  >({
    mutationFn: (payload) => triggerDestination(destinationId, payload),
    onSuccess: (response: TestDestinationResponse) => {
      queryClient.invalidateQueries({
        queryKey: ["destinations", "allUserCreatedDestinationList"],
      });
      return response;
    },
  });
}
