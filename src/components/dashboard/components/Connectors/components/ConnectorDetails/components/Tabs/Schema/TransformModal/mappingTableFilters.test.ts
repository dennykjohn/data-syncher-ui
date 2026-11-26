import { describe, expect, it } from "vitest";

import { type MappingTableRow } from "@/types/connectors";

import { emptyDraft, selectEffectiveMappings } from "./mappingState";
import {
  filterMappingTableRows,
  unmappedSourceTableRows,
} from "./mappingTableFilters";
import { sapColumnsFromFields } from "./sapTableFields";

const row = (partial: Partial<MappingTableRow>): MappingTableRow => ({
  sap_column: null,
  sap_columns: [],
  target_column: "T",
  renamed: false,
  status: "Direct",
  added_by_user: false,
  type_label: "",
  ...partial,
});

describe("filterMappingTableRows", () => {
  const rows: MappingTableRow[] = [
    row({
      sap_column: "BUKRS",
      sap_columns: ["BUKRS"],
      target_column: "BUKRS",
      status: "Direct",
    }),
    row({
      target_column: "UPD_DATE",
      status: "From script",
    }),
    row({
      target_column: "OLD",
      status: "Dropped",
      sap_column: "OLD",
    }),
  ];

  it("unmapped_target shows script and constant targets without a SAP source", () => {
    const out = filterMappingTableRows(rows, "unmapped_target", "");
    expect(out.map((r) => r.target_column)).toEqual(["UPD_DATE"]);
  });

  it("unmapped_source does not list target-only script rows", () => {
    const out = filterMappingTableRows(rows, "unmapped_source", "");
    expect(out).toEqual([]);
  });

  it("warnings filter keeps warning statuses only", () => {
    const warn = [
      ...rows,
      row({
        sap_column: "X",
        target_column: "X",
        status: "Not in SAP",
      }),
    ];
    const out = filterMappingTableRows(warn, "warnings", "");
    expect(out).toHaveLength(1);
    expect(out[0]?.status).toBe("Not in SAP");
  });
});

describe("unmappedSourceTableRows", () => {
  it("lists SAP fields with no mapping row", () => {
    const sapColumns = [
      { name: "BUKRS", type: "CHAR", length: 4 },
      { name: "EXTRA", type: "CHAR", length: 10 },
    ];
    const mappings = [
      row({
        sap_column: "BUKRS",
        sap_columns: ["BUKRS"],
        target_column: "BUKRS",
        status: "Direct",
      }),
      row({
        target_column: "UPD_DATE",
        status: "From script",
      }),
    ];
    const out = unmappedSourceTableRows(sapColumns, mappings, "");
    expect(out.map((r) => r.sap_column)).toEqual(["EXTRA"]);
    expect(out[0]?.status).toBe("Not selected");
  });
});

describe("identity mappings without JSON", () => {
  it("creates one identity row per SAP field", () => {
    const fields = {
      BUKRS: { data_type: "CHAR" },
      DMBTR: { data_type: "CURR" },
    };
    const columns = sapColumnsFromFields(fields, ["BUKRS"]);
    const draft = emptyDraft(columns);
    const mappings = selectEffectiveMappings(draft);
    expect(mappings).toHaveLength(2);
    expect(mappings.every((m) => m.source === m.target)).toBe(true);
    expect(mappings.find((m) => m.source === "BUKRS")?.isKey).toBe(true);
  });
});
