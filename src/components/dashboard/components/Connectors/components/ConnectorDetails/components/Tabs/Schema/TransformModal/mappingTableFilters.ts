import { type MappingTableRow } from "@/types/connectors";

import { type SapColumn, formatFieldType } from "./mappingState";

export type MappingTableFilterChip =
  | "all"
  | "unmapped_source"
  | "unmapped_target"
  | "warnings"
  | "removed";

const WARNING_STATUSES = new Set(["Narrowed", "Date check", "Not in SAP"]);

const rowHasSource = (row: MappingTableRow) =>
  Boolean(row.sap_column?.trim()) ||
  Boolean(row.sap_columns?.some((name) => String(name || "").trim()));

/** Targets with no SAP field (script, constant, user-added target-only). */
const isUnmappedTargetRow = (row: MappingTableRow) =>
  !rowHasSource(row) && row.status !== "Dropped";

export function occupiedSourceNames(
  mappingRows: MappingTableRow[],
  removedRows: MappingTableRow[] = [],
): Set<string> {
  const occupied = new Set<string>();
  const note = (row: MappingTableRow) => {
    if (row.sap_column?.trim()) occupied.add(row.sap_column.trim());
    row.sap_columns?.forEach((name) => {
      const trimmed = String(name || "").trim();
      if (trimmed) occupied.add(trimmed);
    });
  };
  mappingRows.forEach(note);
  removedRows.forEach(note);
  return occupied;
}

export function unmappedSourceTableRows(
  sapColumns: SapColumn[],
  mappingRows: MappingTableRow[],
  search: string,
  removedRows: MappingTableRow[] = [],
): MappingTableRow[] {
  const q = search.trim().toLowerCase();
  const occupied = occupiedSourceNames(mappingRows, removedRows);
  return sapColumns
    .filter((column) => !occupied.has(column.name))
    .filter((column) => !q || column.name.toLowerCase().includes(q))
    .map((column) => ({
      sap_column: column.name,
      sap_columns: [column.name],
      target_column: null,
      renamed: false,
      status: "Not selected",
      type_label: formatFieldType(column.type, column.length, column.decimals),
      added_by_user: false,
    }));
}

export function filterMappingTableRows(
  rows: MappingTableRow[],
  filter: MappingTableFilterChip,
  search: string,
): MappingTableRow[] {
  const q = search.trim().toLowerCase();
  return rows.filter((row) => {
    if (filter === "unmapped_source") return false;
    if (filter === "unmapped_target" && !isUnmappedTargetRow(row)) return false;
    if (filter === "warnings" && !WARNING_STATUSES.has(row.status))
      return false;
    if (filter === "removed" && row.status !== "Dropped") return false;
    if (!q) return true;
    const sap = (row.sap_column || "").toLowerCase();
    const tgt = (row.target_column || "").toLowerCase();
    const extra = (row.sap_columns || []).join(" ").toLowerCase();
    return sap.includes(q) || tgt.includes(q) || extra.includes(q);
  });
}
