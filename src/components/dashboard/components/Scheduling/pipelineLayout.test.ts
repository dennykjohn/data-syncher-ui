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

  it("orders columns by parent position to avoid crossed edges", () => {
    // Mirrors the last-column X in the flow UI: smaller-id sink on top by
    // id-sort would cross parents, but barycenter keeps edges parallel.
    const batch = (
      id: number,
      name: string,
      order_index: number,
    ): PipelineNodeDto => ({
      ...nodes[1],
      id,
      batch_id: id * 10,
      batch_name: name,
      node_label: name,
      order_index,
    });
    const graphNodes: PipelineNodeDto[] = [
      startNode,
      batch(10, "financ", 0),
      batch(20, "accnt", 1),
      batch(5, "master-data", 2), // smaller id — id-sort would put this first
      batch(30, "retl", 3),
    ];
    const graphEdges: PipelineEdgeDto[] = [
      { id: 1, pipeline_id: 1, from_node_id: 1, to_node_id: 10 },
      { id: 2, pipeline_id: 1, from_node_id: 1, to_node_id: 20 },
      { id: 3, pipeline_id: 1, from_node_id: 10, to_node_id: 30 },
      { id: 4, pipeline_id: 1, from_node_id: 20, to_node_id: 5 },
    ];

    const positions = layoutPipelineLR(graphNodes, graphEdges);
    expect(positions.get(10)!.y).toBeLessThan(positions.get(20)!.y);
    // RETL follows FINANC (top); Master Data follows ACCNT (bottom) — no X.
    expect(positions.get(30)!.y).toBeLessThan(positions.get(5)!.y);
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
