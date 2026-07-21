import {
  type ComponentProps,
  type DragEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Box,
  Button,
  Dialog,
  Flex,
  Grid,
  IconButton,
  Input,
  Portal,
  Tabs,
  Text,
} from "@chakra-ui/react";

import {
  MdAccountTree,
  MdCheckCircle,
  MdChevronLeft,
  MdChevronRight,
  MdDelete,
  MdPause,
  MdPlayArrow,
  MdRestore,
  MdUndo,
} from "react-icons/md";

import { useSearchParams } from "react-router";

import { toaster } from "@/components/ui/toaster";
import { Tooltip } from "@/components/ui/tooltip";
import {
  pipelinesQueryKey,
  useAddPipelineEdge,
  useAddPipelineNode,
  useCreatePipeline,
  useDeletePipeline,
  useDeletePipelineEdge,
  useDeletePipelineNode,
  usePatchPipeline,
  usePipelineConnections,
  usePipelineRun,
  usePipelineRuns,
  usePipelines,
  useResetPipeline,
  useRunPipeline,
  useUpdatePipelineNode,
  useValidatePipeline,
} from "@/queryOptions/pipeline/usePipeline";
import {
  type PipelineConnectionItem,
  type PipelineDetail,
  type PipelineRunDetail,
  type PipelineRunMode,
  type PipelineRunNodeDetail,
  type PipelineValidationResult,
} from "@/types/pipeline";

