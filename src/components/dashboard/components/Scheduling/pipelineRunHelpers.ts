import {
  type PipelineRunDetail,
  type PipelineRunMode,
  type PipelineRunNodeDetail,
  type PipelineRunOverall,
} from "@/types/pipeline";

const MIGRATION_ACTIVE_STATUSES = new Set([
  "running",
  "in_progress",
  "completed",
  "failed",
  "timeout",
]);

const ACTIVE_NODE_STATUSES = new Set([
  "running",
  "in_progress",
  "failed",
  "timeout",
]);

export function resolvePipelineRunMode(
  run: Pick<PipelineRunDetail, "run_mode">,
): PipelineRunMode {
  return run.run_mode === "draft" ? "draft" : "published";
}

export function pipelineRunModeLabel(mode: PipelineRunMode): string {
  return mode === "published" ? "Published flow" : "Draft flow";
}

export function pipelineRunModeColor(mode: PipelineRunMode): string {
  return mode === "published" ? "green" : "orange";
}

export function nodeHasMigrationActivity(node: PipelineRunNodeDetail): boolean {
  if (
    node.migration_session_id !== null &&
    node.migration_session_id !== undefined
  ) {
    return true;
  }
  return MIGRATION_ACTIVE_STATUSES.has(String(node.status).toLowerCase());
}

export function executionLogNodeBadge(
  runMode: PipelineRunMode,
  node: PipelineRunNodeDetail,
): {
  label: string;
  colorPalette: string;
  variant: "subtle" | "outline";
} | null {
  if (runMode === "draft") {
    return { label: "Draft", colorPalette: "orange", variant: "subtle" };
  }
  if (!nodeHasMigrationActivity(node)) {
    return null;
  }
  const status = String(node.status).toLowerCase();
  return {
    label: String(node.status),
    colorPalette: pipelineStatusColor(node.status),
    variant: status === "skipped" ? "outline" : "subtle",
  };
}

export function pipelineStatusColor(status: string): string {
  const s = status.toLowerCase();
  if (s === "completed") return "green";
  if (s === "failed" || s === "timeout") return "red";
  if (s === "running" || s === "in_progress") return "blue";
  if (s === "skipped") return "orange";
  return "gray";
}

export function pickDefaultNodeTab(
  nodes: PipelineRunNodeDetail[],
  currentNodeId: number | null,
  currentNodeIds?: number[] | null,
): string {
  const activeIds = currentNodeIds?.length
    ? currentNodeIds
    : currentNodeId !== null && currentNodeId !== undefined
      ? [currentNodeId]
      : [];
  if (activeIds.length) {
    return String(activeIds[0]);
  }
  const active =
    nodes.find((n) =>
      ACTIVE_NODE_STATUSES.has(String(n.status).toLowerCase()),
    ) ?? nodes[0];
  return active ? String(active.node_id) : "";
}

export function resolvePipelineRunStatus(
  run: Pick<PipelineRunDetail, "status" | "overall">,
): string {
  const top = (run.status || "").toLowerCase();
  const rolled = (run.overall?.status || "").toLowerCase();
  if (top === "failed" || top === "timeout") return top;
  if (rolled === "failed" || rolled === "timeout") return rolled;
  if (
    (run.overall?.tables_failed ?? 0) > 0 ||
    (run.overall?.nodes_failed ?? 0) > 0
  ) {
    return "failed";
  }
  if (top === "completed") return "completed";
  if (rolled === "completed") return "completed";
  return top || rolled || "pending";
}

export function computeNodeProgress(overall: PipelineRunOverall): number {
  if (overall.nodes_total <= 0) return 0;
  const resolved =
    overall.nodes_completed +
    (overall.nodes_failed ?? 0) +
    (overall.nodes_skipped ?? 0);
  return Math.round((resolved / overall.nodes_total) * 100);
}

export function computeTableProgress(overall: PipelineRunOverall): number {
  if (overall.tables_total <= 0) return 0;
  const resolved = overall.tables_completed + (overall.tables_failed ?? 0);
  return Math.round((resolved / overall.tables_total) * 100);
}

export function pipelineRunRefetchInterval(
  status: string | undefined,
): number | false {
  const s = (status || "").toLowerCase();
  if (s === "running" || s === "in_progress") return 4000;
  return false;
}
