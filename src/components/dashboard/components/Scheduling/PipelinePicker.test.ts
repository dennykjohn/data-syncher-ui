import { describe, expect, it } from "vitest";

import { type PipelineDetail } from "@/types/pipeline";

import {
  getPipelineListGroup,
  isPipelineSchedulePaused,
  sortPipelinesForPicker,
} from "./PipelinePicker";

const pipeline = (
  id: number,
  name: string,
  status: "active" | "paused",
  latest_run_status: PipelineDetail["latest_run_status"] = null,
): PipelineDetail =>
  ({
    id,
    name,
    status,
    latest_run_status,
    schedule_type: "manual",
    time_frequency: "15",
    schedule_config: {},
    sync_start_date: null,
    notify_on_flow_finish: false,
    notification_email_group_ids: [],
    notification_emails: [],
    created_at: "",
    updated_at: "",
    nodes: [],
    edges: [],
  }) as PipelineDetail;

describe("sortPipelinesForPicker", () => {
  it("orders running first, then active, then paused", () => {
    const sorted = sortPipelinesForPicker([
      pipeline(1, "Z paused", "paused"),
      pipeline(2, "B active", "active"),
      pipeline(3, "A running", "active", "running"),
      pipeline(4, "C active", "active"),
      pipeline(5, "Y paused running", "paused", "running"),
    ]);

    expect(sorted.map((p) => p.id)).toEqual([3, 5, 2, 4, 1]);
  });

  it("sorts alphabetically within the same group", () => {
    const sorted = sortPipelinesForPicker([
      pipeline(1, "Beta", "active"),
      pipeline(2, "Alpha", "active"),
    ]);

    expect(sorted.map((p) => p.name)).toEqual(["Alpha", "Beta"]);
  });
});

describe("isPipelineSchedulePaused", () => {
  it("treats schedule_paused as paused while flow status stays active", () => {
    expect(
      isPipelineSchedulePaused({
        ...pipeline(1, "x", "active"),
        schedule_paused: true,
      }),
    ).toBe(true);
    expect(
      isPipelineSchedulePaused({
        ...pipeline(2, "y", "active"),
        schedule_paused: false,
      }),
    ).toBe(false);
  });
});

describe("getPipelineListGroup", () => {
  it("groups schedule_paused flows with paused", () => {
    expect(
      getPipelineListGroup({
        ...pipeline(1, "x", "active"),
        schedule_paused: true,
      }),
    ).toBe("paused");
  });

  it("treats running execution as the running group regardless of schedule", () => {
    expect(getPipelineListGroup(pipeline(1, "x", "paused", "running"))).toBe(
      "running",
    );
    expect(getPipelineListGroup(pipeline(2, "x", "active"))).toBe("active");
    expect(getPipelineListGroup(pipeline(3, "x", "paused"))).toBe("paused");
    expect(getPipelineListGroup(pipeline(4, "x", "active", "queued"))).toBe(
      "active",
    );
  });
});
