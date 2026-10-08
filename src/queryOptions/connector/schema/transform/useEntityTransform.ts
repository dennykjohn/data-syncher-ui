import ServerRoutes from "@/constants/server-routes";
import {
  TRANSFORM_DRY_RUN_TIMEOUT_MS,
  TRANSFORM_VALIDATE_TIMEOUT_MS,
} from "@/constants/transform-limits";
import AxiosInstance from "@/lib/axios/api-client";
import {
  type EntityTransformDetail,
  type TransformDryRunResponse,
  type TransformValidateResponse,
} from "@/types/connectors";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const transformQueryKey = (connectionId: number, tableName: string) =>
  ["entityTransform", connectionId, tableName] as const;

export function useEntityTransform(connectionId: number, tableName: string) {
  return useQuery({
    queryKey: transformQueryKey(connectionId, tableName),
    queryFn: async () => {
      const { data } = await AxiosInstance.get<{
        active: EntityTransformDetail | null;
        summary: Record<string, unknown>;
        history: Array<Record<string, unknown>>;
      }>(ServerRoutes.connector.entityTransform(connectionId, tableName));
      return data;
    },
    enabled: Boolean(connectionId && tableName),
  });
}

export function useValidateTransform(connectionId: number, tableName: string) {
  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const { data } = await AxiosInstance.post<TransformValidateResponse>(
        ServerRoutes.connector.entityTransformValidate(connectionId, tableName),
        payload,
        { timeout: TRANSFORM_VALIDATE_TIMEOUT_MS },
      );
      return data;
    },
  });
}

export function useDryRunTransform(connectionId: number, tableName: string) {
  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const { data } = await AxiosInstance.post<TransformDryRunResponse>(
        ServerRoutes.connector.entityTransformDryRun(connectionId, tableName),
        payload,
        { timeout: TRANSFORM_DRY_RUN_TIMEOUT_MS },
      );
      return data;
    },
  });
}

export function useSaveTransform(connectionId: number, tableName: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const { data } = await AxiosInstance.post<EntityTransformDetail>(
        ServerRoutes.connector.entityTransform(connectionId, tableName),
        payload,
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: transformQueryKey(connectionId, tableName),
      });
      queryClient.invalidateQueries({
        queryKey: ["ConnectorTable", connectionId],
      });
    },
  });
}

export function useDeactivateTransform(
  connectionId: number,
  tableName: string,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data } = await AxiosInstance.delete(
        ServerRoutes.connector.entityTransform(connectionId, tableName),
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: transformQueryKey(connectionId, tableName),
      });
      queryClient.invalidateQueries({
        queryKey: ["ConnectorTable", connectionId],
      });
    },
  });
}
