import ServerRoutes from "@/constants/server-routes";
import AxiosInstance from "@/lib/axios/api-client";
import {
  type AddPipelineNodePayload,
  type CreatePipelinePayload,
  type PatchPipelineNodePayload,
  type PatchPipelinePayload,
  type PipelineConnectionItem,
  type PipelineDetail,
  type PipelineEdgeDto,
  type PipelineNodeDto,
} from "@/types/pipeline";

import {
  type QueryClient,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

export const pipelineConnectionsQueryKey = ["pipelineConnections"] as const;
export const pipelinesQueryKey = ["pipelines"] as const;

function updatePipelineInCache(
  queryClient: QueryClient,
  pipelineId: number,
  updater: (_pipeline: PipelineDetail) => PipelineDetail,
) {
  queryClient.setQueryData<PipelineDetail[]>(pipelinesQueryKey, (pipelines) => {
    if (!pipelines) return pipelines;
    return pipelines.map((p) => (p.id === pipelineId ? updater(p) : p));
  });
}

async function refreshPipelines(queryClient: QueryClient) {
  await queryClient.invalidateQueries({ queryKey: pipelinesQueryKey });
}

export function usePipelineConnections() {
  return useQuery<PipelineConnectionItem[]>({
    queryKey: pipelineConnectionsQueryKey,
    queryFn: async () => {
      const { data } = await AxiosInstance.get<{
        connections: PipelineConnectionItem[];
      }>(ServerRoutes.pipeline.connections());
      return data.connections ?? [];
    },
    staleTime: 60 * 1000,
  });
}

export function usePipelines() {
  return useQuery<PipelineDetail[]>({
    queryKey: pipelinesQueryKey,
    queryFn: async () => {
      const { data } = await AxiosInstance.get<{ pipelines: PipelineDetail[] }>(
        ServerRoutes.pipeline.list(),
      );
      return data.pipelines ?? [];
    },
    staleTime: 30 * 1000,
  });
}

export function useCreatePipeline() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["createPipeline"],
    mutationFn: async (payload: CreatePipelinePayload) => {
      const { data } = await AxiosInstance.post<PipelineDetail>(
        ServerRoutes.pipeline.list(),
        payload,
      );
      return data;
    },
    onSuccess: async (pipeline) => {
      queryClient.setQueryData<PipelineDetail[]>(
        pipelinesQueryKey,
        (pipelines) => [...(pipelines ?? []), pipeline],
      );
      await refreshPipelines(queryClient);
    },
  });
}

export function usePatchPipeline(pipelineId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["patchPipeline", pipelineId],
    mutationFn: async (payload: PatchPipelinePayload) => {
      const { data } = await AxiosInstance.patch<PipelineDetail>(
        ServerRoutes.pipeline.detail(pipelineId),
        payload,
      );
      return data;
    },
    onSuccess: async (updated) => {
      updatePipelineInCache(queryClient, pipelineId, (p) => ({
        ...p,
        ...updated,
        nodes: p.nodes,
        edges: p.edges,
      }));
      await refreshPipelines(queryClient);
    },
  });
}

export function useDeletePipeline() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["deletePipeline"],
    mutationFn: async (pipelineId: number) => {
      await AxiosInstance.delete(ServerRoutes.pipeline.detail(pipelineId));
    },
    onSuccess: async (_data, pipelineId) => {
      queryClient.setQueryData<PipelineDetail[]>(
        pipelinesQueryKey,
        (pipelines) => pipelines?.filter((p) => p.id !== pipelineId) ?? [],
      );
      await refreshPipelines(queryClient);
    },
  });
}

export function useAddPipelineNode(pipelineId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["addPipelineNode", pipelineId],
    mutationFn: async (payload: AddPipelineNodePayload) => {
      const { data } = await AxiosInstance.post<PipelineNodeDto>(
        ServerRoutes.pipeline.nodes(pipelineId),
        payload,
      );
      return data;
    },
    onSuccess: async (node) => {
      updatePipelineInCache(queryClient, pipelineId, (p) => {
        const exists = p.nodes.some((n) => n.id === node.id);
        if (exists) return p;
        return { ...p, nodes: [...p.nodes, node] };
      });
      await refreshPipelines(queryClient);
    },
  });
}

export function useUpdatePipelineNode(pipelineId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["updatePipelineNode", pipelineId],
    mutationFn: async ({
      nodeId,
      payload,
    }: {
      nodeId: number;
      payload: PatchPipelineNodePayload;
    }) => {
      const { data } = await AxiosInstance.patch<PipelineNodeDto>(
        ServerRoutes.pipeline.nodeDetail(pipelineId, nodeId),
        payload,
      );
      return data;
    },
    onSuccess: async (updated) => {
      updatePipelineInCache(queryClient, pipelineId, (p) => ({
        ...p,
        nodes: p.nodes.map((n) =>
          n.id === updated.id ? { ...n, ...updated } : n,
        ),
      }));
      await refreshPipelines(queryClient);
    },
  });
}

export function useDeletePipelineNode(pipelineId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["deletePipelineNode", pipelineId],
    mutationFn: async (nodeId: number) => {
      await AxiosInstance.delete(
        ServerRoutes.pipeline.nodeDetail(pipelineId, nodeId),
      );
      return nodeId;
    },
    onSuccess: async (nodeId) => {
      updatePipelineInCache(queryClient, pipelineId, (p) => ({
        ...p,
        nodes: p.nodes.filter((n) => n.id !== nodeId),
        edges: p.edges.filter(
          (e) => e.from_node_id !== nodeId && e.to_node_id !== nodeId,
        ),
      }));
      await refreshPipelines(queryClient);
    },
  });
}

export function useAddPipelineEdge(pipelineId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["addPipelineEdge", pipelineId],
    mutationFn: async (payload: {
      from_node_id: number;
      to_node_id: number;
    }) => {
      const { data } = await AxiosInstance.post<PipelineEdgeDto>(
        ServerRoutes.pipeline.edges(pipelineId),
        payload,
      );
      return data;
    },
    onSuccess: async (edge) => {
      updatePipelineInCache(queryClient, pipelineId, (p) => {
        const exists = p.edges.some((e) => e.id === edge.id);
        if (exists) return p;
        return { ...p, edges: [...p.edges, edge] };
      });
      await refreshPipelines(queryClient);
    },
  });
}

export function useDeletePipelineEdge(pipelineId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["deletePipelineEdge", pipelineId],
    mutationFn: async (edgeId: number) => {
      await AxiosInstance.delete(
        ServerRoutes.pipeline.edgeDetail(pipelineId, edgeId),
      );
      return edgeId;
    },
    onSuccess: async (edgeId) => {
      updatePipelineInCache(queryClient, pipelineId, (p) => ({
        ...p,
        edges: p.edges.filter((e) => e.id !== edgeId),
      }));
      await refreshPipelines(queryClient);
    },
  });
}

export function useRunPipeline() {
  return useMutation({
    mutationKey: ["runPipeline"],
    mutationFn: async (pipelineId: number) => {
      const { data } = await AxiosInstance.post<{
        message: string;
        pipeline_run_id: number;
      }>(ServerRoutes.pipeline.run(pipelineId), {});
      return data;
    },
  });
}
