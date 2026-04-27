import ServerRoutes from "@/constants/server-routes";
import AxiosInstance from "@/lib/axios/api-client";
import {
  type AssignTablesPayload,
  type CreateBatchPayload,
  type FetchBatchesResponse,
  type MigrationBatch,
  type UpdateBatchPayload,
} from "@/types/connectors";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const batchesQueryKey = (connectionId: number) =>
  ["batches", connectionId] as const;

const fetchBatches = async (
  connectionId: number,
): Promise<FetchBatchesResponse> => {
  const { data } = await AxiosInstance.get<FetchBatchesResponse>(
    ServerRoutes.connector.batches.list(connectionId),
  );
  return {
    batches: data?.batches ?? [],
    unassigned_tables: data?.unassigned_tables ?? [],
  };
};

export function useFetchBatches(connectionId: number, enabled: boolean = true) {
  return useQuery<FetchBatchesResponse>({
    queryKey: batchesQueryKey(connectionId),
    queryFn: () => fetchBatches(connectionId),
    enabled: !!connectionId && enabled,
  });
}

export function useCreateBatch(connectionId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["createBatch", connectionId],
    mutationFn: async (payload: CreateBatchPayload) => {
      const { data } = await AxiosInstance.post<MigrationBatch>(
        ServerRoutes.connector.batches.list(connectionId),
        payload,
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: batchesQueryKey(connectionId),
      });
    },
  });
}

export function useUpdateBatch(connectionId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["updateBatch", connectionId],
    mutationFn: ({
      batchId,
      payload,
    }: {
      batchId: number;
      payload: UpdateBatchPayload;
    }) =>
      AxiosInstance.patch<MigrationBatch>(
        ServerRoutes.connector.batches.detail(connectionId, batchId),
        payload,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: batchesQueryKey(connectionId),
      });
    },
  });
}

export function useDeleteBatch(connectionId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["deleteBatch", connectionId],
    mutationFn: (batchId: number) =>
      AxiosInstance.delete(
        ServerRoutes.connector.batches.detail(connectionId, batchId),
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: batchesQueryKey(connectionId),
      });
    },
  });
}

export function useAddTablesToBatch(connectionId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["addTablesToBatch", connectionId],
    mutationFn: ({
      batchId,
      payload,
    }: {
      batchId: number;
      payload: AssignTablesPayload;
    }) =>
      AxiosInstance.post(
        ServerRoutes.connector.batches.assignTables(connectionId, batchId),
        payload,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: batchesQueryKey(connectionId),
      });
    },
  });
}

export function useRemoveTableFromBatch(connectionId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["removeTableFromBatch", connectionId],
    mutationFn: ({
      batchId,
      tableName,
    }: {
      batchId: number;
      tableName: string;
    }) =>
      AxiosInstance.delete(
        ServerRoutes.connector.batches.removeTable(
          connectionId,
          batchId,
          tableName,
        ),
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: batchesQueryKey(connectionId),
      });
    },
  });
}

export function useRunBatchNow(connectionId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["runBatchNow", connectionId],
    mutationFn: (batchId: number) =>
      AxiosInstance.post(
        ServerRoutes.connector.batches.runNow(connectionId, batchId),
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: batchesQueryKey(connectionId),
      });
    },
  });
}

export function useToggleBatch(connectionId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["toggleBatch", connectionId],
    mutationFn: (batchId: number) =>
      AxiosInstance.post(
        ServerRoutes.connector.batches.toggle(connectionId, batchId),
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: batchesQueryKey(connectionId),
      });
    },
  });
}
