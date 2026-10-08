import { useCallback, useEffect, useMemo, useState } from "react";

import {
  Badge,
  Box,
  Button,
  Checkbox,
  CloseButton,
  Dialog,
  Flex,
  Input,
  Link,
  NativeSelect,
  Portal,
  Text,
  VStack,
} from "@chakra-ui/react";

import { toaster } from "@/components/ui/toaster";
import {
  DEFAULT_DRY_RUN_ROWS,
  MAX_DRY_RUN_ROWS,
  MAX_MAPPING_JSON_BYTES,
  MAX_SCRIPT_BYTES,
} from "@/constants/transform-limits";
import {
  useDeactivateTransform,
  useDryRunTransform,
  useEntityTransform,
  useSaveTransform,
  useValidateTransform,
} from "@/queryOptions/connector/schema/transform/useEntityTransform";
import {
  type ConnectorTable,
  type MappingTableRow,
  type RowFilterConfig,
  type TransformDryRunResponse,
  type TransformValidateResponse,
} from "@/types/connectors";

import ExpandableCodeEditor from "./ExpandableCodeEditor";
import ExpandablePreviewTable from "./ExpandablePreviewTable";
import VirtualMappingTable from "./VirtualMappingTable";

type FilterChip = "all" | "unmapped_source" | "unmapped_target" | "warnings";

interface TransformModalProps {
  open: boolean;
  onClose: () => void;
  connectionId: number;
  tableItem: ConnectorTable;
  modalTitle: string;
  onApplyRowFilter?: (_config: RowFilterConfig) => void;
}

const STEPS = ["Column mapping", "Script", "Review and test"];

