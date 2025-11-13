import { AxiosError } from "axios";

import ServerRoutes from "@/constants/server-routes";
import AxiosInstance from "@/lib/axios/api-client";

import {
  UseMutationResult,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

// Function to call backend
const triggerDestination = async (destinationId: string): Promise<string> => {
  if (!destinationId) throw new Error("Destination ID not found");

  try {
    const response = await AxiosInstance.post(
      ServerRoutes.destination.testDestination(Number(destinationId)), // make sure URL ends with /
    );
    // Return backend message
    return response.data.message;
  } catch (err: unknown) {
    let message = "Something went wrong";
    if (err instanceof AxiosError) {
      message =
        err.response?.data?.message ||
        err.response?.data?.detail ||
        err.message;
    } else if (err instanceof Error) {
      message = err.message;
    }
    throw new Error(message);
  }
};

// Hook
export function useTriggerDestination(
  destinationId: string,
): UseMutationResult<string, Error, void, unknown> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => triggerDestination(destinationId),
    onSuccess: (message: string) => {
      queryClient.invalidateQueries({
        queryKey: ["destinations", "allUserCreatedDestinationList"],
      });
      // return the backend message to the component
      return message;
    },
  });
}
