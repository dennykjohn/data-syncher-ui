import { type ChangeEvent, useMemo, useState } from "react";

import { Box, Button, Flex, Grid, Input, Text } from "@chakra-ui/react";

import ServerRoutes from "@/constants/server-routes";
import AxiosInstance from "@/lib/axios/api-client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

type BatchRef = {
  id: number;
  name: string;
  table_count: number;
  execution_order: "parallel" | "sequential";
  time_frequency: string;
};

type ConnectionItem = {
  connection_id: number;
  connection_name: string;
  batches: BatchRef[];
};

type PipelineNode = {
  id: number;
  batch_id: number;
  batch_name: string;
  connection_id: number;
  x: number;
  y: number;
  order_index: number;
};

type PipelineEdge = {
  id: number;
  from_node_id: number;
  to_node_id: number;
};

type PipelineDetail = {
  id: number;
  name: string;
  status: "active" | "paused";
  nodes: PipelineNode[];
  edges: PipelineEdge[];
};

const Scheduling = () => {
  const queryClient = useQueryClient();
  const [pipelineName, setPipelineName] = useState("Pipeline 1");
  const [selectedPipelineId, setSelectedPipelineId] = useState<number | null>(
    null,
  );
  const [dragItem, setDragItem] = useState<{
    batchId: number;
    batchName: string;
    connectionId: number;
  } | null>(null);
  const [fromNodeId, setFromNodeId] = useState<number | "">("");
  const [toNodeId, setToNodeId] = useState<number | "">("");

  const { data: sourceList } = useQuery({
    queryKey: ["pipelineConnections"],
    queryFn: async () => {
      const { data } = await AxiosInstance.get<{
        connections: ConnectionItem[];
      }>(ServerRoutes.pipeline.connections());
      return data.connections ?? [];
    },
  });

  const { data: pipelines } = useQuery({
    queryKey: ["pipelines"],
    queryFn: async () => {
      const { data } = await AxiosInstance.get<{ pipelines: PipelineDetail[] }>(
        ServerRoutes.pipeline.list(),
      );
      return data.pipelines ?? [];
    },
  });

  const selectedPipeline = useMemo(
    () => pipelines?.find((p) => p.id === selectedPipelineId) ?? null,
    [pipelines, selectedPipelineId],
  );

  const createPipeline = useMutation({
    mutationFn: async () => {
      const { data } = await AxiosInstance.post<PipelineDetail>(
        ServerRoutes.pipeline.list(),
        {
          name: pipelineName.trim() || "Pipeline",
        },
      );
      return data;
    },
    onSuccess: async (pipeline) => {
      setSelectedPipelineId(pipeline.id);
      await queryClient.invalidateQueries({ queryKey: ["pipelines"] });
    },
  });

  const addNode = useMutation({
    mutationFn: async (payload: {
      pipeline_id: number;
      batch_id: number;
      connection_id: number;
      x: number;
      y: number;
    }) =>
      AxiosInstance.post(
        ServerRoutes.pipeline.nodes(payload.pipeline_id),
        payload,
      ),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["pipelines"] });
    },
  });

  const addEdge = useMutation({
    mutationFn: async (payload: {
      pipeline_id: number;
      from_node_id: number;
      to_node_id: number;
    }) =>
      AxiosInstance.post(
        ServerRoutes.pipeline.edges(payload.pipeline_id),
        payload,
      ),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["pipelines"] });
    },
  });

  const runPipeline = useMutation({
    mutationFn: async (pipelineId: number) =>
      AxiosInstance.post(ServerRoutes.pipeline.run(pipelineId), {}),
  });

  return (
    <Flex direction="column" gap={4}>
      <Flex justifyContent="space-between" alignItems="center">
        <Text fontSize="xl" fontWeight="semibold">
          Scheduling
        </Text>
        <Flex gap={2}>
          <Input
            value={pipelineName}
            size="sm"
            onChange={(e) => setPipelineName(e.target.value)}
            placeholder="Pipeline name"
            maxW="260px"
          />
          <Button
            size="sm"
            colorPalette="brand"
            onClick={() => createPipeline.mutate()}
            loading={createPipeline.isPending}
          >
            Create pipeline
          </Button>
        </Flex>
      </Flex>

      <Grid templateColumns="300px 1fr" gap={4}>
        <Box
          borderWidth={1}
          borderRadius="lg"
          p={3}
          bg="white"
          maxH="75vh"
          overflowY="auto"
        >
          <Text fontSize="sm" fontWeight="semibold" mb={2}>
            Connections and batches
          </Text>
          {(sourceList ?? []).map((conn) => (
            <Box key={conn.connection_id} mb={3}>
              <Text fontSize="sm" fontWeight="bold">
                {conn.connection_name}
              </Text>
              <Flex direction="column" gap={1} mt={1}>
                {conn.batches.map((b) => (
                  <Box
                    key={b.id}
                    draggable
                    onDragStart={() =>
                      setDragItem({
                        batchId: b.id,
                        batchName: b.name,
                        connectionId: conn.connection_id,
                      })
                    }
                    borderWidth={1}
                    borderRadius="md"
                    p={2}
                    cursor="grab"
                    bg="gray.50"
                  >
                    <Text fontSize="xs" fontWeight="semibold">
                      {b.name}
                    </Text>
                    <Text fontSize="xs" color="gray.600">
                      {b.table_count} tables
                    </Text>
                  </Box>
                ))}
              </Flex>
            </Box>
          ))}
        </Box>

        <Box borderWidth={1} borderRadius="lg" p={3} bg="white" minH="75vh">
          <Flex justifyContent="space-between" alignItems="center" mb={2}>
            <Input
              as="select"
              size="sm"
              maxW="260px"
              placeholder="Select pipeline"
              value={selectedPipelineId ?? ""}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setSelectedPipelineId(Number(e.target.value) || null)
              }
            >
              {(pipelines ?? []).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Input>
            <Button
              size="sm"
              colorPalette="purple"
              onClick={() =>
                selectedPipelineId && runPipeline.mutate(selectedPipelineId)
              }
              disabled={!selectedPipelineId}
              loading={runPipeline.isPending}
            >
              Save and execute
            </Button>
          </Flex>

          <Flex gap={2} mb={3}>
            <Input
              as="select"
              size="sm"
              placeholder="From node"
              value={fromNodeId}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setFromNodeId(Number(e.target.value) || "")
              }
              disabled={!selectedPipeline}
            >
              {(selectedPipeline?.nodes ?? []).map((n) => (
                <option key={n.id} value={n.id}>
                  {n.batch_name}
                </option>
              ))}
            </Input>
            <Input
              as="select"
              size="sm"
              placeholder="To node"
              value={toNodeId}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setToNodeId(Number(e.target.value) || "")
              }
              disabled={!selectedPipeline}
            >
              {(selectedPipeline?.nodes ?? []).map((n) => (
                <option key={n.id} value={n.id}>
                  {n.batch_name}
                </option>
              ))}
            </Input>
            <Button
              size="sm"
              onClick={() =>
                selectedPipelineId &&
                fromNodeId &&
                toNodeId &&
                addEdge.mutate({
                  pipeline_id: selectedPipelineId,
                  from_node_id: Number(fromNodeId),
                  to_node_id: Number(toNodeId),
                })
              }
              disabled={!selectedPipelineId || !fromNodeId || !toNodeId}
            >
              Add dependency
            </Button>
          </Flex>

          <Box
            borderWidth={1}
            borderStyle="dashed"
            borderColor="gray.300"
            borderRadius="md"
            minH="62vh"
            position="relative"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (!selectedPipelineId || !dragItem) return;
              const rect = (
                e.currentTarget as HTMLDivElement
              ).getBoundingClientRect();
              const x = Math.max(12, Math.round(e.clientX - rect.left));
              const y = Math.max(12, Math.round(e.clientY - rect.top));
              addNode.mutate({
                pipeline_id: selectedPipelineId,
                batch_id: dragItem.batchId,
                connection_id: dragItem.connectionId,
                x,
                y,
              });
            }}
          >
            {(selectedPipeline?.nodes ?? []).map((n) => (
              <Box
                key={n.id}
                position="absolute"
                left={`${n.x}px`}
                top={`${n.y}px`}
                borderWidth={1}
                borderColor="purple.300"
                bg="purple.50"
                borderRadius="md"
                p={2}
                minW="170px"
              >
                <Text fontSize="xs" fontWeight="semibold">
                  {n.batch_name}
                </Text>
                <Text fontSize="xs" color="gray.600">
                  Node {n.order_index}
                </Text>
              </Box>
            ))}
            {!selectedPipeline && (
              <Text p={4} color="gray.500" fontSize="sm">
                Select or create a pipeline, then drag batches here.
              </Text>
            )}
          </Box>
        </Box>
      </Grid>
    </Flex>
  );
};

export default Scheduling;
