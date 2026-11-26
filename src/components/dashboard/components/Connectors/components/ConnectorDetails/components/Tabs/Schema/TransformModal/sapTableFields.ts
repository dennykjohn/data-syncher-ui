import { type ConnectorTable } from "@/types/connectors";

import { isPrimaryKey } from "../../ReverseSchema/utils/validation";
import { type SapColumn } from "./mappingState";

const flagIsKey = (value: unknown) => {
  if (value === true || value === 1) return true;
  if (typeof value === "string") {
    const text = value.trim().toUpperCase();
    return text === "X" || text === "Y" || text === "TRUE" || text === "1";
  }
  return false;
};

export function sapColumnsFromFields(
  fields: ConnectorTable["table_fields"] | undefined,
  primaryKeys?: string[],
): SapColumn[] {
  const entries = Object.entries(fields || {});
  return entries.map(([name, info]) => {
    const meta = typeof info === "string" ? { data_type: info } : info || {};
    return {
      name,
      type: String(meta.data_type || meta.edm_type || ""),
      length: Number(meta.max_length || 0) || undefined,
      decimals: Number(meta.precision || 0) || undefined,
      isKey:
        isPrimaryKey(name, info, primaryKeys) ||
        flagIsKey(meta.isKey) ||
        flagIsKey(meta.is_key) ||
        flagIsKey(meta.key) ||
        flagIsKey(meta.key_flag),
    };
  });
}

export function sapColumnsFromTable(
  tableItem: ConnectorTable,
  primaryKeys?: string[],
): SapColumn[] {
  return sapColumnsFromFields(tableItem.table_fields, primaryKeys);
}
