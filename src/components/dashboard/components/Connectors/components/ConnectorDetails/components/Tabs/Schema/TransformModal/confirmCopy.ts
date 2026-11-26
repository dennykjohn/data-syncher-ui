export const confirmCopy = {
  discard: {
    title: "Discard unsaved changes?",
    description: (entity: string) =>
      `You have unsaved changes to the column mapping for ${entity}. If you close now, they will be lost.`,
    cancelLabel: "Keep editing",
    confirmLabel: "Discard changes",
  },
  reset: {
    title: "Reset to the uploaded JSON?",
    description: (restored: number, discardedAdded: number, renames: number) =>
      `This restores ${restored} removed columns and discards ${discardedAdded} added columns and ${renames} renames.`,
    cancelLabel: "Cancel",
    confirmLabel: "Reset mapping",
  },
  removeMapping: {
    title: "Remove this transform?",
    description: {
      draftAndActive: (version: number) =>
        `Deletes your draft and stops using applied v${version}. Saved versions are kept.`,
      activeOnly: (version: number) =>
        `Stops using applied v${version}. Saved versions are kept.`,
      draftOnly: "Deletes your draft.",
      fallback:
        "The applied mapping stops being used for loads. Saved versions are kept.",
    },
    cancelLabel: "Cancel",
    confirmLabel: "Remove transform",
  },
  removeMappingJson: {
    title: "Remove mapping JSON?",
    description:
      "Clears the column mapping JSON only. Your Python routine is kept.",
    cancelLabel: "Cancel",
    confirmLabel: "Remove JSON",
  },
  discardDraft: {
    title: "Discard draft?",
    description: (version: number) =>
      `Discard your unsaved changes? Applied v${version} stays active.`,
    cancelLabel: "Cancel",
    confirmLabel: "Discard draft",
  },
  replaceJson: {
    title: "Replace the mapping JSON?",
    description:
      "Your manual changes will be kept only where they still apply.",
    cancelLabel: "Cancel",
    confirmLabel: "Keep my changes",
    alternateLabel: "Discard my changes",
  },
  replaceScript: {
    title: "Replace the script?",
    description: "Unsaved edits in the script editor will be replaced.",
    cancelLabel: "Cancel",
    confirmLabel: "Replace script",
  },
  insertExample: {
    title: "Insert example?",
    description: "This adds the example to the end of the script body.",
    cancelLabel: "Cancel",
    confirmLabel: "Insert",
  },
  removeScript: {
    title: "Remove the script?",
    description:
      "Clears the Python routine only. Your column mapping JSON is kept.",
    cancelLabel: "Cancel",
    confirmLabel: "Remove script",
  },
  replaceMapping: {
    title: "Replace this mapping?",
    description: (currentSource: string, nextSource: string, target: string) =>
      `Replace ${currentSource} → ${target} with ${nextSource} → ${target}?`,
    cancelLabel: "Cancel",
    confirmLabel: "Replace mapping",
  },
  renameDestination: {
    title: "Rename the destination table?",
    description: (previous: string, next: string) =>
      `Data was already loaded into ${previous}. Destination is now ${next}. Choose how to proceed.`,
    plainDescription: (current: string, next: string) =>
      `Rename destination table from ${current} to ${next}?`,
    cancelLabel: "Cancel",
    confirmLabel: "Continue",
    renameLabel: "Rename table",
    choices: [
      { id: "create_new", label: "Create new table and full reload" },
      { id: "rename_existing", label: "Rename existing table" },
    ],
  },
  addColumns: {
    title: "Add columns to loaded data?",
    description:
      "Data was already loaded for this entity. Choose whether to reload the table or add the new columns only.",
    cancelLabel: "Cancel",
    confirmLabel: "Continue",
    choices: [
      { id: "full_reload", label: "Full reload" },
      { id: "new_columns_only", label: "New columns only" },
    ],
  },
  saveWithoutTest: {
    title: "Apply without a dry run?",
    description:
      "The mapping and script have not been dry-run tested. Apply still checks syntax and mapping; runtime errors may appear when the pipeline runs.",
    cancelLabel: "Go back",
    confirmLabel: "Apply",
  },
  published: (version: number) => `Applied (v${version})`,
  validated: (version: number) => `Applied v${version}`,
  draftBadge: "Draft",
  validatedBadge: (version: number) => `Applied v${version}`,
  draftSavedLabel: "Draft saved",
  versionViewer: {
    readOnly: "Read-only",
    viewingNote: (activeVersion: number) =>
      `Viewing only. Loads still use v${activeVersion}.`,
    closeLabel: "Close",
    activeTag: "Active",
    mappingHeading: "Mapping JSON",
    scriptHeading: "Python script",
    noScript: "No Python script on this version.",
    noMapping: "No mapping JSON on this version.",
    mappingSummary: (mapped: number, destination: string | null) =>
      destination
        ? `${mapped} mapped columns · ${destination}`
        : `${mapped} mapped columns`,
  },
  applyFailed: "Apply failed",
  applyIncomplete:
    "Checks passed but the transform was not activated for loads.",
  removed: (name: string) => `${name} removed`,
  copied: "Copied",
  scriptValidated: "Python syntax valid",
  scriptSavedAndValidated: "Script validated",
  retry: "Retry",
};

export type TransformBadgeKind = "draft" | "applied" | "none";

/** Draft badge whenever there is an open draft or unsaved local edits. */
export function showDraftBadge(opts: {
  hasServerDraft: boolean;
  isDirty: boolean;
}): boolean {
  return opts.hasServerDraft || opts.isDirty;
}

/** Applied badge + version history whenever a published version is active. */
export function showAppliedBadge(opts: {
  hasActive: boolean;
  publishedVersion: number | null;
}): boolean {
  return opts.hasActive && opts.publishedVersion !== null;
}

/**
 * Exclusive badge kind for compact UIs. Prefer showDraftBadge + showAppliedBadge
 * in the schema transform header so Applied versions stay visible while drafting.
 */
export function transformBadgeKind(opts: {
  hasServerDraft: boolean;
  isDirty: boolean;
  hasActive: boolean;
  publishedVersion: number | null;
}): TransformBadgeKind {
  if (showDraftBadge(opts) && !showAppliedBadge(opts)) return "draft";
  if (showAppliedBadge(opts) && !showDraftBadge(opts)) return "applied";
  if (showDraftBadge(opts)) return "draft";
  if (showAppliedBadge(opts)) return "applied";
  return "none";
}
