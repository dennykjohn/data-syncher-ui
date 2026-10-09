import { useCallback, useEffect, useMemo, useRef, useState } from "react";

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
import {
  type DestinationNameSource,
  defaultDestinationDisplayName,
  defaultDestinationTableName,
  extractJsonTargetObjectname,
  isValidSnowflakeDestinationName,
  normalizeDestinationTableName,
  resolveDestinationTableName,
} from "@/utils/snowflakeDestinationTableName";

import DestinationTableField from "./DestinationTableField";
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
  occupiedDestinations?: Map<string, string>;
}

const STEPS = ["Column mapping", "Script", "Review and test"];

const entityParts = (tableItem: ConnectorTable) => {
  const serviceName =
    tableItem.service_name || tableItem.table.split("/")[0] || "";
  const entityName = tableItem.service_name
    ? tableItem.table
    : tableItem.table.split("/")[1] || tableItem.table.split("/")[0] || "";
  return { serviceName, entityName, tableName: tableItem.table };
};

const TransformModal = ({
  open,
  onClose,
  connectionId,
  tableItem,
  modalTitle,
  onApplyRowFilter,
  occupiedDestinations,
}: TransformModalProps) => {
  const parts = entityParts(tableItem);
  const defaultDisplay = defaultDestinationDisplayName(
    parts.serviceName,
    parts.entityName,
  );
  const defaultTable = defaultDestinationTableName(
    parts.serviceName,
    parts.entityName,
    parts.tableName,
  );

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

  const [destSource, setDestSource] =
    useState<DestinationNameSource>("DEFAULT");
  const [destName, setDestName] = useState(defaultTable);
  const [jsonRawName, setJsonRawName] = useState<string | null>(null);
  const [isEditingDest, setIsEditingDest] = useState(false);
  const [editDestValue, setEditDestValue] = useState("");
  const [destError, setDestError] = useState<string | null>(null);
  const [destWarnings, setDestWarnings] = useState<string[]>([]);
  const [confirmUseExisting, setConfirmUseExisting] = useState(false);
  const [renameMode, setRenameMode] = useState<
    "create_new" | "rename_existing" | null
  >(null);
  const [loadedRenamePrompt, setLoadedRenamePrompt] = useState<{
    previous: string;
    next: string;
  } | null>(null);

  const destNameRef = useRef(destName);
  destNameRef.current = destName;
  const destSourceRef = useRef(destSource);
  destSourceRef.current = destSource;

  const { data: transformData } = useEntityTransform(
    connectionId,
    tableItem.table,
  );
  const validateMut = useValidateTransform(connectionId, tableItem.table);
  const dryRunMut = useDryRunTransform(connectionId, tableItem.table);
  const saveMut = useSaveTransform(connectionId, tableItem.table);
  const deactivateMut = useDeactivateTransform(connectionId, tableItem.table);

  const previousSavedDest = (
    transformData?.active?.destination_table_name || ""
  )
    .trim()
    .toUpperCase();
  const hasLoadedData = Boolean(
    tableItem.initial_completed_flag || tableItem.first_sync_timestamp,
  );

  useEffect(() => {
    if (!open) return;
    const active = transformData?.active;
    if (active) {
      setMappingJson((active.mapping_json as Record<string, unknown>) || null);
      setScriptText(active.script_text || "");
      setEntryPoint(active.entry_point || "");
      setRunOrder(active.run_order || "filter_script_mapping");
      const source =
        (active.destination_name_source as DestinationNameSource) || "DEFAULT";
      setDestSource(source);
      setDestName(
        (active.destination_table_name || defaultTable).toUpperCase(),
      );
      setJsonRawName(active.json_table_name || null);
    } else {
      setMappingJson(null);
      setScriptText("");
      setEntryPoint("");
      setRunOrder("filter_script_mapping");
      setDestSource("DEFAULT");
      setDestName(defaultTable);
      setJsonRawName(null);
    }
    setStep(0);
    setValidateResult(null);
    setDryRunResult(null);
    setSaveWithoutTest(false);
    setIsEditingDest(false);
    setDestError(null);
    setDestWarnings([]);
    setConfirmUseExisting(false);
    setRenameMode(null);
    setLoadedRenamePrompt(null);
  }, [open, transformData?.active, defaultTable]);

  const mappingTable: MappingTableRow[] = useMemo(
    () => validateResult?.mapping_table ?? dryRunResult?.mapping_table ?? [],
    [validateResult, dryRunResult],
  );

  const counts = validateResult?.counts ?? dryRunResult?.counts;

  const collisionLabel = useMemo(() => {
    const name = destName.trim().toUpperCase();
    if (!name) return null;
    const occupied = occupiedDestinations?.get(name);
    if (occupied) return occupied;
    return validateResult?.destination?.collision?.entity_label || null;
  }, [destName, occupiedDestinations, validateResult?.destination?.collision]);

  const applyResolved = useCallback(
    (
      mapping: Record<string, unknown> | null,
      source: DestinationNameSource,
      manual?: string | null,
    ) => {
      const resolved = resolveDestinationTableName({
        serviceName: parts.serviceName,
        entityName: parts.entityName,
        tableName: parts.tableName,
        mappingJson: mapping,
        destinationNameSource: source,
        manualDestinationTableName: manual,
      });
      setDestSource(resolved.destinationNameSource);
      setDestName(resolved.destinationTableName);
      setJsonRawName(resolved.jsonTableName);
      setDestWarnings(resolved.warnings);
      if (!resolved.valid || !resolved.destinationTableName) {
        setDestError("Destination table name is invalid.");
      } else {
        setDestError(null);
      }
      return resolved;
    },
    [parts.entityName, parts.serviceName, parts.tableName],
  );

  const applyMappingJson = useCallback(
    (data: Record<string, unknown>) => {
      const jsonRaw = extractJsonTargetObjectname(data);
      const normalised = jsonRaw
        ? normalizeDestinationTableName(jsonRaw)
        : { name: "", warnings: [] as string[] };
      const current = destNameRef.current;
      const source = destSourceRef.current;

      if (source === "MANUAL") {
        setMappingJson(data);
        setJsonRawName(jsonRaw);
        toaster.success({ title: "Mapping JSON loaded" });
        return;
      }

      if (
        jsonRaw &&
        normalised.name &&
        current &&
        current !== normalised.name &&
        current !== defaultTable
      ) {
        const ok = window.confirm(
          `Rename destination table from ${current} to ${normalised.name}?`,
        );
        if (!ok) {
          setMappingJson(data);
          setDestSource("MANUAL");
          setJsonRawName(jsonRaw);
          toaster.success({ title: "Mapping JSON loaded" });
          return;
        }
      }

      setMappingJson(data);
      if (jsonRaw && normalised.name) {
        setDestSource("JSON");
        setDestName(normalised.name);
        setJsonRawName(jsonRaw);
        setDestWarnings(normalised.warnings);
        setDestError(null);
      } else {
        applyResolved(data, "DEFAULT");
      }
      setConfirmUseExisting(false);
      setRenameMode(null);
      toaster.success({ title: "Mapping JSON loaded" });
    },
    [applyResolved, defaultTable],
  );

  const handleFileDrop = useCallback(
    async (file: File) => {
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
            applyMappingJson(result.data);
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
    },
    [applyMappingJson],
  );

  const destPayload = useMemo(
    () => ({
      destination_name_source: destSource,
      destination_table_name: destName,
    }),
    [destName, destSource],
  );

  const runValidate = useCallback(async () => {
    try {
      const result = await validateMut.mutateAsync({
        mapping_json: mappingJson,
        script_text: scriptText,
        entry_point: entryPoint,
        ...destPayload,
      });
      setValidateResult(result);
      if (result.entry_points?.length && !entryPoint) {
        setEntryPoint(result.entry_points[0]);
      }
      if (result.destination?.warnings?.length) {
        setDestWarnings(result.destination.warnings);
      }
      if (result.destination?.error) {
        setDestError(result.destination.error);
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
  }, [validateMut, mappingJson, scriptText, entryPoint, destPayload]);

  useEffect(() => {
    if (!open || !mappingJson) return;
    let cancelled = false;
    void (async () => {
      try {
        const result = await validateMut.mutateAsync({
          mapping_json: mappingJson,
          script_text: scriptText,
          entry_point: entryPoint,
          destination_name_source: destSourceRef.current,
          destination_table_name: destNameRef.current,
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

  const localDestInvalid = useMemo(() => {
    if (!destName.trim()) return "Destination table name cannot be empty.";
    if (!isValidSnowflakeDestinationName(destName)) {
      return "Destination table name is not a valid Snowflake identifier.";
    }
    if (collisionLabel) {
      return `Destination table '${destName}' is already used by entity '${collisionLabel}'.`;
    }
    return null;
  }, [collisionLabel, destName]);

  const existingSnowflakeTable = Boolean(
    validateResult?.destination?.existing_snowflake_table &&
      !confirmUseExisting,
  );

  const destBlocksNext = Boolean(
    destError || localDestInvalid || existingSnowflakeTable || isEditingDest,
  );

  const handleSave = async (forcedRenameMode?: "create_new" | "rename_existing") => {
    const effectiveRename = forcedRenameMode || renameMode;
    const nextName = destName.trim().toUpperCase();
    if (
      hasLoadedData &&
      previousSavedDest &&
      previousSavedDest !== nextName &&
      !effectiveRename
    ) {
      setLoadedRenamePrompt({ previous: previousSavedDest, next: nextName });
      return;
    }
    try {
      await saveMut.mutateAsync({
        mapping_json: mappingJson,
        script_text: scriptText,
        entry_point: entryPoint,
        run_order: runOrder,
        mapping_overrides: {},
        destination_name_source: destSource,
        destination_table_name: destName,
        destination_rename_mode: effectiveRename,
        confirm_use_existing_table: confirmUseExisting,
      });
      toaster.success({ title: "Transform saved and activated" });
      onClose();
    } catch (err) {
      const data =
        typeof err === "object" &&
        err !== null &&
        "response" in err &&
        typeof (err as { response?: { data?: Record<string, unknown> } })
          .response?.data === "object"
          ? (err as { response: { data: Record<string, unknown> } }).response
              .data
          : null;
      const message =
        (typeof data?.message === "string" && data.message) ||
        "Could not save transform.";
      if (data?.requires_rename_confirmation) {
        setLoadedRenamePrompt({
          previous: previousSavedDest || String(data.previous_destination_table_name || ""),
          next: nextName,
        });
        return;
      }
      toaster.error({ title: message });
    }
  };

  const handleRemove = async () => {
    if (hasLoadedData && destName && destName !== defaultTable) {
      const ok = window.confirm(
        `Remove mapping and restore the default table name ${defaultTable}? Existing Snowflake table ${destName} will be left untouched.`,
      );
      if (!ok) return;
    }
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
  const shownError = destError || localDestInvalid;

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

                  <DestinationTableField
                    destinationTableName={destName}
                    jsonTableName={jsonRawName}
                    source={destSource}
                    defaultDisplayName={defaultDisplay || modalTitle}
                    isEditing={isEditingDest}
                    editValue={editDestValue}
                    error={shownError}
                    warnings={destWarnings}
                    existingSnowflakeTable={existingSnowflakeTable}
                    confirmUseExisting={confirmUseExisting}
                    renamePrompt={loadedRenamePrompt}
                    onUseDefault={() => {
                      applyResolved(mappingJson, "DEFAULT");
                      setConfirmUseExisting(false);
                    }}
                    onStartEdit={() => {
                      setIsEditingDest(true);
                      setEditDestValue(destName);
                    }}
                    onEditChange={setEditDestValue}
                    onCommitEdit={() => {
                      const resolved = applyResolved(
                        mappingJson,
                        "MANUAL",
                        editDestValue,
                      );
                      if (!resolved.valid) return;
                      setIsEditingDest(false);
                      setConfirmUseExisting(false);
                    }}
                    onCancelEdit={() => setIsEditingDest(false)}
                    onConfirmUseExisting={() => setConfirmUseExisting(true)}
                    onChooseAnotherName={() => {
                      setIsEditingDest(true);
                      setEditDestValue(destName);
                    }}
                    onRenameChoice={(mode) => {
                      setRenameMode(mode);
                      setLoadedRenamePrompt(null);
                      void handleSave(mode);
                    }}
                  />

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
                  <Text fontSize="sm">
                    Destination table:{" "}
                    <Text as="span" fontFamily="mono" fontWeight="medium">
                      {destName}
                    </Text>
                  </Text>
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
                    disabled={step === 0 && destBlocksNext}
                    onClick={async () => {
                      if (step === 0 && destBlocksNext) return;
                      try {
                        const result = await runValidate();
                        if (step === 0) {
                          if (result.destination?.error) return;
                          if (result.destination?.collision) return;
                          if (
                            result.destination?.existing_snowflake_table &&
                            !confirmUseExisting
                          ) {
                            return;
                          }
                        }
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
                    disabled={!canSave || destBlocksNext}
                    loading={saveMut.isPending}
                    onClick={() => void handleSave()}
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
