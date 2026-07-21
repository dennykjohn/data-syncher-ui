import { describe, expect, it } from "vitest";

import { type PipelineEdgeDto, type PipelineNodeDto } from "@/types/pipeline";

import {
  buildAutoArrangeUpdates,
  computeRootNodeIds,
  getParentBatchName,
  layoutPipelineLR,
  resolvePipelineNodePosition,
} from "./pipelineLayout";

const startNode: PipelineNodeDto = {
  id: 1,
  pipeline_id: 1,
  node_kind: "start",
  connection_id: null,
  batch_id: null,
  batch_name: "",
  node_label: "Start",
  x: 0,
  y: 0,
  order_index: 0,
  execution_order: "parallel",
  schedule_type: "interval",
  time_frequency: "15",
  schedule_config: {},
  sync_start_date: null,
};

const nodes: PipelineNodeDto[] = [
  startNode,
  {
    id: 2,
    pipeline_id: 1,
    node_kind: "batch",
    connection_id: 10,
    batch_id: 100,
    batch_name: "root-batch",
    node_label: "Root",
    x: 0,
    y: 0,
    order_index: 0,
    execution_order: "parallel",
    schedule_type: "interval",
    time_frequency: "15",
    schedule_config: {},
    sync_start_date: null,
  },
  {
    id: 3,
    pipeline_id: 1,
    node_kind: "batch",
    connection_id: 11,
    batch_id: 101,
    batch_name: "child-batch",
    node_label: "Child",
    x: 0,
    y: 0,
    order_index: 1,
    execution_order: "parallel",
    schedule_type: "interval",
    time_frequency: "15",
    schedule_config: {},
    sync_start_date: null,
  },
];

const edges: PipelineEdgeDto[] = [
  { id: 1, pipeline_id: 1, from_node_id: 1, to_node_id: 2 },
  { id: 2, pipeline_id: 1, from_node_id: 2, to_node_id: 3 },
];

describe("pipelineLayout", () => {
  it("computes entry nodes connected from Start", () => {
    expect(computeRootNodeIds(nodes, edges)).toEqual([2]);
  });

  it("returns empty roots for empty graph", () => {
    expect(computeRootNodeIds([], [])).toEqual([]);
  });

  it("resolves parent batch name from incoming edge", () => {
    expect(getParentBatchName(3, nodes, edges)).toBe("root-batch");
    expect(getParentBatchName(2, nodes, edges)).toBe("Start");
  });

  it("joins multiple parent batch names", () => {
    const multiParentNodes: PipelineNodeDto[] = [
      { ...nodes[0], id: 1, batch_name: "batch f" },
      { ...nodes[0], id: 2, batch_name: "batch pr" },
      { ...nodes[1], id: 3, batch_name: "batch s" },
    ];
    const multiParentEdges: PipelineEdgeDto[] = [
      { id: 1, pipeline_id: 1, from_node_id: 1, to_node_id: 3 },
      { id: 2, pipeline_id: 1, from_node_id: 2, to_node_id: 3 },
    ];
    expect(getParentBatchName(3, multiParentNodes, multiParentEdges)).toBe(
      "batch f, batch pr",
    );
  });

  it("lays out nodes left-to-right by dependency rank", () => {
    const positions = layoutPipelineLR(nodes, edges);
    expect(positions.get(1)?.x).toBe(0);
    expect(positions.get(3)?.x).toBeGreaterThan(positions.get(2)!.x);
  });

  it("assigns positions for disconnected nodes", () => {
    const solo: PipelineNodeDto[] = [{ ...nodes[0], id: 99 }];
    const positions = layoutPipelineLR(solo, []);
    expect(positions.get(99)).toEqual({ x: 0, y: 0 });
  });

  it("prefers saved coordinates over computed layout", () => {
    expect(
      resolvePipelineNodePosition({ x: 120, y: 80 }, { x: 0, y: 0 }),
    ).toEqual({
      x: 120,
      y: 80,
    });
    expect(
      resolvePipelineNodePosition({ x: 0, y: 0 }, { x: 300, y: 140 }),
    ).toEqual({
      x: 300,
      y: 140,
    });
  });

  it("buildAutoArrangeUpdates returns positions for all nodes", () => {
    const updates = buildAutoArrangeUpdates(nodes, edges);
    expect(updates.map((u) => u.nodeId).sort()).toEqual([1, 2, 3]);
    expect(
      updates.every((u) => Number.isInteger(u.x) && Number.isInteger(u.y)),
    ).toBe(true);
  });
});
