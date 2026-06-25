import { type PipelineEdgeDto, type PipelineNodeDto } from "@/types/pipeline";

const COLUMN_WIDTH = 300;
const ROW_HEIGHT = 140;

export function computeRootNodeIds(
  nodes: PipelineNodeDto[],
  edges: PipelineEdgeDto[],
): number[] {
  if (!nodes.length) return [];
  const nodeIds = new Set(nodes.map((n) => n.id));
  const hasIncoming = new Set(
    edges.filter((e) => nodeIds.has(e.to_node_id)).map((e) => e.to_node_id),
  );
  return nodes.filter((n) => !hasIncoming.has(n.id)).map((n) => n.id);
}

export function getParentBatchName(
  nodeId: number,
  nodes: PipelineNodeDto[],
  edges: PipelineEdgeDto[],
): string | null {
  const incoming = edges.filter((e) => e.to_node_id === nodeId);
  if (!incoming.length) return null;
  const parentNode = nodes.find((n) => n.id === incoming[0].from_node_id);
  return parentNode?.batch_name || parentNode?.node_label || null;
}

export function layoutPipelineLR(
  nodes: PipelineNodeDto[],
  edges: PipelineEdgeDto[],
): Map<number, { x: number; y: number }> {
  const positions = new Map<number, { x: number; y: number }>();
  if (!nodes.length) return positions;

  const adj = new Map<number, number[]>();
  for (const edge of edges) {
    const list = adj.get(edge.from_node_id) ?? [];
    list.push(edge.to_node_id);
    adj.set(edge.from_node_id, list);
  }

  const rank = new Map<number, number>();
  const roots = computeRootNodeIds(nodes, edges);
  const queue = roots.map((id) => ({ id, r: 0 }));
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
      queue.push({ id: childId, r: r + 1 });
    }
  }

  for (const node of nodes) {
    if (!rank.has(node.id)) {
      rank.set(node.id, 0);
    }
  }

  const byRank = new Map<number, number[]>();
  for (const node of nodes) {
    const r = rank.get(node.id) ?? 0;
    const list = byRank.get(r) ?? [];
    list.push(node.id);
    byRank.set(r, list);
  }

  for (const [r, ids] of byRank.entries()) {
    ids.sort((a, b) => a - b);
    ids.forEach((id, index) => {
      positions.set(id, {
        x: r * COLUMN_WIDTH,
        y: index * ROW_HEIGHT,
      });
    });
  }

  return positions;
}