import BatchFlowNode, { type BatchFlowNodeData } from "./BatchFlowNode";
import BatchOverviewPanel from "./BatchOverviewPanel";
import CanvasFlowModeBadge from "./CanvasFlowModeBadge";
import CanvasGraphViewToggle, {
  type CanvasGraphView,
} from "./CanvasGraphViewToggle";
import PipelineExecutionLogsPanel from "./PipelineExecutionLogsPanel";
import PipelinePicker from "./PipelinePicker";
import PipelineRunPicker from "./PipelineRunPicker";
import PipelineRunProgressPanel from "./PipelineRunProgressPanel";
import PipelineValidationPanel from "./PipelineValidationPanel";
import StartFlowNode, { type StartFlowNodeData } from "./StartFlowNode";
import StartOverviewPanel from "./StartOverviewPanel";
import { type CanvasUndoEntry, pushCanvasUndo } from "./canvasUndo";
import {
  batchNodesOnly,
  buildAutoArrangeUpdates,
  computeDisconnectedBatchIds,
  computeRootNodeIds,
  findEdgeInsertTarget,
  getParentBatchName,
  isStartNode,
  layoutPipelineLR,
  pipelineGraphFingerprint,
  resolvePipelineNodePosition,
} from "./pipelineLayout";
import {
  PIPELINE_NODE,
  type PipelineNodeRunVisualStatus,
} from "./pipelineNodeStyles";
import { resolvePipelineRunStatus } from "./pipelineRunHelpers";
import {
  pipelineScheduleLabel,
  startNodeScheduleLabels,
} from "./scheduleOptions";
import { useQueryClient } from "@tanstack/react-query";
import {
  Background,
  type Connection,
  Controls,
  type Edge,
  MiniMap,
  type Node,
  ReactFlow,
  ReactFlowProvider,
  type Viewport,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

export const DRAG_BATCH_MIME = "application/datasyncher-batch";

type SelectedNode =
  | {
      nodeId: number;
      isStart: true;
    }
  | {
      nodeId: number;
      isStart?: false;
      connectionId: number;
      batchId: number;
      connectionName: string;
    }
  | null;

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

function normalizeNodeRunStatus(
  status: string | undefined,
): PipelineNodeRunVisualStatus {
  const s = (status || "pending").toLowerCase();
  if (s === "in_progress") return "running";
  if (s === "completed") return "completed";
  if (s === "failed" || s === "timeout") return "failed";
  if (s === "running") return "running";
  if (s === "waiting") return "waiting";
  if (s === "skipped") return "skipped";
  return "pending";
}

function resolveRunVisualStatus(
  nodeId: number,
  pipeline: PipelineDetail,
  pipelineRun: PipelineRunDetail | null | undefined,
  runNode: PipelineRunNodeDetail | undefined,
): PipelineNodeRunVisualStatus {
  const migOverall = (
    runNode?.migration_status?.overall_status || ""
  ).toLowerCase();
  if (migOverall === "failed" || migOverall === "timeout") {
    return "failed";
  }
  if (runNode?.status) {
    const normalized = normalizeNodeRunStatus(runNode.status);
    if (normalized !== "pending") return normalized;
  }
  if (!pipelineRun || resolvePipelineRunStatus(pipelineRun) !== "running") {
    return normalizeNodeRunStatus(runNode?.status);
  }

  const parents = pipeline.edges
    .filter((e) => e.to_node_id === nodeId)
    .map((e) => e.from_node_id)
    .filter((pid) => {
      const parent = pipeline.nodes.find((n) => n.id === pid);
      return parent && !isStartNode(parent);
    });

  if (parents.length === 0) {
    return normalizeNodeRunStatus(runNode?.status);
  }

  const runNodeMap = new Map(
    (pipelineRun.nodes ?? []).map((n) => [n.node_id, n]),
  );
  for (const parentId of parents) {
    const parentStatus = normalizeNodeRunStatus(
      runNodeMap.get(parentId)?.status,
    );
    if (parentStatus !== "completed") {
      return "waiting";
    }
  }
  return normalizeNodeRunStatus(runNode?.status);
}

function runNodeVisual(
  nodeId: number,
  pipeline: PipelineDetail,
  pipelineRun: PipelineRunDetail | null | undefined,
  runNode: PipelineRunNodeDetail | undefined,
): Pick<BatchFlowNodeData, "runStatus" | "tablesCompleted" | "tablesTotal"> {
  const runStatus = resolveRunVisualStatus(
    nodeId,
    pipeline,
    pipelineRun,
    runNode,
  );
  if (!runNode) {
    return { runStatus };
  }
  const tables = runNode.migration_status?.tables ?? [];
  const tablesTotal =
    runNode.migration_status?.total_tables ?? runNode.table_count;
  let tablesCompleted = 0;
  for (const table of tables) {
    const icon = (table.status_icon || table.status || "").toLowerCase();
    if (
      icon === "completed" ||
      icon === "success" ||
      icon === "warning" ||
      icon === "failed" ||
      icon === "error"
    ) {
      tablesCompleted += 1;
    }
  }
  return { runStatus, tablesCompleted, tablesTotal };
}

function pipelineToFlow(
  pipeline: PipelineDetail,
  connections: PipelineConnectionItem[],
  onDeleteNode: (_nodeId: string) => void,
  selectedNode: SelectedNode,
  pipelineRun: PipelineRunDetail | null | undefined,
  options: {
    graphView?: CanvasGraphView;
    overlayRunStatus?: boolean;
    animateActiveEdges?: boolean;
  } = {},
): {
  nodes: Node<BatchFlowNodeData | StartFlowNodeData>[];
  edges: Edge[];
} {
  const graphView = options.graphView ?? "draft";
  const overlayRunStatus = options.overlayRunStatus ?? false;
  const animateActiveEdges = options.animateActiveEdges ?? overlayRunStatus;
  const published = pipeline.published_graph;
  const isPublishedView =
    graphView === "published" &&
    Boolean(published?.node_ids?.length || published?.edges?.length);

  const connNameMap = new Map(
    connections.map((c) => [c.connection_id, c.connection_name]),
  );
  const allBatchNodes = batchNodesOnly(pipeline.nodes);
  const startNode = pipeline.nodes.find(isStartNode);
  const { nextSyncLabel } = startNodeScheduleLabels(pipeline);

  const publishedNodeIdSet = new Set(published?.node_ids ?? []);
  const publishedStartNodeId = published?.start_node_id;
  if (
    isPublishedView &&
    publishedStartNodeId !== null &&
    publishedStartNodeId !== undefined
  ) {
    publishedNodeIdSet.add(publishedStartNodeId);
  } else if (isPublishedView && startNode) {
    publishedNodeIdSet.add(startNode.id);
  }

  const batchNodes = isPublishedView
    ? allBatchNodes.filter((n) => publishedNodeIdSet.has(n.id))
    : allBatchNodes;

  const viewNodes = isPublishedView
    ? pipeline.nodes.filter(
        (n) => isStartNode(n) || publishedNodeIdSet.has(n.id),
      )
    : pipeline.nodes;

  const viewEdges = isPublishedView
    ? (published?.edges ?? [])
        .filter(
          (e) =>
            (startNode && e.from_node_id === startNode.id) ||
            publishedNodeIdSet.has(e.from_node_id) ||
            publishedNodeIdSet.has(e.to_node_id),
        )
        .filter((e) => {
          const fromOk =
            (startNode && e.from_node_id === startNode.id) ||
            allBatchNodes.some((n) => n.id === e.from_node_id);
          const toOk = allBatchNodes.some((n) => n.id === e.to_node_id);
          return fromOk && toOk;
        })
        .map((e, idx) => {
          const live = pipeline.edges.find(
            (edge) =>
              edge.from_node_id === e.from_node_id &&
              edge.to_node_id === e.to_node_id,
          );
          return {
            id: live?.id ?? -(idx + 1),
            pipeline_id: pipeline.id,
            from_node_id: e.from_node_id,
            to_node_id: e.to_node_id,
          };
        })
    : pipeline.edges;

  const rootIds = new Set(
    isPublishedView
      ? computeRootNodeIds(viewNodes, viewEdges)
      : (pipeline.root_node_ids ??
        computeRootNodeIds(pipeline.nodes, pipeline.edges)),
  );
  const draftNodeIds = new Set(
    isPublishedView
      ? []
      : pipeline.draft_node_ids?.length
        ? pipeline.draft_node_ids
        : computeDisconnectedBatchIds(pipeline.nodes, pipeline.edges),
  );
  const layoutPositions = layoutPipelineLR(viewNodes, viewEdges);
  const runNodeMap = new Map(
    (pipelineRun?.nodes ?? []).map((n) => [n.node_id, n]),
  );
  const currentNodeId = pipelineRun?.current_node_id ?? null;
  const activeNodeIds = new Set(
    animateActiveEdges
      ? pipelineRun?.current_node_ids?.length
        ? pipelineRun.current_node_ids
        : currentNodeId !== null
          ? [currentNodeId]
          : []
      : [],
  );

  const nodes: Node<BatchFlowNodeData | StartFlowNodeData>[] = [];

  if (startNode && (!isPublishedView || publishedNodeIdSet.has(startNode.id))) {
    nodes.push({
      id: String(startNode.id),
      type: "startNode" as const,
      position: resolvePipelineNodePosition(
        startNode,
        layoutPositions.get(startNode.id),
      ),
      data: {
        selected: selectedNode?.nodeId === startNode.id,
        nextSyncLabel,
      } satisfies StartFlowNodeData,
      draggable: !isPublishedView,
      selectable: true,
    });
  }

  for (const n of batchNodes) {
    const meta = findBatchMeta(connections, n.connection_id!, n.batch_id!);
    const layoutPos = layoutPositions.get(n.id);
    const runVisual = overlayRunStatus
      ? runNodeVisual(n.id, pipeline, pipelineRun, runNodeMap.get(n.id))
      : {};
    nodes.push({
      id: String(n.id),
      type: "batchNode" as const,
      position: resolvePipelineNodePosition(n, layoutPos),
      data: {
        batchId: n.batch_id!,
        connectionId: n.connection_id!,
        batchName: n.batch_name || n.node_label,
        connectionName:
          connNameMap.get(n.connection_id!) ?? `Connection ${n.connection_id}`,
        tableCount: meta.tableCount,
        executionOrder: n.execution_order || meta.executionOrder,
        isRoot: rootIds.has(n.id),
        parentBatchName: rootIds.has(n.id)
          ? null
          : getParentBatchName(n.id, viewNodes, viewEdges),
        isDraft: draftNodeIds.has(n.id),
        selected:
          selectedNode !== null &&
          !selectedNode.isStart &&
          selectedNode.nodeId === n.id,
        onDelete: isPublishedView ? undefined : onDeleteNode,
        ...(overlayRunStatus &&
        pipelineRun?.pipeline_run_id !== null &&
        pipelineRun?.pipeline_run_id !== undefined
          ? { runFillKey: pipelineRun.pipeline_run_id }
          : {}),
        ...runVisual,
      } satisfies BatchFlowNodeData,
      draggable: !isPublishedView,
    });
  }

  const edges: Edge[] = viewEdges.map((e) => ({
    id: String(e.id),
    source: String(e.from_node_id),
    target: String(e.to_node_id),
    sourceHandle: "right",
    targetHandle: "left",
    animated: activeNodeIds.has(e.to_node_id),
    style: {
      stroke: activeNodeIds.has(e.to_node_id)
        ? PIPELINE_NODE.edgeActive
        : PIPELINE_NODE.edge,
      strokeWidth: activeNodeIds.has(e.to_node_id) ? 2 : 1.5,
    },
  }));

  return { nodes, edges };
}

type PipelineCanvasProps = {
  selectedPipeline: PipelineDetail | null;
  connections: PipelineConnectionItem[];
  selectedPipelineId: number | null;
  selectedNode: SelectedNode;
  pipelineRun: PipelineRunDetail | null | undefined;
  graphView: CanvasGraphView;
  onGraphViewChange: (_view: CanvasGraphView) => void;
  flowCanvasMode: PipelineRunMode;
  fitViewNonce?: number;
  onSelectNode: (_node: NonNullable<SelectedNode>) => void;
  onClearSelection: () => void;
  onPushUndo?: (_entry: CanvasUndoEntry) => void;
};

const PipelineCanvas = ({
  selectedPipeline,
  connections,
  selectedPipelineId,
  selectedNode,
  pipelineRun,
  graphView,
  onGraphViewChange,
  flowCanvasMode,
  fitViewNonce = 0,
  onSelectNode,
  onClearSelection,
  onPushUndo,
}: PipelineCanvasProps) => {
  const { screenToFlowPosition, fitView, setViewport, getViewport } =
    useReactFlow();
  const [nodes, setNodes, onNodesChange] = useNodesState<
    Node<BatchFlowNodeData | StartFlowNodeData>
  >([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const prevLayoutKeyRef = useRef("");
  const prevPipelineIdRef = useRef<number | null>(null);
  const deleteNodeRef = useRef<(_nodeId: string) => void>(() => {});

  const addNode = useAddPipelineNode(selectedPipelineId ?? 0);
  const updateNode = useUpdatePipelineNode(selectedPipelineId ?? 0);
  const deleteNode = useDeletePipelineNode(selectedPipelineId ?? 0);
  const addEdge = useAddPipelineEdge(selectedPipelineId ?? 0);
  const deleteEdge = useDeletePipelineEdge(selectedPipelineId ?? 0);

  const handleDeleteNode = useCallback(
    async (nodeId: string) => {
      if (!selectedPipelineId || !selectedPipeline) return;
      const node = selectedPipeline.nodes.find((n) => String(n.id) === nodeId);
      if (!node || isStartNode(node)) return;
      if (node && selectedNode?.nodeId === node.id) {
        onClearSelection();
      }
      try {
        await deleteNode.mutateAsync(Number(nodeId));
        if (node.batch_id !== null && node.connection_id !== null) {
          onPushUndo?.({
            type: "readdNode",
            payload: {
              batch_id: node.batch_id,
              connection_id: node.connection_id,
              x: Math.round(node.x),
              y: Math.round(node.y),
            },
          });
        }
        toaster.success({
          title: "Batch removed",
          description: "Dependencies reconnected automatically.",
        });
      } catch {
        toaster.error({ title: "Failed to remove batch from pipeline" });
      }
    },
    [
      deleteNode,
      onClearSelection,
      onPushUndo,
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

  const isPublishedView = graphView === "published";
  const isRunLive =
    pipelineRun !== null &&
    pipelineRun !== undefined &&
    resolvePipelineRunStatus(pipelineRun) === "running";
  const hasPublishedGraph = Boolean(
    selectedPipeline?.has_published_graph && selectedPipeline?.published_graph,
  );
  const draftMatchesPublished =
    hasPublishedGraph &&
    selectedPipeline?.canvas_changed_since_publish !== true;
  // Only Published view (or draft that matches publish) shows run progress/status.
  // Draft with unpublished changes never overlays sync status on the canvas.
  const overlayRunStatus =
    isPublishedView || draftMatchesPublished ? Boolean(pipelineRun) : false;
  const animateActiveEdges = overlayRunStatus && isRunLive;
  const showGraphViewToggle =
    hasPublishedGraph &&
    selectedPipeline?.canvas_changed_since_publish === true;

  const pipelineNodeKey = selectedPipeline
    ? `${selectedPipeline.id}:${graphView}:${selectedPipeline.nodes.map((n) => n.id).join(",")}:${selectedPipeline.edges.map((e) => e.id).join(",")}:${selectedPipeline.published_graph?.fingerprint ?? ""}:${selectedPipeline.next_run_at ?? ""}:${selectedPipeline.readable_schedule ?? ""}:${overlayRunStatus}:${animateActiveEdges}:${pipelineRun?.pipeline_run_id ?? ""}:${pipelineRun?.status ?? ""}:${(pipelineRun?.nodes ?? []).map((n) => `${n.node_id}:${n.status}`).join(",")}`
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
      pipelineRun,
      { graphView, overlayRunStatus, animateActiveEdges },
    );
    setNodes(nextNodes);
    setEdges(nextEdges);
  }, [
    pipelineNodeKey,
    selectedPipeline,
    connections,
    selectedNode,
    pipelineRun,
    graphView,
    overlayRunStatus,
    animateActiveEdges,
    stableOnDeleteNode,
    setNodes,
    setEdges,
  ]);

  useEffect(() => {
    if (!selectedPipeline || !selectedPipelineId) return;

    const layoutKey = `${selectedPipeline.nodes.length}:${selectedPipeline.edges.length}`;
    const savedViewport = loadPipelineViewport(selectedPipelineId);
    const pipelineChanged = prevPipelineIdRef.current !== selectedPipelineId;
    const layoutChanged = layoutKey !== prevLayoutKeyRef.current;

    if (!pipelineChanged && !layoutChanged) return;

    prevPipelineIdRef.current = selectedPipelineId;
    prevLayoutKeyRef.current = layoutKey;

    requestAnimationFrame(() => {
      if (savedViewport) {
        setViewport(savedViewport, { duration: 0 });
      } else {
        fitView({ padding: 0.25, duration: pipelineChanged ? 200 : 150 });
      }
    });
  }, [selectedPipeline, selectedPipelineId, setViewport, fitView]);

  useEffect(() => {
    if (!fitViewNonce || !selectedPipeline || !selectedPipelineId) return;
    requestAnimationFrame(() => {
      fitView({ padding: 0.25, duration: 300 });
      window.setTimeout(() => {
        savePipelineViewport(selectedPipelineId, getViewport());
      }, 320);
    });
  }, [
    fitViewNonce,
    selectedPipeline,
    selectedPipelineId,
    fitView,
    getViewport,
  ]);

  const onMoveEnd = useCallback(
    (_event: unknown, viewport: Viewport) => {
      if (selectedPipelineId) {
        savePipelineViewport(selectedPipelineId, viewport);
      }
    },
    [selectedPipelineId],
  );

  const onDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    async (event: DragEvent) => {
      event.preventDefault();
      if (isPublishedView) return;
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
        const layoutPositions = selectedPipeline
          ? layoutPipelineLR(selectedPipeline.nodes, selectedPipeline.edges)
          : new Map();
        const insertBetween =
          selectedPipeline &&
          findEdgeInsertTarget(
            position,
            selectedPipeline.nodes,
            selectedPipeline.edges,
            layoutPositions,
          );
        await addNode
          .mutateAsync({
            batch_id: batchId,
            connection_id: connectionId,
            x: Math.round(position.x),
            y: Math.round(position.y),
            ...(insertBetween ? { insert_between: insertBetween } : {}),
          })
          .then((created) => {
            onPushUndo?.({ type: "removeNode", nodeId: created.id });
          });
        toaster.success({
          title: insertBetween ? "Batch inserted" : "Batch added to pipeline",
        });
      } catch (err: unknown) {
        const message =
          (err as { response?: { data?: { error?: string } } })?.response?.data
            ?.error ?? "Could not add batch to pipeline.";
        toaster.error({ title: "Add batch failed", description: message });
      }
    },
    [
      addNode,
      isPublishedView,
      onPushUndo,
      screenToFlowPosition,
      selectedPipeline,
      selectedPipelineId,
    ],
  );

  const onConnect = useCallback(
    async (connection: Connection) => {
      if (isPublishedView) return;
      if (!selectedPipelineId || !connection.source || !connection.target)
        return;
      try {
        const edge = await addEdge.mutateAsync({
          from_node_id: Number(connection.source),
          to_node_id: Number(connection.target),
        });
        onPushUndo?.({ type: "removeEdge", edgeId: edge.id });
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
    [addEdge, isPublishedView, onPushUndo, selectedPipelineId],
  );

  const onNodeDragStop = useCallback(
    (
      _event: unknown,
      node: { id: string; position: { x: number; y: number } },
    ) => {
      if (isPublishedView || !selectedPipelineId) return;
      updateNode.mutate({
        nodeId: Number(node.id),
        payload: {
          x: Math.round(node.position.x),
          y: Math.round(node.position.y),
        },
      });
    },
    [isPublishedView, selectedPipelineId, updateNode],
  );

  const onEdgesDelete = useCallback(
    async (deleted: Edge[]) => {
      if (isPublishedView || !selectedPipelineId) return;
      for (const edge of deleted) {
        try {
          const fromId = Number(edge.source);
          const toId = Number(edge.target);
          await deleteEdge.mutateAsync(Number(edge.id));
          if (fromId && toId) {
            onPushUndo?.({
              type: "readdEdge",
              from_node_id: fromId,
              to_node_id: toId,
            });
          }
        } catch {
          toaster.error({ title: "Failed to remove dependency" });
        }
      }
    },
    [deleteEdge, isPublishedView, onPushUndo, selectedPipelineId],
  );

  const isValidConnection = useCallback(
    (connection: Connection | Edge) => {
      if (!connection.source || !connection.target) return false;
      if (connection.source === connection.target) return false;
      if (!selectedPipeline) return true;
      const targetNode = selectedPipeline.nodes.find(
        (n) => String(n.id) === connection.target,
      );
      if (targetNode && isStartNode(targetNode)) return false;
      return true;
    },
    [selectedPipeline],
  );

  const onNodeClick = useCallback(
    (_event: unknown, node: Node<BatchFlowNodeData | StartFlowNodeData>) => {
      if (node.type === "startNode") {
        onSelectNode({ nodeId: Number(node.id), isStart: true });
        return;
      }
      const data = node.data as BatchFlowNodeData;
      onSelectNode({
        nodeId: Number(node.id),
        connectionId: data.connectionId,
        batchId: data.batchId,
        connectionName: data.connectionName,
      });
    },
    [onSelectNode],
  );

  const nodeTypes = useMemo(
    () => ({ batchNode: BatchFlowNode, startNode: StartFlowNode }),
    [],
  );

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
        onNodesChange={isPublishedView ? undefined : onNodesChange}
        onEdgesChange={isPublishedView ? undefined : onEdgesChange}
        onConnect={onConnect}
        onNodeDragStop={onNodeDragStop}
        onMoveEnd={onMoveEnd}
        onNodeClick={onNodeClick}
        onPaneClick={onClearSelection}
        onEdgesDelete={onEdgesDelete}
        onDragOver={isPublishedView ? undefined : onDragOver}
        onDrop={onDrop}
        isValidConnection={isPublishedView ? () => false : isValidConnection}
        nodeTypes={nodeTypes}
        fitViewOptions={{ padding: 0.25 }}
        nodesDraggable={!isPublishedView}
        nodesConnectable={!isPublishedView}
        elementsSelectable
        deleteKeyCode={isPublishedView ? null : ["Backspace", "Delete"]}
        edgesReconnectable={false}
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={16} size={1} color="#E2E8F0" />
        <CanvasFlowModeBadge mode={flowCanvasMode} />
        <Controls />
        <CanvasGraphViewToggle
          value={graphView}
          onChange={onGraphViewChange}
          visible={showGraphViewToggle}
        />
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

function suggestPipelineName(pipelines: PipelineDetail[]): string {
  const used = new Set(pipelines.map((p) => p.name.trim().toLowerCase()));
  for (let i = 1; i < 1000; i += 1) {
    const name = `Pipeline ${i}`;
    if (!used.has(name.toLowerCase())) return name;
  }
  return `Pipeline ${Date.now()}`;
}

const LAST_PIPELINE_STORAGE_KEY = "datasyncher:last_pipeline_id";

const pipelineViewportStorageKey = (pipelineId: number) =>
  `datasyncher:pipeline_viewport:${pipelineId}`;

const loadPipelineViewport = (pipelineId: number): Viewport | null => {
  try {
    const raw = localStorage.getItem(pipelineViewportStorageKey(pipelineId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Viewport;
    if (
      typeof parsed.x === "number" &&
      typeof parsed.y === "number" &&
      typeof parsed.zoom === "number"
    ) {
      return parsed;
    }
  } catch {
    // ignore corrupt storage
  }
  return null;
};

const savePipelineViewport = (pipelineId: number, viewport: Viewport) => {
  try {
    localStorage.setItem(
      pipelineViewportStorageKey(pipelineId),
      JSON.stringify(viewport),
    );
  } catch {
    // ignore quota errors
  }
};

const persistLastPipelineId = (pipelineId: number) => {
  try {
    localStorage.setItem(LAST_PIPELINE_STORAGE_KEY, String(pipelineId));
  } catch {
    // ignore storage errors (private mode, quota, etc.)
  }
};

const readStoredPipelineId = (): number | null => {
  try {
    const stored = localStorage.getItem(LAST_PIPELINE_STORAGE_KEY);
    if (!stored) return null;
    const id = Number(stored);
    return Number.isFinite(id) ? id : null;
  } catch {
    return null;
  }
};

const resolveDefaultPipelineId = (
  pipelines: PipelineDetail[],
  currentId: number | null,
): number | null => {
  if (pipelines.length === 0) return null;

  if (currentId !== null && pipelines.some((p) => p.id === currentId)) {
    return currentId;
  }

  const storedId = readStoredPipelineId();
  if (storedId !== null && pipelines.some((p) => p.id === storedId)) {
    return storedId;
  }

  const latest = [...pipelines].sort(
    (a, b) =>
      new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
  )[0];
  return latest?.id ?? null;
};

type PipelineToolbarIconProps = {
  label: string;
  tooltip?: string;
  children: ReactNode;
} & ComponentProps<typeof IconButton>;

const PipelineToolbarIcon = ({
  label,
  tooltip,
  children,
  disabled,
  ...buttonProps
}: PipelineToolbarIconProps) => (
  <Tooltip content={tooltip ?? label} openDelay={200} showArrow>
    <Box as="span" display="inline-flex">
      <IconButton
        aria-label={label}
        size="sm"
        variant="ghost"
        disabled={disabled}
        borderRadius="md"
        color="gray.600"
        _hover={{ bg: "gray.100", color: "gray.800" }}
        {...buttonProps}
      >
        {children}
      </IconButton>
    </Box>
  </Tooltip>
);

type PipelineValidationSnapshot = {
  pipelineId: number;
  graphFingerprint: string;
  result: PipelineValidationResult;
};

const validationResultFromError = (err: unknown): PipelineValidationResult => {
  const data = (
    err as {
      response?: {
        data?: Partial<PipelineValidationResult> & { error?: string };
      };
    }
  )?.response?.data;
  if (data && Array.isArray(data.errors) && data.errors.length > 0) {
    return {
      valid: false,
      errors: data.errors,
      warnings: data.warnings ?? [],
      levels: data.levels ?? [],
      max_nodes_per_level: data.max_nodes_per_level ?? 2,
      draft_node_ids: data.draft_node_ids,
      has_published_graph: data.has_published_graph,
      published_at: data.published_at,
      canvas_changed_since_publish: data.canvas_changed_since_publish,
    };
  }
  return {
    valid: false,
    errors: data?.error ? [data.error] : ["Pipeline validation failed."],
    warnings: data?.warnings ?? [],
    levels: data?.levels ?? [],
    max_nodes_per_level: data?.max_nodes_per_level ?? 2,
    draft_node_ids: data?.draft_node_ids,
    has_published_graph: data?.has_published_graph,
    published_at: data?.published_at,
    canvas_changed_since_publish: data?.canvas_changed_since_publish,
  };
};

const Scheduling = () => {
  const [newPipelineDialogOpen, setNewPipelineDialogOpen] = useState(false);
  const [newPipelineName, setNewPipelineName] = useState("");
  const [selectedPipelineId, setSelectedPipelineId] = useState<number | null>(
    null,
  );
  const [expandedConnections, setExpandedConnections] = useState<Set<number>>(
    () => new Set(),
  );
  const [connectionSearch, setConnectionSearch] = useState("");

  const [selectedNode, setSelectedNode] = useState<SelectedNode>(null);
  const [activeRunId, setActiveRunId] = useState<number | null>(null);
  const [pinnedRunId, setPinnedRunId] = useState<number | null>(null);
  const [executionLogProcessName, setExecutionLogProcessName] = useState<
    string | null
  >(null);
  const [centerViewTab, setCenterViewTab] = useState<"flow" | "logs">("flow");
  const [graphView, setGraphView] = useState<CanvasGraphView>("draft");
  const [batchesPanelCollapsed, setBatchesPanelCollapsed] = useState(() => {
    try {
      return (
        localStorage.getItem("ds.scheduling.batchesPanelCollapsed") === "1"
      );
    } catch {
      return false;
    }
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [fitViewNonce, setFitViewNonce] = useState(0);
  const [isAutoArranging, setIsAutoArranging] = useState(false);
  const [canvasUndoStack, setCanvasUndoStack] = useState<CanvasUndoEntry[]>([]);
  const [isUndoing, setIsUndoing] = useState(false);
  const [validationSnapshot, setValidationSnapshot] =
    useState<PipelineValidationSnapshot | null>(null);
  const [validationPanelDismissed, setValidationPanelDismissed] =
    useState(false);

  const toggleBatchesPanelCollapsed = useCallback(() => {
    setBatchesPanelCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(
          "ds.scheduling.batchesPanelCollapsed",
          next ? "1" : "0",
        );
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const {
    data: connections = [],
    isLoading: connectionsLoading,
    isError: connectionsError,
  } = usePipelineConnections();
  const { data: pipelines = [], isLoading: pipelinesLoading } = usePipelines();
  const [searchParams, setSearchParams] = useSearchParams();
  const skipNextPinClearRef = useRef(false);
  const deepLinkHandledRef = useRef(false);

  useEffect(() => {
    if (pipelinesLoading || deepLinkHandledRef.current) return;

    const pipelineParam = searchParams.get("pipeline");
    const pipelineNameParam = searchParams.get("pipelineName");
    const tabParam = searchParams.get("tab");
    const runParam = searchParams.get("run");
    const processParam = searchParams.get("process");
    const hasDeepLink =
      Boolean(pipelineParam) ||
      Boolean(pipelineNameParam) ||
      tabParam === "logs" ||
      Boolean(runParam) ||
      Boolean(processParam);

    if (!hasDeepLink) {
      setSelectedPipelineId((current) => {
        const resolved = resolveDefaultPipelineId(pipelines, current);
        if (resolved !== null) persistLastPipelineId(resolved);
        return resolved;
      });
      deepLinkHandledRef.current = true;
      return;
    }

    let targetId: number | null = null;
    if (pipelineParam) {
      const id = Number(pipelineParam);
      if (Number.isFinite(id) && pipelines.some((p) => p.id === id)) {
        targetId = id;
      }
    }
    if (targetId === null && pipelineNameParam) {
      const match = pipelines.find((p) => p.name === pipelineNameParam);
      if (match) targetId = match.id;
    }

    const runId = runParam ? Number(runParam) : NaN;
    const hasRun = Number.isFinite(runId);

    if (targetId !== null) {
      skipNextPinClearRef.current = hasRun;
      setSelectedPipelineId(targetId);
      persistLastPipelineId(targetId);
      setSelectedNode(null);
      setGraphView("draft");
      setValidationSnapshot(null);
      setValidationPanelDismissed(false);
    } else {
      setSelectedPipelineId((current) => {
        const resolved = resolveDefaultPipelineId(pipelines, current);
        if (resolved !== null) persistLastPipelineId(resolved);
        return resolved;
      });
    }

    if (tabParam === "logs") {
      setCenterViewTab("logs");
    }

    if (hasRun) {
      setPinnedRunId(runId);
      setActiveRunId(runId);
    }
    setExecutionLogProcessName(processParam);

    deepLinkHandledRef.current = true;
    setSearchParams({}, { replace: true });
  }, [pipelines, pipelinesLoading, searchParams, setSearchParams]);

  const selectPipeline = useCallback((pipelineId: number | null) => {
    setSelectedPipelineId(pipelineId);
    if (pipelineId !== null) persistLastPipelineId(pipelineId);
    setSelectedNode(null);
    setActiveRunId(null);
    setCenterViewTab("flow");
    setExecutionLogProcessName(null);
    setGraphView("draft");
    setValidationSnapshot(null);
    setValidationPanelDismissed(false);
    setCanvasUndoStack([]);
  }, []);

  const createPipeline = useCreatePipeline();

  const totalBatchCount = useMemo(
    () => connections.reduce((sum, c) => sum + c.batches.length, 0),
    [connections],
  );

  const filteredConnections = useMemo(() => {
    const q = connectionSearch.trim().toLowerCase();
    if (!q) return connections;
    return connections
      .map((conn) => {
        const nameMatch = conn.connection_name.toLowerCase().includes(q);
        const batches = nameMatch
          ? conn.batches
          : conn.batches.filter((b) => b.name.toLowerCase().includes(q));
        return {
          ...conn,
          batches,
          nameMatch,
        };
      })
      .filter((conn) => conn.nameMatch || conn.batches.length > 0)
      .map(({ nameMatch: _nameMatch, ...conn }) => conn);
  }, [connections, connectionSearch]);

  const searchActive = connectionSearch.trim().length > 0;

  const queryClient = useQueryClient();
  const deletePipeline = useDeletePipeline();
  const runPipeline = useRunPipeline();
  const validatePipeline = useValidatePipeline();
  const resetPipeline = useResetPipeline();
  const updateNode = useUpdatePipelineNode(selectedPipelineId ?? 0);
  const addNode = useAddPipelineNode(selectedPipelineId ?? 0);
  const deleteNode = useDeletePipelineNode(selectedPipelineId ?? 0);
  const addEdge = useAddPipelineEdge(selectedPipelineId ?? 0);
  const deleteEdge = useDeletePipelineEdge(selectedPipelineId ?? 0);
  const patchPipeline = usePatchPipeline(selectedPipelineId ?? 0);

  const pushCanvasUndoEntry = useCallback((entry: CanvasUndoEntry) => {
    setCanvasUndoStack((prev) => pushCanvasUndo(prev, entry));
  }, []);

  const handleCanvasUndo = useCallback(async () => {
    if (!selectedPipelineId || canvasUndoStack.length === 0 || isUndoing) {
      return;
    }
    const entry = canvasUndoStack[canvasUndoStack.length - 1];
    setCanvasUndoStack((prev) => prev.slice(0, -1));
    setIsUndoing(true);
    try {
      switch (entry.type) {
        case "positions":
          await Promise.all(
            entry.positions.map((p) =>
              updateNode.mutateAsync({
                nodeId: p.nodeId,
                payload: { x: p.x, y: p.y },
              }),
            ),
          );
          setFitViewNonce((n) => n + 1);
          toaster.success({ title: "Layout restored" });
          break;
        case "removeNode":
          await deleteNode.mutateAsync(entry.nodeId);
          toaster.success({ title: "Add undone" });
          break;
        case "readdNode":
          await addNode.mutateAsync(entry.payload);
          toaster.success({ title: "Removal undone" });
          break;
        case "removeEdge":
          await deleteEdge.mutateAsync(entry.edgeId);
          toaster.success({ title: "Dependency undone" });
          break;
        case "readdEdge":
          await addEdge.mutateAsync({
            from_node_id: entry.from_node_id,
            to_node_id: entry.to_node_id,
          });
          toaster.success({ title: "Dependency restored" });
          break;
        default:
          break;
      }
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error ?? "Could not undo the last change.";
      toaster.error({ title: "Undo failed", description: message });
    } finally {
      setIsUndoing(false);
    }
  }, [
    addEdge,
    addNode,
    canvasUndoStack,
    deleteEdge,
    deleteNode,
    isUndoing,
    selectedPipelineId,
    updateNode,
  ]);

  const selectedPipeline = useMemo(
    () => pipelines.find((p) => p.id === selectedPipelineId) ?? null,
    [pipelines, selectedPipelineId],
  );

  useEffect(() => {
    // No published graph, or draft matches published → stay on Draft (hide Published switch).
    if (
      !selectedPipeline?.has_published_graph ||
      !selectedPipeline.published_graph ||
      selectedPipeline.canvas_changed_since_publish !== true
    ) {
      setGraphView("draft");
    }
  }, [
    selectedPipeline?.id,
    selectedPipeline?.has_published_graph,
    selectedPipeline?.published_graph,
    selectedPipeline?.canvas_changed_since_publish,
  ]);

  const graphFingerprint = useMemo(
    () =>
      selectedPipeline
        ? pipelineGraphFingerprint(
            selectedPipeline.nodes,
            selectedPipeline.edges,
          )
        : "",
    [selectedPipeline],
  );

  const validationAppliesToCurrentGraph =
    validationSnapshot !== null &&
    validationSnapshot.pipelineId === selectedPipelineId &&
    validationSnapshot.graphFingerprint === graphFingerprint;

  const validationStale =
    selectedPipeline?.canvas_changed_since_publish === true ||
    (validationSnapshot !== null &&
      validationSnapshot.pipelineId === selectedPipelineId &&
      validationSnapshot.graphFingerprint !== graphFingerprint);

  const hasPublishedGraph = selectedPipeline?.has_published_graph === true;

  /** Draft / Published label shown as a float inside the Flow canvas. */
  const flowCanvasMode: PipelineRunMode =
    graphView === "published"
      ? "published"
      : hasPublishedGraph &&
          selectedPipeline?.canvas_changed_since_publish !== true
        ? "published"
        : "draft";

  const showUnpublishedBanner =
    graphView === "draft" &&
    selectedPipeline?.canvas_changed_since_publish === true &&
    selectedPipeline?.has_published_graph === true;

  const showValidationErrors =
    graphView === "draft" &&
    validationSnapshot !== null &&
    validationAppliesToCurrentGraph &&
    !validationSnapshot.result.valid;

  const panelStale =
    graphView === "draft" &&
    !showValidationErrors &&
    (validationStale ||
      (showUnpublishedBanner && !validationAppliesToCurrentGraph));

  const showValidationPanel =
    graphView === "draft" &&
    !validationPanelDismissed &&
    (showUnpublishedBanner ||
      showValidationErrors ||
      (validationSnapshot !== null &&
        validationSnapshot.pipelineId === selectedPipelineId &&
        validationAppliesToCurrentGraph &&
        validationSnapshot.result.valid) ||
      validationStale);

  const { data: pipelineRun } = usePipelineRun(selectedPipelineId, activeRunId);
  const { data: pipelineRunsData } = usePipelineRuns(selectedPipelineId);
  const pipelineRuns = pipelineRunsData?.runs ?? [];
  const previousRunStatusRef = useRef<string | null>(null);

  useEffect(() => {
    if (!selectedPipelineId) {
      setActiveRunId(null);
      setPinnedRunId(null);
      return;
    }
    if (skipNextPinClearRef.current) {
      skipNextPinClearRef.current = false;
      return;
    }
    setPinnedRunId(null);
  }, [selectedPipelineId]);

  const latestRunIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!selectedPipelineId) {
      setActiveRunId(null);
      latestRunIdRef.current = null;
      return;
    }
    if (pipelineRuns.length === 0) {
      // Keep any deep-linked / pinned run id while runs are still loading.
      return;
    }
    const latestId = pipelineRuns[0].pipeline_run_id;
    const latestChanged =
      latestRunIdRef.current !== null && latestRunIdRef.current !== latestId;
    latestRunIdRef.current = latestId;

    if (latestChanged) {
      setPinnedRunId(null);
      setActiveRunId(latestId);
      return;
    }

    if (pinnedRunId !== null) {
      const pinnedStillExists = pipelineRuns.some(
        (run) => run.pipeline_run_id === pinnedRunId,
      );
      if (!pinnedStillExists) {
        // Keep showing the requested run id until the list includes it.
        setActiveRunId(pinnedRunId);
        return;
      }
      if (pinnedRunId !== latestId) {
        setActiveRunId(pinnedRunId);
        return;
      }
      setPinnedRunId(null);
    }
    setActiveRunId(latestId);
  }, [selectedPipelineId, pipelineRuns, pinnedRunId]);

  useEffect(() => {
    if (!selectedPipelineId || selectedPipeline?.status !== "active") return;
    const timer = window.setInterval(() => {
      void queryClient.invalidateQueries({ queryKey: pipelinesQueryKey });
    }, 60_000);
    return () => window.clearInterval(timer);
  }, [selectedPipelineId, queryClient, selectedPipeline?.status]);

  useEffect(() => {
    if (!selectedPipelineId || !pipelineRun) {
      previousRunStatusRef.current = null;
      return;
    }

    const nextStatus = resolvePipelineRunStatus(pipelineRun);
    const previousStatus = previousRunStatusRef.current;
    previousRunStatusRef.current = nextStatus;

    if (previousStatus === "running" && nextStatus !== "running") {
      void queryClient.invalidateQueries({
        queryKey: ["pipelineRuns", selectedPipelineId],
      });
      void queryClient.invalidateQueries({ queryKey: pipelinesQueryKey });
    }
  }, [pipelineRun, queryClient, selectedPipelineId]);

  const handleRunSelect = useCallback(
    (runId: number) => {
      const latestId = pipelineRuns[0]?.pipeline_run_id ?? null;
      if (latestId !== null && runId === latestId) {
        setPinnedRunId(null);
      } else {
        setPinnedRunId(runId);
      }
      setActiveRunId(runId);
      setExecutionLogProcessName(null);
    },
    [pipelineRuns],
  );

  const handleRunStarted = useCallback((runId: number) => {
    setPinnedRunId(null);
    setActiveRunId(runId);
    setCenterViewTab("logs");
  }, []);

  const handleCenterViewTabChange = useCallback((tab: "flow" | "logs") => {
    setCenterViewTab(tab);
  }, []);

  const selectedRunNode = useMemo(() => {
    if (!pipelineRun || !selectedNode || selectedNode.isStart) return null;
    return (
      pipelineRun.nodes.find((n) => n.node_id === selectedNode.nodeId) ?? null
    );
  }, [pipelineRun, selectedNode]);

  const batchNodeCount = selectedPipeline
    ? batchNodesOnly(selectedPipeline.nodes).length
    : 0;
  const roots = selectedPipeline
    ? (selectedPipeline.root_node_ids ??
      computeRootNodeIds(selectedPipeline.nodes, selectedPipeline.edges))
    : [];
  const needsSchedule =
    batchNodeCount > 0 && roots.length > 0 && !selectedPipeline?.schedule_type;
  const hasRunningPipelineRun =
    (pipelineRun !== null &&
      pipelineRun !== undefined &&
      resolvePipelineRunStatus(pipelineRun) === "running") ||
    pipelineRuns.some(
      (run) => resolvePipelineRunStatus(run as PipelineRunDetail) === "running",
    );
  const canValidatePipeline =
    Boolean(selectedPipelineId) &&
    batchNodeCount > 0 &&
    graphView === "draft" &&
    !validatePipeline.isPending;

  const validateDisabledReason = !selectedPipelineId
    ? "Select a pipeline"
    : batchNodeCount === 0
      ? "Add batches to the pipeline"
      : graphView === "published"
        ? "Switch to Draft flow to validate canvas changes"
        : undefined;

  const canRunPipeline =
    batchNodeCount > 0 &&
    hasPublishedGraph &&
    !runPipeline.isPending &&
    !hasRunningPipelineRun;

  const runDisabledReason = !selectedPipelineId
    ? "Select a pipeline"
    : batchNodeCount === 0
      ? "Add batches to the pipeline"
      : !hasPublishedGraph
        ? "Validate the Draft flow before running"
        : hasRunningPipelineRun
          ? "A run is already in progress"
          : undefined;

  const hasDraftCanvasChanges =
    hasPublishedGraph &&
    (selectedPipeline?.canvas_changed_since_publish === true ||
      (selectedPipeline?.draft_node_ids?.length ?? 0) > 0);

  const canResetPipeline =
    Boolean(selectedPipelineId) &&
    hasDraftCanvasChanges &&
    graphView === "draft" &&
    !resetPipeline.isPending &&
    !hasRunningPipelineRun;

  const resetDisabledReason = !selectedPipelineId
    ? "Select a pipeline"
    : !hasPublishedGraph
      ? "Validate the pipeline first"
      : graphView === "published"
        ? "Switch to Draft flow to reset canvas changes"
        : hasRunningPipelineRun
          ? "Wait for the current run to finish"
          : !hasDraftCanvasChanges
            ? "Canvas already matches the published flow"
            : undefined;

  const scheduleSummary = selectedPipeline
    ? pipelineScheduleLabel(selectedPipeline)
    : null;

  const toggleConnection = (connectionId: number) => {
    setExpandedConnections((prev) => {
      const next = new Set(prev);
      if (next.has(connectionId)) {
        next.delete(connectionId);
      } else {
        next.add(connectionId);
      }
      return next;
    });
  };

  const openNewPipelineDialog = () => {
    setNewPipelineName(suggestPipelineName(pipelines));
    setNewPipelineDialogOpen(true);
  };

  const handleCreatePipeline = async () => {
    const trimmed = newPipelineName.trim();
    let name = trimmed || suggestPipelineName(pipelines);
    if (
      pipelines.some((p) => p.name.trim().toLowerCase() === name.toLowerCase())
    ) {
      name = suggestPipelineName(pipelines);
    }
    try {
      const pipeline = await createPipeline.mutateAsync({ name });
      selectPipeline(pipeline.id);
      setNewPipelineDialogOpen(false);
      setNewPipelineName("");
      toaster.success({ title: "Pipeline created" });
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error ?? "Failed to create pipeline.";
      toaster.error({
        title: "Failed to create pipeline",
        description: message,
      });
    }
  };

  const handleValidatePipeline = async () => {
    if (!selectedPipelineId || !selectedPipeline) return;
    if (graphView !== "draft") {
      toaster.error({
        title: "Validate from Draft",
        description:
          "Switch to Draft flow to validate and publish canvas changes.",
      });
      return;
    }
    setValidationPanelDismissed(false);

    try {
      const result = await validatePipeline.mutateAsync(selectedPipelineId);
      setValidationSnapshot({
        pipelineId: selectedPipelineId,
        graphFingerprint,
        result,
      });
      if (result.valid) {
        void queryClient.invalidateQueries({ queryKey: pipelinesQueryKey });
        toaster.success({
          title: "Pipeline published",
          description: "You can run this flow now. Schedule will use it too.",
        });
      } else {
        toaster.error({
          title: "Pipeline validation failed",
          description: `${result.errors.length} issue${result.errors.length === 1 ? "" : "s"} found. See details below.`,
        });
      }
    } catch (err: unknown) {
      const result = validationResultFromError(err);
      setValidationSnapshot({
        pipelineId: selectedPipelineId,
        graphFingerprint,
        result,
      });
      toaster.error({
        title: "Pipeline validation failed",
        description: `${result.errors.length} issue${result.errors.length === 1 ? "" : "s"} found. See details below.`,
      });
    }
  };

  const handleResetPipeline = async () => {
    if (!selectedPipelineId) return;
    if (graphView !== "draft") {
      toaster.error({
        title: "Reset from Draft",
        description: "Switch to Draft flow to discard canvas changes.",
      });
      return;
    }

    try {
      await resetPipeline.mutateAsync(selectedPipelineId);
      setValidationSnapshot(null);
      setValidationPanelDismissed(true);
      setGraphView("published");
      setSelectedNode(null);
      setCanvasUndoStack([]);
      toaster.success({
        title: "Restored published flow",
        description: "Draft nodes and canvas changes were removed.",
      });
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error ?? "Failed to restore the published flow.";
      toaster.error({
        title: "Reset failed",
        description: message,
      });
    }
  };

  const handleRunPipeline = async () => {
    if (!selectedPipelineId) return;
    if (!hasPublishedGraph) {
      toaster.error({
        title: "Validate before running",
        description:
          runDisabledReason ??
          "Validate the Draft flow first, then run the published flow.",
      });
      return;
    }
    try {
      const result = await runPipeline.mutateAsync(selectedPipelineId);
      setValidationSnapshot(null);
      handleRunStarted(result.pipeline_run_id);
      toaster.success({
        title: "Pipeline started",
        description: result.message,
      });
    } catch (err: unknown) {
      const data = (
        err as {
          response?: {
            data?: { error?: string; errors?: string[]; warnings?: string[] };
          };
        }
      )?.response?.data;
      if (data?.errors?.length) {
        setValidationPanelDismissed(false);
        setValidationSnapshot({
          pipelineId: selectedPipelineId,
          graphFingerprint,
          result: {
            valid: false,
            errors: data.errors,
            warnings: data.warnings ?? [],
            levels: [],
            max_nodes_per_level: 2,
          },
        });
      }
      const messages = data?.errors?.length
        ? data.errors
        : data?.error
          ? [data.error]
          : ["Failed to run pipeline."];
      toaster.error({
        title: "Failed to run pipeline",
        description: messages.join(" "),
      });
    }
  };

  const handleAutoArrange = async () => {
    if (!selectedPipeline || !selectedPipelineId) return;
    const updates = buildAutoArrangeUpdates(
      selectedPipeline.nodes,
      selectedPipeline.edges,
    );
    if (!updates.length) {
      toaster.info({
        title: "Nothing to arrange",
        description: "Add batches to the pipeline first.",
      });
      return;
    }
    const previousPositions = selectedPipeline.nodes
      .filter((n) => !isStartNode(n))
      .map((n) => ({
        nodeId: n.id,
        x: Math.round(n.x),
        y: Math.round(n.y),
      }));
    setIsAutoArranging(true);
    try {
      await Promise.all(
        updates.map((update) =>
          updateNode.mutateAsync({
            nodeId: update.nodeId,
            payload: { x: update.x, y: update.y },
          }),
        ),
      );
      pushCanvasUndoEntry({ type: "positions", positions: previousPositions });
      setFitViewNonce((n) => n + 1);
      toaster.success({
        title: "Flow arranged",
        description: "Nodes aligned left-to-right by dependency order.",
      });
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error ?? "Could not save the new layout.";
      toaster.error({ title: "Auto-arrange failed", description: message });
    } finally {
      setIsAutoArranging(false);
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

  const handleDeletePipeline = async () => {
    if (!selectedPipelineId || !selectedPipeline) return;
    try {
      await deletePipeline.mutateAsync(selectedPipelineId);
      const remaining = pipelines.filter((p) => p.id !== selectedPipelineId);
      const nextId = resolveDefaultPipelineId(remaining, null);
      selectPipeline(nextId);
      setDeleteDialogOpen(false);
      toaster.success({
        title: "Pipeline deleted",
        description: `"${selectedPipeline.name}" was removed.`,
      });
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error ?? "Failed to delete pipeline.";
      toaster.error({
        title: "Failed to delete pipeline",
        description: message,
      });
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
      <Box>
        <Flex
          justifyContent="space-between"
          alignItems="center"
          gap={3}
          flexWrap={{ base: "wrap", lg: "nowrap" }}
        >
          <Text fontSize="xl" fontWeight="semibold" flexShrink={0}>
            Pipeline Flow
          </Text>
          <Flex
            gap={2}
            alignItems="center"
            flexWrap="nowrap"
            overflowX="auto"
            pb={1}
            ml={{ base: 0, lg: "auto" }}
          >
            <PipelinePicker
              pipelines={pipelines}
              selectedPipelineId={selectedPipelineId}
              onSelect={selectPipeline}
            />
            <Button
              size="sm"
              colorPalette="brand"
              variant="outline"
              onClick={openNewPipelineDialog}
              flexShrink={0}
            >
              + New
            </Button>
          </Flex>
        </Flex>
        {scheduleSummary && batchNodeCount > 0 && (
          <Text fontSize="xs" color="gray.600" mt={2} px={1}>
            Schedule: {scheduleSummary}
          </Text>
        )}
      </Box>

      <Dialog.Root
        lazyMount
        open={deleteDialogOpen}
        onOpenChange={(e) => setDeleteDialogOpen(e.open)}
      >
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content maxW="md">
              <Dialog.Header>
                <Dialog.Title>Delete pipeline?</Dialog.Title>
              </Dialog.Header>
              <Dialog.Body>
                <Text fontSize="sm" color="gray.700">
                  This will permanently delete{" "}
                  <Text as="span" fontWeight="semibold">
                    {selectedPipeline?.name ?? "this pipeline"}
                  </Text>
                  , including all nodes and connections on the canvas. This
                  cannot be undone.
                </Text>
              </Dialog.Body>
              <Dialog.Footer>
                <Button
                  variant="outline"
                  onClick={() => setDeleteDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  colorPalette="red"
                  onClick={handleDeletePipeline}
                  loading={deletePipeline.isPending}
                >
                  Delete pipeline
                </Button>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>

      <Dialog.Root
        lazyMount
        open={newPipelineDialogOpen}
        onOpenChange={(e) => setNewPipelineDialogOpen(e.open)}
      >
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content maxW="md">
              <Dialog.Header>
                <Dialog.Title>New pipeline</Dialog.Title>
              </Dialog.Header>
              <Dialog.Body>
                <Text fontSize="sm" color="gray.600" mb={2}>
                  Enter a name for the new pipeline.
                </Text>
                <Input
                  value={newPipelineName}
                  size="sm"
                  autoFocus
                  placeholder="Pipeline name"
                  onChange={(e) => setNewPipelineName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      void handleCreatePipeline();
                    }
                  }}
                />
              </Dialog.Body>
              <Dialog.Footer>
                <Button
                  variant="outline"
                  onClick={() => setNewPipelineDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  colorPalette="brand"
                  onClick={() => void handleCreatePipeline()}
                  loading={createPipeline.isPending}
                  disabled={!newPipelineName.trim()}
                >
                  Create pipeline
                </Button>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>

      {needsSchedule && (
        <Text fontSize="sm" color="orange.600" px={1}>
          Add a schedule: click the Start node and configure timing in the
          panel.
        </Text>
      )}

      <Grid
        templateColumns={
          batchesPanelCollapsed
            ? selectedNode
              ? "44px 1fr 340px"
              : "44px 1fr"
            : selectedNode
              ? "280px 1fr 340px"
              : "280px 1fr"
        }
        gap={4}
        flex="1"
        minH={0}
        alignItems="stretch"
        transition="grid-template-columns 0.2s ease"
      >
        <Box
          borderWidth={1}
          borderRadius="lg"
          p={batchesPanelCollapsed ? 1 : 3}
          bg="white"
          overflow={batchesPanelCollapsed ? "hidden" : "auto"}
          minH={0}
          position="relative"
        >
          {batchesPanelCollapsed ? (
            <Flex
              direction="column"
              alignItems="center"
              h="100%"
              pt={1}
              gap={3}
            >
              <Tooltip content="Show connections & batches" showArrow>
                <IconButton
                  aria-label="Expand connections and batches panel"
                  size="xs"
                  variant="ghost"
                  colorPalette="gray"
                  onClick={toggleBatchesPanelCollapsed}
                >
                  <MdChevronRight />
                </IconButton>
              </Tooltip>
              <Text
                fontSize="2xs"
                fontWeight="semibold"
                color="gray.500"
                style={{
                  writingMode: "vertical-rl",
                  transform: "rotate(180deg)",
                }}
                whiteSpace="nowrap"
                userSelect="none"
              >
                Connections &amp; batches
              </Text>
            </Flex>
          ) : (
            <>
              <Flex
                alignItems="flex-start"
                justifyContent="space-between"
                gap={2}
                mb={3}
              >
                <Text fontSize="sm" fontWeight="semibold">
                  Connections &amp; batches
                </Text>
                <Tooltip content="Hide panel" showArrow>
                  <IconButton
                    aria-label="Collapse connections and batches panel"
                    size="xs"
                    variant="ghost"
                    colorPalette="gray"
                    flexShrink={0}
                    onClick={toggleBatchesPanelCollapsed}
                  >
                    <MdChevronLeft />
                  </IconButton>
                </Tooltip>
              </Flex>
              <Text fontSize="xs" color="gray.500" mb={3}>
                Drag a batch onto the canvas to add it to the selected pipeline.
              </Text>
              <Input
                size="sm"
                mb={3}
                placeholder="Search connections or batches…"
                value={connectionSearch}
                onChange={(e) => setConnectionSearch(e.target.value)}
                aria-label="Search connections or batches"
              />
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
                filteredConnections.length === 0 && (
                  <Text fontSize="sm" color="gray.500" mb={3}>
                    No connections or batches match “{connectionSearch.trim()}”.
                  </Text>
                )}
              {!connectionsLoading &&
                !connectionsError &&
                connections.length > 0 &&
                totalBatchCount === 0 &&
                !searchActive && (
                  <Text fontSize="sm" color="orange.600" mb={3}>
                    Connectors are listed below, but none have batches yet. Open
                    a connector Schema tab (including Reverse ETL and file
                    export connectors such as Amazon S3), use Migration Batches,
                    and click New batch.
                  </Text>
                )}
              {filteredConnections.map((conn) => {
                const expanded =
                  searchActive || expandedConnections.has(conn.connection_id);
                return (
                  <Box key={conn.connection_id} mb={2}>
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
                            borderColor="gray.200"
                            borderRadius="md"
                            p={2}
                            cursor="grab"
                            bg="white"
                            _hover={{
                              borderColor: "brand.300",
                              bg: "brand.50",
                            }}
                            _active={{ cursor: "grabbing" }}
                          >
                            <Text
                              fontSize="xs"
                              fontWeight="semibold"
                              color="gray.800"
                            >
                              {b.name}
                            </Text>
                            <Text fontSize="2xs" color="gray.500">
                              {b.table_count} tables · {b.execution_order}
                            </Text>
                          </Box>
                        ))}
                      </Flex>
                    )}
                  </Box>
                );
              })}
            </>
          )}
        </Box>

        <Box
          bg="white"
          borderWidth={1}
          borderRadius="lg"
          p={2}
          minH={0}
          h="100%"
          display="flex"
          flexDirection="column"
          overflow="hidden"
        >
          {pipelinesLoading ? (
            <Flex alignItems="center" justifyContent="center" h="100%">
              <Text color="gray.500" fontSize="sm">
                Loading pipeline…
              </Text>
            </Flex>
          ) : (
            <Tabs.Root
              value={centerViewTab}
              onValueChange={(d) =>
                handleCenterViewTabChange(d.value as "flow" | "logs")
              }
              variant="line"
              colorPalette="brand"
              flex="1"
              display="flex"
              flexDirection="column"
              minH={0}
            >
              <Flex
                alignItems="center"
                gap={2}
                borderBottomWidth={1}
                borderColor="gray.100"
                px={2}
                py={1}
                flexWrap="nowrap"
                minW={0}
              >
                <Flex
                  flex="1"
                  alignItems="center"
                  gap={2}
                  minW={0}
                  justifyContent="flex-start"
                  overflow="hidden"
                >
                  <Tabs.List flexShrink={0} borderBottomWidth={0}>
                    <Tabs.Trigger value="flow" fontSize="sm" py={2} px={3}>
                      Flow
                    </Tabs.Trigger>
                    <Tabs.Trigger value="logs" fontSize="sm" py={2} px={3}>
                      Execution logs
                    </Tabs.Trigger>
                  </Tabs.List>
                </Flex>

                {pipelineRuns.length > 0 && (
                  <Flex
                    flexShrink={0}
                    px={2}
                    maxW="min(360px, 44vw)"
                    w="100%"
                    justifyContent="center"
                  >
                    <PipelineRunPicker
                      runs={pipelineRuns}
                      selectedRunId={
                        activeRunId ?? pipelineRuns[0]?.pipeline_run_id ?? null
                      }
                      onSelect={handleRunSelect}
                      width="100%"
                    />
                  </Flex>
                )}

                <Flex
                  flex="1"
                  alignItems="center"
                  justifyContent="flex-end"
                  gap={0.5}
                  minW={0}
                  flexShrink={0}
                  flexWrap="nowrap"
                  overflowX="auto"
                >
                  {centerViewTab === "flow" && (
                    <>
                      <PipelineToolbarIcon
                        label="Undo"
                        tooltip="Undo last canvas change"
                        onClick={() => void handleCanvasUndo()}
                        disabled={
                          !selectedPipelineId ||
                          canvasUndoStack.length === 0 ||
                          isUndoing ||
                          graphView === "published"
                        }
                        loading={isUndoing}
                        flexShrink={0}
                      >
                        <MdUndo />
                      </PipelineToolbarIcon>
                      <PipelineToolbarIcon
                        label="Auto-arrange"
                        onClick={handleAutoArrange}
                        disabled={!selectedPipelineId || batchNodeCount === 0}
                        loading={isAutoArranging}
                        flexShrink={0}
                      >
                        <MdAccountTree />
                      </PipelineToolbarIcon>
                      <PipelineToolbarIcon
                        label="Delete"
                        colorPalette="red"
                        _hover={{ bg: "red.50", color: "red.600" }}
                        onClick={() => setDeleteDialogOpen(true)}
                        disabled={
                          !selectedPipelineId ||
                          hasRunningPipelineRun ||
                          deletePipeline.isPending
                        }
                        flexShrink={0}
                      >
                        <MdDelete />
                      </PipelineToolbarIcon>
                      <PipelineToolbarIcon
                        label={
                          selectedPipeline?.status === "paused"
                            ? "Resume"
                            : "Pause"
                        }
                        onClick={handleTogglePipelineStatus}
                        disabled={!selectedPipelineId}
                        loading={patchPipeline.isPending}
                        flexShrink={0}
                      >
                        {selectedPipeline?.status === "paused" ? (
                          <MdPlayArrow />
                        ) : (
                          <MdPause />
                        )}
                      </PipelineToolbarIcon>
                      <PipelineToolbarIcon
                        label="Validate"
                        tooltip={
                          validateDisabledReason ??
                          "Validate & publish Draft flow"
                        }
                        onClick={handleValidatePipeline}
                        disabled={!canValidatePipeline}
                        loading={validatePipeline.isPending}
                        flexShrink={0}
                      >
                        <MdCheckCircle />
                      </PipelineToolbarIcon>
                      <PipelineToolbarIcon
                        label="Reset"
                        tooltip={
                          resetDisabledReason ??
                          "Discard draft nodes and restore the published flow"
                        }
                        onClick={handleResetPipeline}
                        disabled={!canResetPipeline}
                        loading={resetPipeline.isPending}
                        flexShrink={0}
                      >
                        <MdRestore />
                      </PipelineToolbarIcon>
                      <PipelineToolbarIcon
                        label="Run now"
                        tooltip={runDisabledReason ?? "Run published flow now"}
                        colorPalette="brand"
                        color="brand.600"
                        _hover={{ bg: "brand.50", color: "brand.700" }}
                        onClick={handleRunPipeline}
                        disabled={!selectedPipelineId || !canRunPipeline}
                        loading={runPipeline.isPending}
                        flexShrink={0}
                      >
                        <MdPlayArrow />
                      </PipelineToolbarIcon>
                    </>
                  )}
                </Flex>
              </Flex>

              {showValidationPanel && (
                <PipelineValidationPanel
                  result={
                    validationSnapshot?.result ?? {
                      valid: false,
                      errors: [],
                      warnings: [],
                      levels: [],
                      max_nodes_per_level: 2,
                    }
                  }
                  stale={panelStale}
                  onDismiss={() => setValidationPanelDismissed(true)}
                />
              )}

              <Tabs.Content value="flow" flex="1" minH={0} p={0}>
                <ReactFlowProvider>
                  <Box h="100%" minH="480px">
                    <PipelineCanvas
                      selectedPipeline={selectedPipeline}
                      connections={connections}
                      selectedPipelineId={selectedPipelineId}
                      selectedNode={selectedNode}
                      pipelineRun={pipelineRun}
                      graphView={graphView}
                      onGraphViewChange={setGraphView}
                      flowCanvasMode={flowCanvasMode}
                      fitViewNonce={fitViewNonce}
                      onSelectNode={setSelectedNode}
                      onClearSelection={() => setSelectedNode(null)}
                      onPushUndo={pushCanvasUndoEntry}
                    />
                  </Box>
                </ReactFlowProvider>
              </Tabs.Content>

              <Tabs.Content
                value="logs"
                flex="1"
                minH={0}
                overflow="hidden"
                display="flex"
                flexDirection="column"
              >
                {pipelineRun ? (
                  <>
                    <Box
                      flexShrink={0}
                      px={3}
                      pt={2}
                      pb={2}
                      borderBottomWidth={1}
                      borderColor="gray.200"
                      bg="white"
                      position="sticky"
                      top={0}
                      zIndex={2}
                    >
                      <PipelineRunProgressPanel run={pipelineRun} />
                    </Box>
                    <Box flex="1" minH={0} overflow="hidden">
                      <PipelineExecutionLogsPanel
                        run={pipelineRun}
                        initialProcessName={executionLogProcessName}
                      />
                    </Box>
                  </>
                ) : (
                  <Flex
                    alignItems="center"
                    justifyContent="center"
                    h="100%"
                    minH="200px"
                    px={4}
                  >
                    <Text fontSize="sm" color="gray.500" textAlign="center">
                      Run the pipeline to view execution logs, or select a past
                      run from history once available.
                    </Text>
                  </Flex>
                )}
              </Tabs.Content>
            </Tabs.Root>
          )}
        </Box>

        {selectedNode && selectedPipeline && selectedNode.isStart && (
          <Box minH={0} h="100%">
            <StartOverviewPanel
              pipeline={selectedPipeline}
              onClose={() => setSelectedNode(null)}
            />
          </Box>
        )}

        {selectedNode && selectedPipeline && !selectedNode.isStart && (
          <Box minH={0} h="100%">
            <BatchOverviewPanel
              key={`${selectedPipeline.id}-${selectedNode.nodeId}-${selectedNode.batchId}`}
              pipeline={selectedPipeline}
              nodeId={selectedNode.nodeId}
              connectionId={selectedNode.connectionId}
              batchId={selectedNode.batchId}
              connectionName={selectedNode.connectionName}
              runNode={selectedRunNode}
              onRunStarted={handleRunStarted}
              onClose={() => setSelectedNode(null)}
            />
          </Box>
        )}
      </Grid>
    </Flex>
  );
};

export default Scheduling;
