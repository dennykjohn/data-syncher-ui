import { format } from "date-fns";

import { dateTimeFormat } from "@/constants/common";
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

/** Keep active runs live; reconcile unfinished nodes when the run ends. */
export function resolvePipelineNodeStatus(
  node: PipelineRunNodeDetail | undefined,
  runStatus: string | undefined,
): string {
  const status = (node?.status || "pending").toLowerCase();
  const lifecycle = (runStatus || "").toLowerCase();
  if (["completed", "failed", "timeout", "skipped"].includes(status)) {
    return status;
  }
  // Pending nodes in an active run may still carry the previous migration's
  // summary, including failures. Wait for the scheduler to start this node.
  if (lifecycle === "running" || lifecycle === "in_progress") return status;
  const finished = ["completed", "failed", "timeout", "deleted"].includes(
    lifecycle,
  );
  if (status !== "pending" && !finished) return status;
  if (
    node?.migration_session_id === null ||
    node?.migration_session_id === undefined
  ) {
    return status;
  }
  const migrationStatus = node.migration_status?.overall_status?.toLowerCase();
  if (migrationStatus === "failed" || migrationStatus === "timeout") {
    return migrationStatus;
  }
  return status;
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
  // Table/node failures are outcomes within a run, not proof the scheduler
  // has stopped. Keep active runs live until their lifecycle becomes terminal.
  if (top === "running" || top === "in_progress") return "running";
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

export function formatPipelineRunTimestamp(
  value: string | null | undefined,
): string | null {
  if (!value) return null;
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return null;
  return format(new Date(parsed), dateTimeFormat);
}

/** Shorter timestamp for inline header use (center of progress bar row). */
export function formatPipelineRunTimestampCompact(
  value: string | null | undefined,
): string | null {
  if (!value) return null;
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return null;
  return format(new Date(parsed), "MMM d, h:mm a");
}

export function formatElapsedDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

export function computeRunDurationMs(
  startedAt: string | null | undefined,
  finishedAt: string | null | undefined,
  nowMs: number = Date.now(),
): number | null {
  if (!startedAt) return null;
  const startMs = Date.parse(startedAt);
  if (Number.isNaN(startMs)) return null;
  const endMs = finishedAt ? Date.parse(finishedAt) : nowMs;
  if (Number.isNaN(endMs)) return null;
  return Math.max(0, endMs - startMs);
}
