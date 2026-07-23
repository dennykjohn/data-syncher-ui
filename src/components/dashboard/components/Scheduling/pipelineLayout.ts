import { type PipelineEdgeDto, type PipelineNodeDto } from "@/types/pipeline";

const COLUMN_WIDTH = 300;
const ROW_HEIGHT = 140;

export function isStartNode(node: PipelineNodeDto): boolean {
  return node.node_kind === "start";
}

export function batchNodesOnly(nodes: PipelineNodeDto[]): PipelineNodeDto[] {
  return nodes.filter((n) => !isStartNode(n));
}

/** Stable fingerprint for pipeline graph structure (invalidates run-after-validate when flow changes). */
export function pipelineGraphFingerprint(
  nodes: PipelineNodeDto[],
  edges: PipelineEdgeDto[],
): string {
  const batchPart = batchNodesOnly(nodes)
    .map((n) => `${n.id}:${n.batch_id ?? 0}`)
    .sort()
    .join(",");
  const edgePart = edges
    .map((e) => `${e.from_node_id}->${e.to_node_id}`)
    .sort()
    .join(",");
  return `${batchPart}|${edgePart}`;
}

export function computeRootNodeIds(
  nodes: PipelineNodeDto[],
  edges: PipelineEdgeDto[],
): number[] {
  const batches = batchNodesOnly(nodes);
  if (!batches.length) return [];
  const start = nodes.find(isStartNode);
  if (start) {
    return edges
      .filter((e) => e.from_node_id === start.id)
      .map((e) => e.to_node_id)
      .filter((id) => batches.some((n) => n.id === id));
  }
  const nodeIds = new Set(batches.map((n) => n.id));
  const hasIncoming = new Set(
    edges.filter((e) => nodeIds.has(e.to_node_id)).map((e) => e.to_node_id),
  );
  return batches.filter((n) => !hasIncoming.has(n.id)).map((n) => n.id);
}

export function computeDisconnectedBatchIds(
  nodes: PipelineNodeDto[],
  edges: PipelineEdgeDto[],
): number[] {
  const start = nodes.find(isStartNode);
  const batches = batchNodesOnly(nodes);
  if (!start || !batches.length) return batches.map((n) => n.id);

  const adj = new Map<number, number[]>();
  for (const edge of edges) {
    const list = adj.get(edge.from_node_id) ?? [];
    list.push(edge.to_node_id);
    adj.set(edge.from_node_id, list);
  }

  const reachable = new Set<number>();
  const queue = [start.id];
  const seen = new Set<number>([start.id]);
  while (queue.length) {
    const cur = queue.shift()!;
    for (const nxt of adj.get(cur) ?? []) {
      if (!seen.has(nxt)) {
        seen.add(nxt);
        reachable.add(nxt);
        queue.push(nxt);
      }
    }
  }
  return batches.filter((n) => !reachable.has(n.id)).map((n) => n.id);
}

/** User-facing validation error when batches are not reachable from Start. */
export function formatDisconnectedBatchValidationError(
  nodes: PipelineNodeDto[],
  edges: PipelineEdgeDto[],
): string | null {
  const disconnectedIds = computeDisconnectedBatchIds(nodes, edges);
  if (!disconnectedIds.length) return null;

  const names = disconnectedIds.map((id) => {
    const node = nodes.find((n) => n.id === id);
    return node?.batch_name || node?.node_label || `Node ${id}`;
  });
  const count = disconnectedIds.length;
  const nameSuffix = names.length ? ` (${names.join(", ")})` : "";
  return `${count} batch${count === 1 ? "" : "es"} not connected to Start${nameSuffix} — connect them before running.`;
}

export function getParentBatchName(
  nodeId: number,
  nodes: PipelineNodeDto[],
  edges: PipelineEdgeDto[],
): string | null {
  const incoming = edges.filter((e) => e.to_node_id === nodeId);
  if (!incoming.length) return null;
  const parentNames = incoming
    .map((edge) => {
      const parentNode = nodes.find((n) => n.id === edge.from_node_id);
      if (!parentNode) return null;
      if (isStartNode(parentNode)) return "Start";
      return parentNode.batch_name || parentNode.node_label || null;
    })
    .filter((name): name is string => Boolean(name));
  if (!parentNames.length) return null;
  return parentNames.join(", ");
}

