import { describe, expect, it } from "vitest";

import {
  showAppliedBadge,
  showDraftBadge,
  transformBadgeKind,
} from "./confirmCopy";

describe("transform status badges", () => {
  it("shows Draft and Applied independently when both exist", () => {
    expect(showDraftBadge({ hasServerDraft: true, isDirty: false })).toBe(true);
    expect(showAppliedBadge({ hasActive: true, publishedVersion: 3 })).toBe(
      true,
    );
  });

  it("keeps Applied visible after Apply even when local edits dirty the draft", () => {
    expect(showDraftBadge({ hasServerDraft: false, isDirty: true })).toBe(true);
    expect(showAppliedBadge({ hasActive: true, publishedVersion: 2 })).toBe(
      true,
    );
  });

  it("hides Applied when there is no active published version", () => {
    expect(showAppliedBadge({ hasActive: false, publishedVersion: null })).toBe(
      false,
    );
    expect(
      transformBadgeKind({
        hasServerDraft: true,
        isDirty: false,
        hasActive: false,
        publishedVersion: null,
      }),
    ).toBe("draft");
  });

  it("shows Applied alone when clean and published", () => {
    expect(
      transformBadgeKind({
        hasServerDraft: false,
        isDirty: false,
        hasActive: true,
        publishedVersion: 1,
      }),
    ).toBe("applied");
  });
});