const TransformModal = ({
  open,
  onClose,
  connectionId,
  tableItem,
  modalTitle,
  onApplyRowFilter,
}: TransformModalProps) => {
  const [step, setStep] = useState(0);
  const [mappingJson, setMappingJson] = useState<Record<
    string,
    unknown
  > | null>(null);
  const [scriptText, setScriptText] = useState("");
  const [entryPoint, setEntryPoint] = useState("");
  const [runOrder, setRunOrder] = useState("filter_script_mapping");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterChip>("all");
  const [parsing, setParsing] = useState(false);
  const [validateResult, setValidateResult] =
    useState<TransformValidateResponse | null>(null);
  const [dryRunResult, setDryRunResult] =
    useState<TransformDryRunResponse | null>(null);
  const [saveWithoutTest, setSaveWithoutTest] = useState(false);
  const [sampleSize, setSampleSize] = useState(DEFAULT_DRY_RUN_ROWS);

  const { data: transformData } = useEntityTransform(
    connectionId,
    tableItem.table,
  );
  const validateMut = useValidateTransform(connectionId, tableItem.table);
  const dryRunMut = useDryRunTransform(connectionId, tableItem.table);
  const saveMut = useSaveTransform(connectionId, tableItem.table);
  const deactivateMut = useDeactivateTransform(connectionId, tableItem.table);

  useEffect(() => {
    if (!open) return;
    const active = transformData?.active;
    if (active) {
      setMappingJson((active.mapping_json as Record<string, unknown>) || null);
      setScriptText(active.script_text || "");
      setEntryPoint(active.entry_point || "");
      setRunOrder(active.run_order || "filter_script_mapping");
    } else {
      setMappingJson(null);
      setScriptText("");
      setEntryPoint("");
      setRunOrder("filter_script_mapping");
    }
    setStep(0);
    setValidateResult(null);
    setDryRunResult(null);
    setSaveWithoutTest(false);
  }, [open, transformData?.active]);

  const mappingTable: MappingTableRow[] = useMemo(
    () => validateResult?.mapping_table ?? dryRunResult?.mapping_table ?? [],
    [validateResult, dryRunResult],
  );

  const counts = validateResult?.counts ?? dryRunResult?.counts;

  const handleFileDrop = useCallback(async (file: File) => {
    if (file.size > MAX_MAPPING_JSON_BYTES) {
      toaster.error({
        title: `JSON file exceeds ${MAX_MAPPING_JSON_BYTES / (1024 * 1024)} MB limit`,
      });
      return;
    }
    setParsing(true);
    try {
      const text = await file.text();
      const worker = new Worker(
        new URL("@/workers/parseMappingJson.worker.ts", import.meta.url),
        { type: "module" },
      );
      worker.postMessage(text);
      worker.onmessage = (ev) => {
        const result = ev.data as {
          ok: boolean;
          data?: Record<string, unknown>;
          error?: string;
        };
        if (result.ok && result.data) {
          setMappingJson(result.data);
          toaster.success({ title: "Mapping JSON loaded" });
        } else {
          toaster.error({ title: result.error || "Invalid JSON" });
        }
        setParsing(false);
        worker.terminate();
      };
    } catch {
      setParsing(false);
      toaster.error({ title: "Failed to read file" });
    }
  }, []);

  const runValidate = useCallback(async () => {
    try {
      const result = await validateMut.mutateAsync({
        mapping_json: mappingJson,
        script_text: scriptText,
        entry_point: entryPoint,
      });
      setValidateResult(result);
      if (result.entry_points?.length && !entryPoint) {
        setEntryPoint(result.entry_points[0]);
      }
      return result;
    } catch {
      setValidateResult(null);
      toaster.error({
        title: "Mapping preview unavailable",
        description:
          "Validate failed. Check that FastAPI is deployed with entity-transform routes.",
      });
      throw new Error("validate failed");
    }
  }, [validateMut, mappingJson, scriptText, entryPoint]);

  useEffect(() => {
    if (!open || !mappingJson) return;
    let cancelled = false;
    void (async () => {
      try {
        const result = await validateMut.mutateAsync({
          mapping_json: mappingJson,
          script_text: scriptText,
          entry_point: entryPoint,
        });
        if (cancelled) return;
        setValidateResult(result);
        if (result.entry_points?.length && !entryPoint) {
          setEntryPoint(result.entry_points[0]);
        }
      } catch {
        if (!cancelled) setValidateResult(null);
      }
    })();
    return () => {
      cancelled = true;
    };
    // Auto-refresh column mapping preview when JSON is loaded or replaced.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- script/entry re-validated on Next
  }, [open, mappingJson]);

  const runDryRun = useCallback(async () => {
    try {
      const result = await dryRunMut.mutateAsync({
        mapping_json: mappingJson,
        script_text: scriptText,
        entry_point: entryPoint,
        run_order: runOrder,
        sample_size: Math.min(sampleSize, MAX_DRY_RUN_ROWS),
      });
      setDryRunResult(result);
      return result;
    } catch (err) {
      setDryRunResult(null);
      const message =
        typeof err === "object" &&
        err !== null &&
        "message" in err &&
        typeof (err as { message?: string }).message === "string"
          ? (err as { message: string }).message
          : "Dry run failed. Try a smaller sample size or check SAP connectivity.";
      toaster.error({
        title: "Dry run failed",
        description: message,
      });
      throw err;
    }
  }, [dryRunMut, mappingJson, scriptText, entryPoint, runOrder, sampleSize]);

  const handleSave = async () => {
    await saveMut.mutateAsync({
      mapping_json: mappingJson,
      script_text: scriptText,
      entry_point: entryPoint,
      run_order: runOrder,
      mapping_overrides: {},
    });
    toaster.success({ title: "Transform saved and activated" });
    onClose();
  };

  const handleRemove = async () => {
    await deactivateMut.mutateAsync();
    toaster.success({ title: "Transform removed" });
    onClose();
  };

  const canSave =
    saveWithoutTest ||
    (dryRunResult &&
      dryRunResult.errors.length === 0 &&
      dryRunResult.rows_out >= 0);

  const hasActive = Boolean(transformData?.active?.is_active);

  return (
    <Dialog.Root lazyMount open={open} size="lg">
      <Portal>
        <Dialog.Backdrop bg="blackAlpha.600" backdropFilter="blur(4px)" />
        <Dialog.Positioner>
          <Dialog.Content
            borderRadius="xl"
            maxW="640px"
            w="100%"
            maxH="90vh"
            display="flex"
            flexDirection="column"
          >
            <Dialog.Header bg="gray.50" flexShrink={0}>
              <Dialog.Title color="brand.800" fontSize="lg">
                Mapping and transform: {modalTitle}
              </Dialog.Title>
              <Dialog.CloseTrigger asChild>
                <CloseButton size="sm" onClick={onClose} />
              </Dialog.CloseTrigger>
            </Dialog.Header>

            <Flex px={6} py={3} gap={2} flexShrink={0} borderBottomWidth={1}>
              {STEPS.map((label, idx) => (
                <Badge
                  key={label}
                  colorPalette={step === idx ? "brand" : "gray"}
                  variant={step === idx ? "solid" : "outline"}
                  cursor="pointer"
                  onClick={() => setStep(idx)}
                >
                  {idx + 1}. {label}
                </Badge>
              ))}
            </Flex>

            <Dialog.Body overflowY="auto" flex="1" px={6} py={4}>
              {step === 0 && (
                <VStack align="stretch" gap={4}>
                  <Box
                    borderWidth={2}
                    borderStyle="dashed"
                    borderColor="gray.300"
                    borderRadius="md"
                    p={6}
                    textAlign="center"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const file = e.dataTransfer.files[0];
                      if (file) handleFileDrop(file);
                    }}
                  >
                    <Text fontSize="sm" color="gray.600" mb={2}>
                      Drop mapping JSON here or browse
                    </Text>
                    <Input
                      type="file"
                      accept=".json,application/json"
                      size="sm"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileDrop(file);
                      }}
                    />
                    {parsing && (
                      <Text fontSize="xs" color="brand.500">
                        Parsing…
                      </Text>
                    )}
                  </Box>

                  {counts && (
                    <Text fontSize="sm" color="gray.600">
                      {counts.mapped} mapped · {counts.not_selected} not
                      selected · {counts.from_script} from script
                    </Text>
                  )}

                  <Input
                    placeholder="Search SAP or target column"
                    size="sm"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />

                  <Flex gap={2} flexWrap="wrap">
                    {(
                      [
                        ["all", "All"],
                        ["unmapped_source", "Unmapped source"],
                        ["unmapped_target", "Unmapped target"],
                        ["warnings", "Warnings"],
                      ] as const
                    ).map(([key, label]) => (
                      <Button
                        key={key}
                        size="xs"
                        variant={filter === key ? "solid" : "outline"}
                        colorPalette={filter === key ? "brand" : "gray"}
                        onClick={() => setFilter(key)}
                      >
                        {label}
                      </Button>
                    ))}
                  </Flex>

                  {validateMut.isPending && mappingTable.length === 0 && (
                    <Text fontSize="sm" color="gray.500">
                      Loading mapping preview…
                    </Text>
                  )}

                  {!validateMut.isPending &&
                    mappingJson &&
                    mappingTable.length === 0 && (
                      <Text fontSize="sm" color="gray.500">
                        No mapping rows to preview yet.
                      </Text>
                    )}

                  {mappingTable.length > 0 && (
                    <VirtualMappingTable
                      rows={mappingTable}
                      search={search}
                      filter={filter}
                    />
                  )}

                  {validateResult?.row_filter_config && onApplyRowFilter && (
                    <Button
                      size="sm"
                      variant="outline"
                      colorPalette="brand"
                      onClick={() =>
                        onApplyRowFilter(
                          validateResult.row_filter_config as RowFilterConfig,
                        )
                      }
                    >
                      Apply to entity filter
                    </Button>
                  )}

                  {validateResult?.warnings?.map((w) => (
                    <Text key={w.message} fontSize="xs" color="orange.600">
                      {w.message}
                    </Text>
                  ))}
                </VStack>
              )}

              {step === 1 && (
                <VStack align="stretch" gap={4}>
                  <Input
                    type="file"
                    accept=".py,text/x-python"
                    size="sm"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (file.size > MAX_SCRIPT_BYTES) {
                        toaster.error({ title: "Script exceeds size limit" });
                        return;
                      }
                      setScriptText(await file.text());
                    }}
                  />
                  <ExpandableCodeEditor
                    value={scriptText}
                    onChange={setScriptText}
                  />
                  <Box>
                    <Text fontSize="sm" fontWeight="semibold" mb={1}>
                      Entry point
                    </Text>
                    <Input
                      size="sm"
                      value={entryPoint}
                      onChange={(e) => setEntryPoint(e.target.value)}
                      placeholder="Auto-detected if empty"
                    />
                  </Box>
                  <Box>
                    <Text fontSize="sm" fontWeight="semibold" mb={1}>
                      Run order
                    </Text>
                    <NativeSelect.Root size="sm">
                      <NativeSelect.Field
                        value={runOrder}
                        onChange={(e) => setRunOrder(e.target.value)}
                      >
                        <option value="filter_script_mapping">
                          SAP filter, script, mapping on leftover columns, load
                        </option>
                        <option value="mapping_script">
                          Mapping first, then script
                        </option>
                      </NativeSelect.Field>
                    </NativeSelect.Root>
                  </Box>
                  <Text fontSize="xs" color="gray.500">
                    Contract: function receives a DataFrame with SAP column
                    names and returns a DataFrame with exactly the target
                    columns.
                  </Text>
                  {validateResult?.checklist?.map((item) => (
                    <Flex key={item.id} gap={2} fontSize="sm" align="center">
                      <Text color={item.passed ? "green.500" : "red.500"}>
                        {item.passed ? "✓" : "✗"}
                      </Text>
                      <Text>{item.label}</Text>
                      {item.message && (
                        <Text color="red.500" fontSize="xs">
                          {item.message}
                        </Text>
                      )}
                    </Flex>
                  ))}
                </VStack>
              )}

              {step === 2 && (
                <VStack align="stretch" gap={4}>
                  <Flex gap={2} align="center">
                    <Input
                      type="number"
                      size="sm"
                      w="120px"
                      min={1}
                      max={MAX_DRY_RUN_ROWS}
                      value={sampleSize}
                      onChange={(e) => setSampleSize(Number(e.target.value))}
                    />
                    <Button
                      colorPalette="brand"
                      size="sm"
                      loading={dryRunMut.isPending}
                      onClick={runDryRun}
                    >
                      Run dry run
                    </Button>
                  </Flex>
                  {dryRunResult && (
                    <>
                      <Text fontSize="sm">
                        Rows in: {dryRunResult.rows_in} · Rows out:{" "}
                        {dryRunResult.rows_out} · Columns:{" "}
                        {dryRunResult.columns_out.length} /{" "}
                        {dryRunResult.expected_columns.length}
                      </Text>
                      {dryRunResult.warnings.map((w) => (
                        <Text key={w.message} fontSize="xs" color="orange.600">
                          {w.message}
                        </Text>
                      ))}
                      {dryRunResult.errors.map((e) => (
                        <Text key={e.message} fontSize="xs" color="red.600">
                          {e.message}
                          {e.line ? ` (line ${e.line})` : ""}
                        </Text>
                      ))}
                      {dryRunResult.input_preview?.length > 0 && (
                        <ExpandablePreviewTable
                          title="Input preview"
                          rows={dryRunResult.input_preview}
                        />
                      )}
                      {dryRunResult.output_preview?.length > 0 && (
                        <ExpandablePreviewTable
                          title="Output preview"
                          rows={dryRunResult.output_preview}
                        />
                      )}
                      <Checkbox.Root
                        checked={saveWithoutTest}
                        onCheckedChange={(d) =>
                          setSaveWithoutTest(Boolean(d.checked))
                        }
                      >
                        <Checkbox.HiddenInput />
                        <Checkbox.Control />
                        <Checkbox.Label fontSize="sm">
                          Save without testing
                        </Checkbox.Label>
                      </Checkbox.Root>
                    </>
                  )}
                </VStack>
              )}
            </Dialog.Body>

            <Dialog.Footer
              bg="gray.50"
              flexShrink={0}
              justifyContent="space-between"
            >
              <Flex gap={2} align="center">
                {hasActive && (
                  <Link color="red.500" fontSize="sm" onClick={handleRemove}>
                    Remove mapping
                  </Link>
                )}
              </Flex>
              <Flex gap={2}>
                {step > 0 && (
                  <Button variant="outline" onClick={() => setStep(step - 1)}>
                    Back
                  </Button>
                )}
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                {step < 2 ? (
                  <Button
                    colorPalette="brand"
                    loading={validateMut.isPending}
                    onClick={async () => {
                      try {
                        await runValidate();
                        setStep(step + 1);
                      } catch {
                        /* toast shown in runValidate */
                      }
                    }}
                  >
                    Next
                  </Button>
                ) : (
                  <Button
                    colorPalette="brand"
                    disabled={!canSave}
                    loading={saveMut.isPending}
                    onClick={handleSave}
                  >
                    Save and activate
                  </Button>
                )}
              </Flex>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
};

export default TransformModal;