export function layoutPipelineLR(
  nodes: PipelineNodeDto[],
  edges: PipelineEdgeDto[],
): Map<number, { x: number; y: number }> {
  const positions = new Map<number, { x: number; y: number }>();
  const batches = batchNodesOnly(nodes);
  if (!batches.length && !nodes.some(isStartNode)) return positions;

  const start = nodes.find(isStartNode);
  if (start) {
    positions.set(start.id, { x: 0, y: ROW_HEIGHT });
  }

  const adj = new Map<number, number[]>();
  for (const edge of edges) {
    const list = adj.get(edge.from_node_id) ?? [];
    list.push(edge.to_node_id);
    adj.set(edge.from_node_id, list);
  }

  const rank = new Map<number, number>();
  const roots = computeRootNodeIds(nodes, edges);
  const queue = roots.map((id) => ({ id, r: 1 }));
  const visited = new Set<number>();

  while (queue.length) {
    const { id, r } = queue.shift()!;
    if (visited.has(id)) {
      rank.set(id, Math.max(rank.get(id) ?? 0, r));
      continue;
    }
    visited.add(id);
    rank.set(id, r);
    for (const childId of adj.get(id) ?? []) {
      if (
        !isStartNode({ id: childId, node_kind: "batch" } as PipelineNodeDto)
      ) {
        queue.push({ id: childId, r: r + 1 });
      }
    }
  }

  for (const node of batches) {
    if (!rank.has(node.id)) {
      rank.set(node.id, 1);
    }
  }

  const parentsOf = new Map<number, number[]>();
  for (const edge of edges) {
    const list = parentsOf.get(edge.to_node_id) ?? [];
    list.push(edge.from_node_id);
    parentsOf.set(edge.to_node_id, list);
  }

  const byRank = new Map<number, number[]>();
  for (const node of batches) {
    const r = rank.get(node.id) ?? 1;
    const list = byRank.get(r) ?? [];
    list.push(node.id);
    byRank.set(r, list);
  }

  // Vertical order: barycenter of parents (reduces edge crossings).
  // Sorting by node id alone ignores wiring and can cross last-column edges.
  const orderIndex = new Map<number, number>();
  if (start) {
    orderIndex.set(start.id, 0);
  }

  const sortedRanks = [...byRank.keys()].sort((a, b) => a - b);
  for (const r of sortedRanks) {
    const ids = byRank.get(r) ?? [];
    const scored = ids.map((id) => {
      const parents = parentsOf.get(id) ?? [];
      const known = parents
        .map((pid) => orderIndex.get(pid))
        .filter((idx): idx is number => idx !== undefined);
      const barycenter =
        known.length > 0
          ? known.reduce((sum, idx) => sum + idx, 0) / known.length
          : Number.POSITIVE_INFINITY;
      return { id, barycenter };
    });
    scored.sort((a, b) => {
      if (a.barycenter !== b.barycenter) {
        return a.barycenter - b.barycenter;
      }
      return a.id - b.id;
    });
    scored.forEach(({ id }, index) => {
      orderIndex.set(id, index);
      positions.set(id, {
        x: r * COLUMN_WIDTH,
        y: index * ROW_HEIGHT,
      });
    });
  }

  return positions;
}

/** Prefer saved canvas coordinates; use DAG layout when position was never set. */
export function resolvePipelineNodePosition(
  node: { x: number; y: number },
  layoutPos?: { x: number; y: number },
): { x: number; y: number } {
  if (node.x !== 0 || node.y !== 0) {
    return { x: node.x, y: node.y };
  }
  return layoutPos ?? { x: node.x, y: node.y };
}

export type PipelineNodePositionUpdate = {
  nodeId: number;
  x: number;
  y: number;
};

/** Compute left-to-right positions for every node on the canvas. */
export function buildAutoArrangeUpdates(
  nodes: PipelineNodeDto[],
  edges: PipelineEdgeDto[],
): PipelineNodePositionUpdate[] {
  const positions = layoutPipelineLR(nodes, edges);
  const updates: PipelineNodePositionUpdate[] = [];
  for (const node of nodes) {
    const pos = positions.get(node.id);
    if (!pos) continue;
    updates.push({
      nodeId: node.id,
      x: Math.round(pos.x),
      y: Math.round(pos.y),
    });
  }
  return updates;
}

/** Find edge whose midpoint is nearest to a flow coordinate (for insert-on-drop). */
export function findEdgeInsertTarget(
  point: { x: number; y: number },
  _nodes: PipelineNodeDto[],
  edges: PipelineEdgeDto[],
  positions: Map<number, { x: number; y: number }>,
  threshold = 90,
): { from_node_id: number; to_node_id: number } | null {
  let best: { from_node_id: number; to_node_id: number; dist: number } | null =
    null;
  for (const edge of edges) {
    const from = positions.get(edge.from_node_id);
    const to = positions.get(edge.to_node_id);
    if (!from || !to) continue;
    const mid = { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 };
    const dist = Math.hypot(point.x - mid.x, point.y - mid.y);
    if (dist <= threshold && (!best || dist < best.dist)) {
      best = {
        from_node_id: edge.from_node_id,
        to_node_id: edge.to_node_id,
        dist,
      };
    }
  }
  if (!best) return null;
  return {
    from_node_id: best.from_node_id,
    to_node_id: best.to_node_id,
  };
}
