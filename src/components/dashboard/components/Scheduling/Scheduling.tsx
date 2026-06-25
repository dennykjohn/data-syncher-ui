import {
  type DragEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Box,
  Button,
  Flex,
  Grid,
  IconButton,
  Input,
  NativeSelect,
  Text,
} from "@chakra-ui/react";

import { MdPause, MdPlayArrow, MdRefresh } from "react-icons/md";

import { toaster } from "@/components/ui/toaster";
import {
  useAddPipelineEdge,
  useAddPipelineNode,
  useCreatePipeline,
  useDeletePipelineEdge,
  useDeletePipelineNode,
  usePatchPipeline,
  usePipelineConnections,
  usePipelines,
  useRunPipeline,
  useUpdatePipelineNode,
} from "@/queryOptions/pipeline/usePipeline";
import {
  type PipelineConnectionItem,
  type PipelineDetail,
} from "@/types/pipeline";

import BatchFlowNode, { type BatchFlowNodeData } from "./BatchFlowNode";
import BatchOverviewPanel from "./BatchOverviewPanel";
import {
  computeRootNodeIds,
  getParentBatchName,
  layoutPipelineLR,
} from "./pipelineLayout";
import { pipelineScheduleLabel } from "./scheduleOptions";
import {
  Background,
  type Connection,
  Controls,
  type Edge,
  MiniMap,
  type Node,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

export const DRAG_BATCH_MIME = "application/datasyncher-batch";

type SelectedNode = {
  nodeId: number;
  connectionId: number;
  batchId: number;
  connectionName: string;
} | null;

const CONNECTION_STYLES = [
  { bg: "blue.50", border: "blue.300" },
  { bg: "green.50", border: "green.300" },
  { bg: "orange.50", border: "orange.300" },
  { bg: "purple.50", border: "purple.300" },
  { bg: "teal.50", border: "teal.300" },
  { bg: "pink.50", border: "pink.300" },
] as const;

function getConnectionStyle(connectionId: number) {
  return CONNECTION_STYLES[connectionId % CONNECTION_STYLES.length];
}

function findBatchMeta(
  connections: PipelineConnectionItem[],
  connectionId: number,
  batchId: number,
) {
  const conn = connections.find((c) => c.connection_id === connectionId);
  const batch = conn?.batches.find((b) => b.id === batchId);
  return {
    tableCount: batch?.table_count ?? 0,
    executionOrder: batch?.execution_order ?? ("parallel" as const),
  };
}

function pipelineToFlow(
  pipeline: PipelineDetail,
  connections: PipelineConnectionItem[],
  onDeleteNode: (_nodeId: string) => void,
  selectedNode: SelectedNode,
): { nodes: Node<BatchFlowNodeData>[]; edges: Edge[] } {
  const connNameMap = new Map(
    connections.map((c) => [c.connection_id, c.connection_name]),
  );
  const rootIds = new Set(
    pipeline.root_node_ids ??
      computeRootNodeIds(pipeline.nodes, pipeline.edges),
  );
  const scheduleLabel = pipelineScheduleLabel(pipeline);
  const layoutPositions = layoutPipelineLR(pipeline.nodes, pipeline.edges);

  const nodes = pipeline.nodes.map((n) => {
    const style = getConnectionStyle(n.connection_id);
    const meta = findBatchMeta(connections, n.connection_id, n.batch_id);
    const layoutPos = layoutPositions.get(n.id);
    return {
      id: String(n.id),
      type: "batchNode" as const,
      position: layoutPos ?? { x: n.x, y: n.y },
      data: {
        batchId: n.batch_id,
        connectionId: n.connection_id,
        batchName: n.batch_name || n.node_label,
        connectionName:
          connNameMap.get(n.connection_id) ?? `Connection ${n.connection_id}`,
        tableCount: meta.tableCount,
        executionOrder: n.execution_order || meta.executionOrder,
        borderColor: style.border,
        bgColor: style.bg,
        isRoot: rootIds.has(n.id),
        parentBatchName: rootIds.has(n.id)
          ? null
          : getParentBatchName(n.id, pipeline.nodes, pipeline.edges),
        scheduleLabel: rootIds.has(n.id) ? scheduleLabel : null,
        selected: selectedNode?.nodeId === n.id,
        onDelete: onDeleteNode,
      } satisfies BatchFlowNodeData,
    };
  });

  const edges: Edge[] = pipeline.edges.map((e) => ({
    id: String(e.id),
    source: String(e.from_node_id),
    target: String(e.to_node_id),
    sourceHandle: "right",
    targetHandle: "left",
    animated: true,
    style: { stroke: "#805AD5", strokeWidth: 2 },
  }));

  return { nodes, edges };
}

type PipelineCanvasProps = {
  selectedPipeline: PipelineDetail | null;
  connections: PipelineConnectionItem[];
  selectedPipelineId: number | null;
  selectedNode: SelectedNode;
  onSelectNode: (_node: NonNullable<SelectedNode>) => void;
  onClearSelection: () => void;
};

const PipelineCanvas = ({
  selectedPipeline,
  connections,
  selectedPipelineId,
  selectedNode,
  onSelectNode,
  onClearSelection,
}: PipelineCanvasProps) => {
  const { screenToFlowPosition, fitView } = useReactFlow();
  const [nodes, setNodes, onNodesChange] = useNodesState<
    Node<BatchFlowNodeData>
  >([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const prevLayoutKeyRef = useRef("");
  const deleteNodeRef = useRef<(_nodeId: string) => void>(() => {});

  const addNode = useAddPipelineNode(selectedPipelineId ?? 0);
  const updateNode = useUpdatePipelineNode(selectedPipelineId ?? 0);
  const deleteNode = useDeletePipelineNode(selectedPipelineId ?? 0);
  const addEdge = useAddPipelineEdge(selectedPipelineId ?? 0);
  const deleteEdge = useDeletePipelineEdge(selectedPipelineId ?? 0);

  const handleDeleteNode = useCallback(
    async (nodeId: string) => {
      if (!selectedPipelineId) return;
      const node = selectedPipeline?.nodes.find((n) => String(n.id) === nodeId);
      if (node && selectedNode?.nodeId === node.id) {
        onClearSelection();
      }
      try {
        await deleteNode.mutateAsync(Number(nodeId));
        toaster.success({ title: "Batch removed from pipeline" });
      } catch {
        toaster.error({ title: "Failed to remove batch from pipeline" });
      }
    },
    [
      deleteNode,
      onClearSelection,
      selectedNode,
      selectedPipeline,
      selectedPipelineId,
    ],
  );

  useEffect(() => {
    deleteNodeRef.current = handleDeleteNode;
  }, [handleDeleteNode]);

  const stableOnDeleteNode = useCallback((_nodeId: string) => {
    deleteNodeRef.current(_nodeId);
  }, []);

  const pipelineNodeKey = selectedPipeline
    ? `${selectedPipeline.id}:${selectedPipeline.nodes.map((n) => n.id).join(",")}:${selectedPipeline.edges.map((e) => e.id).join(",")}`
    : "";

  useEffect(() => {
    if (!selectedPipeline) {
      setNodes([]);
      setEdges([]);
      prevLayoutKeyRef.current = "";
      return;
    }
    const { nodes: nextNodes, edges: nextEdges } = pipelineToFlow(
      selectedPipeline,
      connections,
      stableOnDeleteNode,
      selectedNode,
    );
    setNodes(nextNodes);
    setEdges(nextEdges);

    const layoutKey = `${selectedPipeline.nodes.length}:${selectedPipeline.edges.length}`;
    if (layoutKey !== prevLayoutKeyRef.current) {
      requestAnimationFrame(() => {
        fitView({ padding: 0.25, duration: 200 });
      });
      prevLayoutKeyRef.current = layoutKey;
    }
  }, [
    pipelineNodeKey,
    selectedPipeline,
    connections,
    selectedNode,
    stableOnDeleteNode,
    setNodes,
    setEdges,
    fitView,
  ]);

  const onDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    async (event: DragEvent) => {
      event.preventDefault();
      if (!selectedPipelineId) {
        toaster.warning({
          title: "Select a pipeline",
          description: "Create or select a pipeline before adding batches.",
        });
        return;
      }

      const raw =
        event.dataTransfer.getData(DRAG_BATCH_MIME) ||
        event.dataTransfer.getData("text/plain");
      if (!raw) {
        toaster.warning({
          title: "Drop failed",
          description:
            "Could not read batch data. Try dragging again from the sidebar.",
        });
        return;
      }

      try {
        const { batchId, connectionId } = JSON.parse(raw) as {
          batchId: number;
          connectionId: number;
        };
        const position = screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        });
        await addNode.mutateAsync({
          batch_id: batchId,
          connection_id: connectionId,
          x: Math.round(position.x),
          y: Math.round(position.y),
        });
        toaster.success({ title: "Batch added to pipeline" });
      } catch (err: unknown) {
        const message =
          (err as { response?: { data?: { error?: string } } })?.response?.data
            ?.error ?? "Could not add batch to pipeline.";
        toaster.error({ title: "Add batch failed", description: message });
      }
    },
    [addNode, screenToFlowPosition, selectedPipelineId],
  );

  const onConnect = useCallback(
    async (connection: Connection) => {
      if (!selectedPipelineId || !connection.source || !connection.target)
        return;
      try {
        await addEdge.mutateAsync({
          from_node_id: Number(connection.source),
          to_node_id: Number(connection.target),
        });
        toaster.success({ title: "Dependency added" });
      } catch (err: unknown) {
        const message =
          (err as { response?: { data?: { error?: string } } })?.response?.data
            ?.error ?? "Invalid dependency (cycles are not allowed).";
        toaster.error({
          title: "Could not add dependency",
          description: message,
        });
      }
    },
    [addEdge, selectedPipelineId],
  );

  const onNodeDragStop = useCallback(
    (
      _event: unknown,
      node: { id: string; position: { x: number; y: number } },
    ) => {
      if (!selectedPipelineId) return;
      updateNode.mutate({
        nodeId: Number(node.id),
        payload: {
          x: Math.round(node.position.x),
          y: Math.round(node.position.y),
        },
      });
    },
    [selectedPipelineId, updateNode],
  );

  const onEdgesDelete = useCallback(
    async (deleted: Edge[]) => {
      if (!selectedPipelineId) return;
      for (const edge of deleted) {
        try {
          await deleteEdge.mutateAsync(Number(edge.id));
        } catch {
          toaster.error({ title: "Failed to remove dependency" });
        }
      }
    },
    [deleteEdge, selectedPipelineId],
  );

  const isValidConnection = useCallback((connection: Connection | Edge) => {
    if (!connection.source || !connection.target) return false;
    if (connection.source === connection.target) return false;
    return true;
  }, []);

  const onNodeClick = useCallback(
    (_event: unknown, node: Node<BatchFlowNodeData>) => {
      const data = node.data;
      onSelectNode({
        nodeId: Number(node.id),
        connectionId: data.connectionId,
        batchId: data.batchId,
        connectionName: data.connectionName,
      });
    },
    [onSelectNode],
  );

  const nodeTypes = useMemo(() => ({ batchNode: BatchFlowNode }), []);

  if (!selectedPipeline) {
    return (
      <Flex
        alignItems="center"
        justifyContent="center"
        h="100%"
        borderWidth={1}
        borderStyle="dashed"
        borderColor="gray.300"
        borderRadius="md"
        bg="gray.50"
      >
        <Text color="gray.500" fontSize="sm" textAlign="center" px={4}>
          Select or create a pipeline, then drag batches from the left panel
          onto this canvas. Connect nodes left to right: drag from the right
          handle to the left handle of the next batch in the chain.
        </Text>
      </Flex>
    );
  }

  return (
    <Box
      h="100%"
      borderRadius="md"
      overflow="hidden"
      borderWidth={1}
      borderColor="gray.200"
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStop={onNodeDragStop}
        onNodeClick={onNodeClick}
        onPaneClick={onClearSelection}
        onEdgesDelete={onEdgesDelete}
        onDragOver={onDragOver}
        onDrop={onDrop}
        isValidConnection={isValidConnection}
        nodeTypes={nodeTypes}
        fitViewOptions={{ padding: 0.25 }}
        deleteKeyCode={["Backspace", "Delete"]}
        edgesReconnectable={false}
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={16} size={1} color="#E2E8F0" />
        <Controls />
        <MiniMap
          nodeStrokeWidth={3}
          zoomable
          pannable
          style={{ height: 100, width: 140 }}
        />
      </ReactFlow>
    </Box>
  );
};

