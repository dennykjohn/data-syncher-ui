export type ScriptExample = {
  id: "filter" | "transform";
  label: string;
  description: string;
  code: string;
};

function exampleVariable(name: string): string {
  const lower = name.toLowerCase().replace(/\W/g, "_");
  if (/^[a-z_][a-z0-9_]*$/.test(lower)) return lower;
  return "value";
}

function pickField(
  names: string[],
  candidates: string[],
  fallback: string,
): string {
  for (const candidate of candidates) {
    if (names.includes(candidate)) return candidate;
  }
  return names[0] || fallback;
}

/** Prefer columns that exist on both source and target (identity maps). */
function pickSharedField(
  sourceNames: string[],
  targetNames: string[],
  candidates: string[],
  fallback: string,
): string {
  const shared = sourceNames.filter((name) => targetNames.includes(name));
  if (shared.length > 0) {
    return pickField(shared, candidates, shared[0]);
  }
  return pickField(
    targetNames.length > 0 ? targetNames : sourceNames,
    candidates,
    fallback,
  );
}

export function buildScriptExamples(
  sourceNames: string[],
  targetNames: string[],
  options?: { mappingPresent?: boolean },
): ScriptExample[] {
  // With mapping JSON, dry run uses mapping_script: __source_df columns are
  // target names after column mapping. Without mapping, the script sees SAP
  // extract columns (source names).
  const mappingPresent = Boolean(options?.mappingPresent);
  const frameNames =
    mappingPresent && targetNames.length > 0
      ? targetNames
      : sourceNames.length > 0
        ? sourceNames
        : targetNames;

  const filterKey = pickField(
    frameNames,
    ["BUKRS", "KOKRS", "WERKS"],
    frameNames[0] || "BUKRS",
  );
  const filterVar = exampleVariable(filterKey);
  const charField = mappingPresent
    ? pickSharedField(
        sourceNames,
        targetNames,
        ["BELNR", "HKONT", "XBLNR", "SGTXT"],
        frameNames[0] || "BELNR",
      )
    : pickField(
        frameNames,
        ["BELNR", "HKONT", "XBLNR", "SGTXT"],
        frameNames[0] || "BELNR",
      );
  // Prefer DMBTR over DMSOL — DMSOL is often absent from OData samples.
  const amountField = mappingPresent
    ? pickSharedField(
        sourceNames,
        targetNames,
        ["DMBTR", "DMSOL", "WRSHB", "DMSHB", "WRSOL", "DMHAB", "BETRW"],
        frameNames[1] || frameNames[0] || "DMBTR",
      )
    : pickField(
        frameNames,
        ["DMBTR", "DMSOL", "WRSHB", "DMSHB", "WRSOL", "DMHAB", "BETRW"],
        frameNames[1] || frameNames[0] || "DMBTR",
      );

  return [
    {
      id: "filter",
      label: "Filter rows",
      description: `Keep rows for one ${filterKey} value from the sample. Swap the value or use .isin(["A", "B"]).`,
      code: [
        `if "${filterKey}" in __source_df.columns:`,
        `    ${filterVar} = __source_df["${filterKey}"].astype("string").str.rstrip(" ")`,
        `    # Uses the first sample value so dry run still returns rows.`,
        `    _keep = ${filterVar}.dropna().iloc[0] if len(${filterVar}.dropna()) else ""`,
        `    __target_df = __source_df.loc[${filterVar} == _keep].copy() if _keep != "" else __source_df.copy()`,
        `else:`,
        `    __target_df = __source_df.copy()`,
      ].join("\n"),
    },
    {
      id: "transform",
      label: "Transform columns",
      description: `Strip text and convert a number. Dates: pd.to_datetime(..., format="%Y%m%d").`,
      code: [
        `if "${charField}" in __source_df.columns:`,
        `    __target_df["${charField}"] = __source_df["${charField}"].astype("string").str.rstrip(" ")`,
        `if "${amountField}" in __source_df.columns:`,
        `    __target_df["${amountField}"] = pd.to_numeric(__source_df["${amountField}"], errors="coerce")`,
      ].join("\n"),
    },
  ];
}
