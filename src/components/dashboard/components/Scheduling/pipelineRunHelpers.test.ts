import { describe, expect, it } from "vitest";

import {
  computeNodeProgress,
  computeTableProgress,
  pickDefaultNodeTab,
  pipelineRunRefetchInterval,
  pipelineStatusColor,
  resolvePipelineRunStatus,
} from "./pipelineRunHelpers";

describe("pipelineRunHelpers", () => {
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

    it("derives failed from overall tables_failed while run is running", () => {
      expect(
        resolvePipelineRunStatus({
          status: "running",
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
      ).toBe("failed");
    });
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
});
