import ServerRoutes from "@/constants/server-routes";
import {
  TRANSFORM_DRY_RUN_TIMEOUT_MS,
  TRANSFORM_VALIDATE_TIMEOUT_MS,
} from "@/constants/transform-limits";
import AxiosInstance from "@/lib/axios/api-client";
import {
  type EntityTransformDetail,
  type ReverseSchemaResponse,
  type TransformDryRunResponse,
  type TransformValidateResponse,
} from "@/types/connectors";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const transformQueryKey = (connectionId: number, tableName: string) =>
  ["entityTransform", connectionId, tableName] as const;

export type EntityTransformHistoryItem = {
  id: number;
  version: number;
  is_active: boolean;
  status: string;
  created_at: string | null;
  script_sha256?: string;
  entry_point?: string;
};

export type EntityTransformGetResponse = {
  active: EntityTransformDetail | null;
  draft: EntityTransformDetail | null;
  summary: Record<string, unknown>;
  history: EntityTransformHistoryItem[];
};

export function useEntityTransform(connectionId: number, tableName: string) {
  return useQuery({
    queryKey: transformQueryKey(connectionId, tableName),
    queryFn: async () => {
      const { data } = await AxiosInstance.get<EntityTransformGetResponse>(
        ServerRoutes.connector.entityTransform(connectionId, tableName),
      );
      return data;
    },
    enabled: Boolean(connectionId && tableName),
  });
}

export function useValidateTransform(connectionId: number, tableName: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const { data } = await AxiosInstance.post<TransformValidateResponse>(
        ServerRoutes.connector.entityTransformValidate(connectionId, tableName),
        payload,
        { timeout: TRANSFORM_VALIDATE_TIMEOUT_MS },
      );
      return data;
    },
    onSuccess: (data) => {
      if (data.published || data.draft) {
        queryClient.invalidateQueries({
          queryKey: transformQueryKey(connectionId, tableName),
        });
        queryClient.invalidateQueries({
          queryKey: ["ConnectorTable", connectionId],
        });
      }
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

/** Validate and publish source-side Python without SAP mapping analysis. */
export function useValidatePublishSourceScript(
  connectionId: number,
  tableName: string,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const { data } = await AxiosInstance.post<TransformValidateResponse>(
        ServerRoutes.connector.sourceScriptValidatePublish(
          connectionId,
          tableName,
        ),
        payload,
        { timeout: TRANSFORM_VALIDATE_TIMEOUT_MS },
      );
      return data;
    },
    onSuccess: (data) => {
      if (data.target_fields) {
        queryClient.setQueryData<ReverseSchemaResponse>(
          ["ReverseSchema", connectionId],
          (old) => {
            if (!old?.source_tables) return old;
            return {
              ...old,
              source_tables: old.source_tables.map((item) =>
                item.table === tableName
                  ? { ...item, target_fields: data.target_fields }
                  : item,
              ),
            };
          },
        );
      }
      queryClient.invalidateQueries({
        queryKey: transformQueryKey(connectionId, tableName),
      });
      queryClient.invalidateQueries({
        queryKey: ["ConnectorTable", connectionId],
      });
      queryClient.invalidateQueries({
        queryKey: ["ReverseSchema", connectionId],
        refetchType: "none",
      });
    },
  });
}

/** Run the source-side Python script against a bounded Snowflake sample. */
export function useDryRunSourceScript(connectionId: number, tableName: string) {
  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const { data } = await AxiosInstance.post<TransformDryRunResponse>(
        ServerRoutes.connector.sourceScriptDryRun(connectionId, tableName),
        payload,
        { timeout: TRANSFORM_DRY_RUN_TIMEOUT_MS },
      );
      return data;
    },
  });
}

/** Autosave draft (never activates). */
export function useSaveDraftTransform(connectionId: number, tableName: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const { data } = await AxiosInstance.post<EntityTransformDetail>(
        ServerRoutes.connector.entityTransform(connectionId, tableName),
        { ...payload, activate: false },
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: transformQueryKey(connectionId, tableName),
      });
    },
  });
}

/** @deprecated Prefer useSaveDraftTransform — save no longer activates by default. */
export function useSaveTransform(connectionId: number, tableName: string) {
  return useSaveDraftTransform(connectionId, tableName);
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

/** Delete the open draft only; leave the applied version untouched. */
export function useDiscardDraftTransform(
  connectionId: number,
  tableName: string,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data } = await AxiosInstance.delete(
        `${ServerRoutes.connector.entityTransform(connectionId, tableName)}?draft_only=true`,
      );
      return data as { draft_discarded: boolean; deactivated: boolean };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: transformQueryKey(connectionId, tableName),
      });
    },
  });
}

export const transformVersionQueryKey = (
  connectionId: number,
  tableName: string,
  version: number,
) => ["entityTransformVersion", connectionId, tableName, version] as const;

/** Read-only fetch of one transform version (never activates). */
export function useEntityTransformVersion(
  connectionId: number,
  tableName: string,
  version: number | null,
  enabled = true,
) {
  return useQuery({
    queryKey: transformVersionQueryKey(connectionId, tableName, version ?? 0),
    queryFn: async () => {
      const { data } = await AxiosInstance.get<EntityTransformDetail>(
        ServerRoutes.connector.entityTransformVersion(
          connectionId,
          tableName,
          version as number,
        ),
      );
      return data;
    },
    enabled: Boolean(
      connectionId &&
        tableName &&
        version !== null &&
        version !== undefined &&
        enabled,
    ),
  });
}