const Scheduling = () => {
  const [pipelineName, setPipelineName] = useState("Pipeline 1");
  const [selectedPipelineId, setSelectedPipelineId] = useState<number | null>(
    null,
  );
  const [expandedConnectionsOverride, setExpandedConnectionsOverride] =
    useState<Set<number> | null>(null);

  const [selectedNode, setSelectedNode] = useState<SelectedNode>(null);

  const {
    data: connections = [],
    isLoading: connectionsLoading,
    isError: connectionsError,
  } = usePipelineConnections();
  const {
    data: pipelines = [],
    isLoading: pipelinesLoading,
    refetch,
  } = usePipelines();

  const activePipelineId = selectedPipelineId ?? pipelines[0]?.id ?? null;
  const allConnectionIds = useMemo(
    () => new Set(connections.map((c) => c.connection_id)),
    [connections],
  );
  const expandedConnections = expandedConnectionsOverride ?? allConnectionIds;

  const totalBatchCount = useMemo(
    () => connections.reduce((sum, c) => sum + c.batches.length, 0),
    [connections],
  );

  const createPipeline = useCreatePipeline();
  const runPipeline = useRunPipeline();
  const patchPipeline = usePatchPipeline(activePipelineId ?? 0);

  const selectedPipeline = useMemo(
    () => pipelines.find((p) => p.id === activePipelineId) ?? null,
    [pipelines, activePipelineId],
  );

  const scheduleSummary = selectedPipeline
    ? pipelineScheduleLabel(selectedPipeline)
    : null;
  const hasNodes = (selectedPipeline?.nodes.length ?? 0) > 0;
  const roots = selectedPipeline
    ? (selectedPipeline.root_node_ids ??
      computeRootNodeIds(selectedPipeline.nodes, selectedPipeline.edges))
    : [];
  const needsSchedule =
    hasNodes && roots.length > 0 && !selectedPipeline?.schedule_type;

  const toggleConnection = (connectionId: number) => {
    setExpandedConnectionsOverride((prev) => {
      const base = prev ?? allConnectionIds;
      const next = new Set(base);
      if (next.has(connectionId)) {
        next.delete(connectionId);
      } else {
        next.add(connectionId);
      }
      return next;
    });
  };

  const handleCreatePipeline = async () => {
    try {
      const pipeline = await createPipeline.mutateAsync({
        name: pipelineName.trim() || "Pipeline",
      });
      setSelectedPipelineId(pipeline.id);
      setPipelineName(`Pipeline ${pipelines.length + 2}`);
      toaster.success({ title: "Pipeline created" });
    } catch {
      toaster.error({ title: "Failed to create pipeline" });
    }
  };

  const handleRunPipeline = async () => {
    if (!activePipelineId) return;
    try {
      const result = await runPipeline.mutateAsync(activePipelineId);
      toaster.success({
        title: "Pipeline started",
        description: result.message,
      });
    } catch {
      toaster.error({ title: "Failed to run pipeline" });
    }
  };

  const handleTogglePipelineStatus = async () => {
    if (!selectedPipeline) return;
    const nextStatus =
      selectedPipeline.status === "active" ? "paused" : "active";
    try {
      await patchPipeline.mutateAsync({ status: nextStatus });
      toaster.success({
        title: nextStatus === "paused" ? "Pipeline paused" : "Pipeline resumed",
      });
    } catch {
      toaster.error({ title: "Failed to update pipeline status" });
    }
  };

  const onBatchDragStart = (
    event: DragEvent<HTMLDivElement>,
    batchId: number,
    connectionId: number,
  ) => {
    const payload = JSON.stringify({ batchId, connectionId });
    event.dataTransfer.setData(DRAG_BATCH_MIME, payload);
    event.dataTransfer.setData("text/plain", payload);
    event.dataTransfer.effectAllowed = "move";
  };

  return (
    <Flex direction="column" gap={4} h="calc(100vh - 120px)" minH="600px">
      <Flex
        justifyContent="space-between"
        alignItems="center"
        flexWrap="wrap"
        gap={3}
      >
        <Text fontSize="xl" fontWeight="semibold">
          Pipeline Flow
        </Text>
        <Flex gap={2} alignItems="center" flexWrap="wrap">
          <NativeSelect.Root size="sm" width="220px">
            <NativeSelect.Field
              value={activePipelineId ?? ""}
              onChange={(e) => {
                setSelectedPipelineId(Number(e.target.value) || null);
                setSelectedNode(null);
              }}
            >
              <option value="">Select pipeline…</option>
              {pipelines.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                  {p.status === "paused" ? " (paused)" : ""}
                </option>
              ))}
            </NativeSelect.Field>
            <NativeSelect.Indicator />
          </NativeSelect.Root>
          <Input
            value={pipelineName}
            size="sm"
            onChange={(e) => setPipelineName(e.target.value)}
            placeholder="New pipeline name"
            maxW="200px"
          />
          <Button
            size="sm"
            colorPalette="brand"
            variant="outline"
            onClick={handleCreatePipeline}
            loading={createPipeline.isPending}
          >
            + New
          </Button>
          <Button
            size="sm"
            colorPalette="brand"
            onClick={handleRunPipeline}
            disabled={
              !activePipelineId || (selectedPipeline?.nodes.length ?? 0) === 0
            }
            loading={runPipeline.isPending}
          >
            <MdPlayArrow />
            Run now
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleTogglePipelineStatus}
            disabled={!activePipelineId}
            loading={patchPipeline.isPending}
          >
            <MdPause />
            {selectedPipeline?.status === "paused" ? "Resume" : "Pause"}
          </Button>
          {scheduleSummary && hasNodes && (
            <Text
              fontSize="xs"
              color="gray.600"
              maxW="200px"
              truncate
              title={scheduleSummary}
            >
              {scheduleSummary}
            </Text>
          )}
          <IconButton
            aria-label="Reload pipelines"
            size="sm"
            variant="ghost"
            onClick={() => refetch()}
          >
            <MdRefresh />
          </IconButton>
        </Flex>
      </Flex>

      {needsSchedule && (
        <Text fontSize="sm" color="orange.600" px={1}>
          Add a root schedule: click the first batch in the chain and set cron
          in the overview panel.
        </Text>
      )}

      <Grid
        templateColumns={selectedNode ? "280px 1fr 340px" : "280px 1fr"}
        gap={4}
        flex="1"
        minH={0}
        alignItems="stretch"
      >
        <Box
          borderWidth={1}
          borderRadius="lg"
          p={3}
          bg="white"
          overflowY="auto"
          minH={0}
        >
          <Text fontSize="sm" fontWeight="semibold" mb={3}>
            Connections &amp; batches
          </Text>
          <Text fontSize="xs" color="gray.500" mb={3}>
            Drag a batch onto the canvas to add it to the selected pipeline.
          </Text>
          {connectionsLoading && (
            <Text fontSize="sm" color="gray.500">
              Loading connections…
            </Text>
          )}
          {connectionsError && (
            <Text fontSize="sm" color="red.600">
              Could not load connections. Refresh the page or try again.
            </Text>
          )}
          {!connectionsLoading &&
            !connectionsError &&
            connections.length === 0 && (
              <Text fontSize="sm" color="gray.500">
                No connectors found for your account.
              </Text>
            )}
          {!connectionsLoading &&
            !connectionsError &&
            connections.length > 0 &&
            totalBatchCount === 0 && (
              <Text fontSize="sm" color="orange.600" mb={3}>
                Connectors are listed below, but none have batches yet. Open a
                connector Schema tab, use Migration Batches, and click New
                batch.
              </Text>
            )}
          {connections.map((conn) => {
            const expanded = expandedConnections.has(conn.connection_id);
            const style = getConnectionStyle(conn.connection_id);
            return (
              <Box key={conn.connection_id} mb={3}>
                <Flex
                  alignItems="center"
                  gap={2}
                  cursor="pointer"
                  onClick={() => toggleConnection(conn.connection_id)}
                  mb={1}
                >
                  <Text fontSize="xs" color="gray.500">
                    {expanded ? "▼" : "▶"}
                  </Text>
                  <Text fontSize="sm" fontWeight="bold" flex="1" truncate>
                    {conn.connection_name}
                  </Text>
                  <Text fontSize="xs" color="gray.500">
                    {conn.batches.length}
                  </Text>
                </Flex>
                {expanded && (
                  <Flex direction="column" gap={1} pl={4}>
                    {conn.batches.length === 0 && (
                      <Text fontSize="xs" color="gray.500">
                        No batches
                      </Text>
                    )}
                    {conn.batches.map((b) => (
                      <Box
                        key={b.id}
                        draggable
                        onDragStart={(e) =>
                          onBatchDragStart(e, b.id, conn.connection_id)
                        }
                        borderWidth={1}
                        borderColor={style.border}
                        borderRadius="md"
                        p={2}
                        cursor="grab"
                        bg={style.bg}
                        _active={{ cursor: "grabbing" }}
                      >
                        <Text fontSize="xs" fontWeight="semibold">
                          {b.name}
                        </Text>
                        <Text fontSize="xs" color="gray.600">
                          {b.table_count} tables · {b.execution_order}
                        </Text>
                      </Box>
                    ))}
                  </Flex>
                )}
              </Box>
            );
          })}
        </Box>

        <Box
          bg="white"
          borderWidth={1}
          borderRadius="lg"
          p={2}
          minH={0}
          h="100%"
        >
          {pipelinesLoading ? (
            <Flex alignItems="center" justifyContent="center" h="100%">
              <Text color="gray.500" fontSize="sm">
                Loading pipeline…
              </Text>
            </Flex>
          ) : (
            <ReactFlowProvider>
              <Box h="100%" minH="480px">
                <PipelineCanvas
                  selectedPipeline={selectedPipeline}
                  connections={connections}
                  selectedPipelineId={activePipelineId}
                  selectedNode={selectedNode}
                  onSelectNode={setSelectedNode}
                  onClearSelection={() => setSelectedNode(null)}
                />
              </Box>
            </ReactFlowProvider>
          )}
        </Box>

        {selectedNode && selectedPipeline && (
          <Box minH={0} h="100%">
            <BatchOverviewPanel
              key={`${selectedPipeline.id}-${selectedNode.nodeId}-${selectedNode.batchId}`}
              pipeline={selectedPipeline}
              nodeId={selectedNode.nodeId}
              connectionId={selectedNode.connectionId}
              batchId={selectedNode.batchId}
              connectionName={selectedNode.connectionName}
              onClose={() => setSelectedNode(null)}
            />
          </Box>
        )}
      </Grid>
    </Flex>
  );
};

export default Scheduling;
