import { describe, expect, it } from "vitest";

import {
  computeNodeProgress,
  computeRunDurationMs,
  computeTableProgress,
  formatElapsedDuration,
  formatPipelineRunTimestamp,
  formatPipelineRunTimestampCompact,
  pickDefaultNodeTab,
  pipelineRunRefetchInterval,
  pipelineStatusColor,
  resolvePipelineNodeStatus,
  resolvePipelineRunStatus,
} from "./pipelineRunHelpers";

describe("pipelineRunHelpers", () => {
  describe("resolvePipelineNodeStatus", () => {
    const node = {
      status: "pending",
      migration_session_id: 12,
      migration_status: { overall_status: "failed" },
    } as Parameters<typeof resolvePipelineNodeStatus>[0];

    it.each([
      "running",
      "in_progress",
      "waiting",
      "completed",
      "failed",
      "skipped",
    ])(
      "preserves the current node lifecycle %s despite a failed summary",
      (status) => {
        expect(resolvePipelineNodeStatus({ ...node!, status }, "running")).toBe(
          status,
        );
      },
    );

    it.each(["running", "in_progress"])(
      "does not mark pending nodes failed during %s runs",
      (status) => {
        expect(resolvePipelineNodeStatus(node, status)).toBe("pending");
      },
    );

    it("retains session failures for historical pending nodes", () => {
      expect(resolvePipelineNodeStatus(node, "failed")).toBe("failed");
    });

    it.each(["running", "in_progress", "waiting", "pending"])(
      "reconciles a stale %s node when its run has ended",
      (status) => {
        for (const runStatus of ["completed", "failed", "timeout", "deleted"]) {
          for (const migrationStatus of ["failed", "timeout"]) {
            expect(
              resolvePipelineNodeStatus(
                {
                  ...node!,
                  status,
                  migration_status: { overall_status: migrationStatus },
                },
                runStatus,
              ),
            ).toBe(migrationStatus);
          }
        }
      },
    );

    it.each(["completed", "failed", "timeout", "skipped"])(
      "preserves an explicit terminal node status of %s",
      (status) => {
        expect(resolvePipelineNodeStatus({ ...node!, status }, "failed")).toBe(
          status,
        );
      },
    );

    it("does not infer failure for an unfinished node without a run session", () => {
      expect(
        resolvePipelineNodeStatus(
          { ...node!, status: "running", migration_session_id: null },
          "failed",
        ),
      ).toBe("running");
    });

    it("does not use a summary to stop an active run with uppercase status", () => {
      expect(
        resolvePipelineNodeStatus({ ...node!, status: "running" }, "RUNNING"),
      ).toBe("running");
    });

    it("ignores migration summaries without a run session", () => {
      expect(
        resolvePipelineNodeStatus(
          { ...node!, migration_session_id: null },
          "failed",
        ),
      ).toBe("pending");
    });
  });
  describe("pipelineStatusColor", () => {
    it.each([
      ["completed", "green"],
      ["failed", "red"],
      ["timeout", "red"],
      ["running", "blue"],
      ["in_progress", "blue"],
      ["pending", "gray"],
    ])("maps %s to %s", (status, color) => {
      expect(pipelineStatusColor(status)).toBe(color);
    });
  });

  describe("pickDefaultNodeTab", () => {
    const nodes = [
      { node_id: 5, status: "completed" },
      { node_id: 7, status: "running" },
    ] as Parameters<typeof pickDefaultNodeTab>[0];

    it("prefers current node when set", () => {
      expect(pickDefaultNodeTab(nodes, 5)).toBe("5");
    });

    it("prefers first current_node_ids entry when provided", () => {
      expect(pickDefaultNodeTab(nodes, null, [7, 5])).toBe("7");
    });

    it("selects first active node when current node is null", () => {
      expect(pickDefaultNodeTab(nodes, null)).toBe("7");
    });

    it("falls back to first node when none are active", () => {
      const completedOnly = [
        { node_id: 5, status: "completed" },
        { node_id: 7, status: "completed" },
      ] as Parameters<typeof pickDefaultNodeTab>[0];
      expect(pickDefaultNodeTab(completedOnly, null)).toBe("5");
    });

    it("returns empty string for empty node list", () => {
      expect(pickDefaultNodeTab([], null)).toBe("");
    });
  });

  describe("progress helpers", () => {
    it("computes node progress percentage", () => {
      expect(
        computeNodeProgress({
          nodes_total: 4,
          nodes_completed: 1,
          nodes_failed: 0,
          nodes_running: 1,
          tables_total: 0,
          tables_completed: 0,
          tables_failed: 0,
          status: "running",
        }),
      ).toBe(25);
    });

    it("counts failed nodes in node progress", () => {
      expect(
        computeNodeProgress({
          nodes_total: 4,
          nodes_completed: 1,
          nodes_failed: 1,
          nodes_running: 1,
          tables_total: 0,
          tables_completed: 0,
          tables_failed: 0,
          status: "running",
        }),
      ).toBe(50);
    });

    it("counts failed tables in table progress", () => {
      expect(
        computeTableProgress({
          nodes_total: 1,
          nodes_completed: 0,
          nodes_failed: 0,
          nodes_running: 1,
          tables_total: 2,
          tables_completed: 0,
          tables_failed: 1,
          status: "running",
        }),
      ).toBe(50);
    });

    it("computes table progress percentage", () => {
      expect(
        computeTableProgress({
          nodes_total: 1,
          nodes_completed: 0,
          nodes_failed: 0,
          nodes_running: 1,
          tables_total: 2,
          tables_completed: 1,
          tables_failed: 0,
          status: "running",
        }),
      ).toBe(50);
    });

    it("returns zero when totals are empty", () => {
      expect(
        computeNodeProgress({
          nodes_total: 0,
          nodes_completed: 0,
          nodes_failed: 0,
          nodes_running: 0,
          tables_total: 0,
          tables_completed: 0,
          tables_failed: 0,
          status: "running",
        }),
      ).toBe(0);
    });
  });

  describe("resolvePipelineRunStatus", () => {
    it("prefers explicit failed status", () => {
      expect(
        resolvePipelineRunStatus({
          status: "failed",
          overall: {
            nodes_total: 2,
            nodes_completed: 0,
            nodes_failed: 1,
            nodes_running: 0,
            tables_total: 2,
            tables_completed: 0,
            tables_failed: 1,
            status: "running",
          },
        }),
      ).toBe("failed");
    });

    it.each(["running", "in_progress"])(
      "keeps %s runs live despite table failures",
      (status) => {
        expect(
          resolvePipelineRunStatus({
            status,
            overall: {
              nodes_total: 2,
              nodes_completed: 0,
              nodes_failed: 0,
              nodes_running: 2,
              tables_total: 5,
              tables_completed: 1,
              tables_failed: 1,
              status: "running",
            },
          }),
        ).toBe("running");
      },
    );

    it.each(["failed", "completed"])(
      "keeps polling an active run despite a %s summary",
      (status) => {
        const run = {
          status: "running",
          overall: { status },
        } as Parameters<typeof resolvePipelineRunStatus>[0];
        expect(resolvePipelineRunStatus(run)).toBe("running");
        expect(pipelineRunRefetchInterval(run.status)).toBe(4000);
      },
    );
  });

  describe("pipelineRunRefetchInterval", () => {
    it("polls every 4s while running", () => {
      expect(pipelineRunRefetchInterval("running")).toBe(4000);
    });

    it("stops polling when run is terminal", () => {
      expect(pipelineRunRefetchInterval("completed")).toBe(false);
      expect(pipelineRunRefetchInterval("failed")).toBe(false);
      expect(pipelineRunRefetchInterval(undefined)).toBe(false);
    });
  });

  describe("run timing helpers", () => {
    it("formats timestamps for display", () => {
      expect(formatPipelineRunTimestamp("2026-06-26T08:18:29.000Z")).toMatch(
        /Jun 26, 2026/,
      );
      expect(
        formatPipelineRunTimestampCompact("2026-06-26T08:18:29.000Z"),
      ).toMatch(/Jun 26/);
      expect(formatPipelineRunTimestamp(null)).toBeNull();
    });

    it("formats elapsed duration", () => {
      expect(formatElapsedDuration(90_000)).toBe("1m 30s");
      expect(formatElapsedDuration(3_661_000)).toBe("1h 1m 1s");
    });

    it("computes duration between start and end", () => {
      expect(
        computeRunDurationMs(
          "2026-01-01T00:00:00.000Z",
          "2026-01-01T00:05:10.000Z",
        ),
      ).toBe(310_000);
    });
  });
});
