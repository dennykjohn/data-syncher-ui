/**
 * @vitest-environment jsdom
 */
import { ChakraProvider } from "@chakra-ui/react";

import { afterEach, describe, expect, it, vi } from "vitest";

import theme from "@/theme/theme";
import { type EntityTransformDetail } from "@/types/connectors";

import VersionDetailDialog from "./VersionDetailDialog";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

afterEach(() => {
  cleanup();
});

const detail: EntityTransformDetail = {
  id: 1,
  version: 2,
  is_active: false,
  status: "validated",
  service_name: "ZSRV",
  entity_name: "Entity",
  table_name: "ZSRV_Entity",
  mapping_json: {
    field_mapping: [{ source: "A", target: "A" }],
  },
  mapping_overrides: {},
  script_text: "def transform(__source_df):\n    return __source_df",
  script_sha256: "abc",
  entry_point: "transform",
  run_order: "filter_script_mapping",
  row_filter: null,
  destination_table_name: "ENTITY",
  created_at: "2026-01-02T12:00:00Z",
  badge: null,
};

describe("VersionDetailDialog", () => {
  it("shows read-only version content and never activates", () => {
    const onClose = vi.fn();
    render(
      <ChakraProvider value={theme}>
        <VersionDetailDialog
          open
          onClose={onClose}
          detail={detail}
          isLoading={false}
          activeVersion={3}
        />
      </ChakraProvider>,
    );

    expect(screen.getByText("Version 2")).toBeTruthy();
    expect(screen.getByText("Read-only")).toBeTruthy();
    expect(screen.getByText(/1 mapped columns · ENTITY/)).toBeTruthy();
    expect(screen.getByText("Mapping JSON")).toBeTruthy();
    expect(screen.getByText("Python script")).toBeTruthy();
    expect(screen.getByText(/"field_mapping"/)).toBeTruthy();
    expect(screen.getByText("Viewing only. Loads still use v3.")).toBeTruthy();
    expect(screen.getByText(/def transform/)).toBeTruthy();
    expect(screen.queryByText(/Restore/i)).toBeNull();
    expect(screen.queryByText(/Activate/i)).toBeNull();

    fireEvent.click(screen.getByText("Close"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
