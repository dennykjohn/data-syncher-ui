import { useState } from "react";

import {
  Button,
  Checkbox,
  CloseButton,
  Dialog,
  Field,
  Flex,
  IconButton,
  Input,
  NativeSelect,
  Portal,
  Text,
} from "@chakra-ui/react";

import { IoMdTrash } from "react-icons/io";

import { format } from "date-fns";

import { Tooltip } from "@/components/ui/tooltip";
import useDeleteDeltaTable from "@/queryOptions/connector/schema/useDeleteDeltaTable";

interface TargetSettings {
  output_file_name: string;
  load_method: string;
  partition_delta_by_date: boolean;
  file_format: string;
  compression_method: string;
  delete_and_load?: boolean;
}

const LabeledField = ({
  label,
  children,
  extra,
}: {
  label: string;
  children: React.ReactNode;
  extra?: React.ReactNode;
}) => (
  <Field.Root>
    <Field.Label
      fontSize="sm"
      fontWeight="semibold"
      color="gray.700"
      mb={1}
      display={extra ? "flex" : undefined}
      justifyContent={extra ? "space-between" : undefined}
      alignItems={extra ? "center" : undefined}
      width={extra ? "100%" : undefined}
    >
      <Text as="span">{label}</Text>
      {extra}
    </Field.Label>
    {children}
  </Field.Root>
);

const LockableCheckbox = ({
  label,
  checked,
  locked,
  onChange,
  dimWhenLocked = false,
}: {
  label: string;
  checked: boolean;
  locked: boolean;
  onChange: (_v: boolean) => void;
  dimWhenLocked?: boolean;
}) => (
  <Flex align="center" gap={2} py={0}>
    <Text
      fontSize="sm"
      color={dimWhenLocked && locked ? "gray.400" : "gray.700"}
    >
      {label}
    </Text>
    <Checkbox.Root
      size="sm"
      colorPalette="brand"
      disabled={locked}
      checked={checked}
      onCheckedChange={(details) => onChange(!!details.checked)}
    >
      <Checkbox.HiddenInput />
      <Checkbox.Control cursor={locked ? "not-allowed" : "pointer"} />
    </Checkbox.Root>
  </Flex>
);

interface TargetSettingsModalProps {
  open: boolean;
  onClose: () => void;
  tableName: string;
  displayName: string;
  isDelta: boolean;
  status?: "in_progress" | "completed" | "failed" | null;
  connectionId: number;
  settings: TargetSettings;
  onSave: (_settings: TargetSettings) => Promise<void>;
  isSaving?: boolean;
  /** True when the pipeline has locked the load_method (delta tracking started). */
  loadMethodLocked?: boolean;
  /** ISO timestamp of the first successful run — shown in the reset confirmation dialog. */
  firstSyncTimestamp?: string | null;
  /** Name of the destination to customize target label (e.g. adls -> folder, snowflake -> table). */
  destinationName?: string;
}

const TargetSettingsModal = ({
  open,
  onClose,
  tableName,
  displayName,
  isDelta,
  status,
  connectionId,
  settings,
  onSave,
  isSaving = false,
  loadMethodLocked = false,
  firstSyncTimestamp = null,
  destinationName,
}: TargetSettingsModalProps) => {
  const [localSettings, setLocalSettings] = useState<TargetSettings>(() => {
    let loadMethod = settings.load_method || "initial";
    if (!isDelta) {
      loadMethod = "initial";
    }
    return {
      ...settings,
      load_method: loadMethod,
      delete_and_load: !!settings.delete_and_load,
    };
  });

  const patchSettings = (patch: Partial<TargetSettings>) =>
    setLocalSettings((prev) => ({ ...prev, ...patch }));

  // State for the delete/reset confirmation dialog
  const [isConfirmResetOpen, setIsConfirmResetOpen] = useState(false);

  const { mutate: deleteDeltaTable, isPending: isDeletingDelta } =
    useDeleteDeltaTable({
      connectionId,
    });

  const handleSave = () => {
    const loadMethod = localSettings.load_method || "initial";
    const needsPartition = isDelta && loadMethod !== "initial";
    const finalSettings = {
      ...localSettings,
      delete_and_load:
        loadMethod === "initial" ? !!localSettings.delete_and_load : false,
      partition_delta_by_date: needsPartition
        ? localSettings.partition_delta_by_date
        : false,
      file_format: "parquet", // Always force parquet
    };
    onSave(finalSettings);
  };

  const currentLoadMethod = localSettings.load_method || "initial";
  const showPartitionCheckbox = isDelta && currentLoadMethod !== "initial";

  /**
   * The load method selector is locked when:
   * - The backend has set load_method_locked=True (delta tracking started), OR
   * - The legacy status-based lock condition (status=completed + delta/initial_delta)
   *
   * loadMethodLocked from the backend is authoritative; the status fallback
   * is kept for backwards compatibility.
   */
  const isLoadMethodLocked =
    loadMethodLocked ||
    !!firstSyncTimestamp ||
    (status === "completed" &&
      (currentLoadMethod === "initial_delta" || currentLoadMethod === "delta"));

  const handleConfirmReset = () => {
    deleteDeltaTable({
      connection_id: connectionId,
      table_name: tableName,
    });
    setIsConfirmResetOpen(false);
  };

  /**
   * Format firstSyncTimestamp into a human-readable string for the
   * confirmation dialog.  Falls back gracefully if null / invalid.
   */
  const formattedFirstSync = (() => {
    if (!firstSyncTimestamp) return null;
    try {
      return format(new Date(firstSyncTimestamp), "MMM dd, yyyy, hh:mm:ss a");
    } catch {
      return firstSyncTimestamp;
    }
  })();

  const normalizedDest = destinationName?.toLowerCase() || "";
  const isADLS =
    normalizedDest.includes("adls") ||
    normalizedDest.includes("lake") ||
    normalizedDest.includes("azure") ||
    normalizedDest.includes("storage");
  const isSnowflake = normalizedDest.includes("snowflake");

  const targetLabel = isADLS
    ? "Target Folder name"
    : isSnowflake
      ? "Target Table name"
      : "Target name";

  return (
    <>
      <Dialog.Root lazyMount open={open} size="md">
        <Portal>
          <Dialog.Backdrop bg="blackAlpha.600" backdropFilter="blur(4px)" />
          <Dialog.Positioner>
            <Dialog.Content
              borderRadius="xl"
              boxShadow="2xl"
              bg="white"
              overflow="hidden"
              maxH="90vh"
              display="flex"
              flexDirection="column"
              maxW="500px"
              width="95%"
            >
              <Dialog.Header
                bg="gray.50"
                borderBottomWidth="1px"
                borderColor="gray.200"
                p={3}
              >
                <Flex
                  justifyContent="space-between"
                  alignItems="center"
                  width="100%"
                >
                  <Dialog.Title
                    color="brand.800"
                    fontWeight="bold"
                    fontSize="lg"
                  >
                    Target settings: {displayName}
                  </Dialog.Title>
                </Flex>
              </Dialog.Header>

              <Dialog.Body p={3} overflowY="auto">
                <Flex width="100%" direction="column" gap={2}>
                  {/* Load Method */}
                  <LabeledField label="Load method">
                    <Flex align="center" gap={2} width="100%">
                      <NativeSelect.Root
                        size="sm"
                        disabled={isLoadMethodLocked}
                        flex="1"
                      >
                        <NativeSelect.Field
                          {...{ disabled: isLoadMethodLocked }}
                          value={localSettings.load_method}
                          onChange={(e) =>
                            patchSettings({ load_method: e.target.value })
                          }
                        >
                          {isDelta ? (
                            <>
                              <option value="initial">Initial</option>
                              <option value="initial_delta">
                                Initial and Delta
                              </option>
                              <option value="delta">Delta Only</option>
                            </>
                          ) : (
                            <option value="initial">Initial</option>
                          )}
                        </NativeSelect.Field>
                        <NativeSelect.Indicator />
                      </NativeSelect.Root>

                      {/* Reset (delete) button — only shown when the load method is locked */}
                      {isLoadMethodLocked && (
                        <Tooltip content="Clear table data and unlock settings">
                          <IconButton
                            size="xs"
                            colorPalette="red"
                            variant="ghost"
                            onClick={() => setIsConfirmResetOpen(true)}
                            loading={isDeletingDelta}
                            height="32px"
                            width="32px"
                            minWidth="32px"
                            fontSize="18px"
                            color="red.600"
                            _hover={{
                              bg: "red.50",
                              color: "red.700",
                            }}
                            aria-label="Clear table data"
                          >
                            <IoMdTrash />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Flex>
                  </LabeledField>

                  {/* Delete and Load Checkbox (only if load_method is initial) */}
                  {currentLoadMethod === "initial" && (
                    <LockableCheckbox
                      label="Delete and Load"
                      checked={!!localSettings.delete_and_load}
                      locked={isLoadMethodLocked}
                      onChange={(v) => patchSettings({ delete_and_load: v })}
                    />
                  )}

                  {/* Partition Delta by Date Checkbox (only if isDelta and load_method is not initial) */}
                  {showPartitionCheckbox && (
                    <LockableCheckbox
                      label="Partition Delta by Date"
                      checked={!!localSettings.partition_delta_by_date}
                      locked={isLoadMethodLocked}
                      dimWhenLocked
                      onChange={(v) =>
                        patchSettings({ partition_delta_by_date: v })
                      }
                    />
                  )}

                  {/* Target Name */}
                  <LabeledField
                    label={targetLabel}
                    extra={
                      formattedFirstSync && (
                        <Text
                          as="span"
                          fontSize="xs"
                          color="black"
                          fontWeight="normal"
                        >
                          {"Initialisation => "}
                          {formattedFirstSync}
                        </Text>
                      )
                    }
                  >
                    <Input
                      size="sm"
                      disabled={isLoadMethodLocked}
                      value={localSettings.output_file_name}
                      onChange={(e) =>
                        patchSettings({ output_file_name: e.target.value })
                      }
                      placeholder={targetLabel}
                    />
                  </LabeledField>

                  {/* File Type */}
                  <LabeledField label="File type">
                    <NativeSelect.Root size="sm" disabled>
                      <NativeSelect.Field
                        {...{ disabled: true }}
                        value="parquet"
                      >
                        <option value="parquet">Parquet</option>
                      </NativeSelect.Field>
                      <NativeSelect.Indicator />
                    </NativeSelect.Root>
                  </LabeledField>

                  {/* Compression Method */}
                  <LabeledField label="Compression method">
                    <NativeSelect.Root size="sm" disabled={isLoadMethodLocked}>
                      <NativeSelect.Field
                        {...{ disabled: isLoadMethodLocked }}
                        value={localSettings.compression_method}
                        onChange={(e) =>
                          patchSettings({ compression_method: e.target.value })
                        }
                      >
                        <option value="none">None</option>
                        <option value="gzip">Gzip</option>
                        <option value="snappy">Snappy</option>
                      </NativeSelect.Field>
                      <NativeSelect.Indicator />
                    </NativeSelect.Root>
                  </LabeledField>
                </Flex>
              </Dialog.Body>

              <Dialog.Footer
                bg="gray.50"
                borderTopWidth="1px"
                borderColor="gray.100"
                p={3}
                gap={3}
              >
                <Button
                  variant="outline"
                  onClick={onClose}
                  px={6}
                  borderRadius="full"
                  disabled={isSaving}
                  size="sm"
                >
                  Cancel
                </Button>
                <Button
                  colorPalette="brand"
                  onClick={handleSave}
                  loading={isSaving}
                  disabled={isLoadMethodLocked}
                  px={6}
                  borderRadius="full"
                  size="sm"
                >
                  Save
                </Button>
              </Dialog.Footer>

              <Dialog.CloseTrigger asChild>
                <CloseButton
                  size="sm"
                  onClick={onClose}
                  position="absolute"
                  right={4}
                  top={4}
                  disabled={isSaving}
                />
              </Dialog.CloseTrigger>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>

      {/* ── Reset Confirmation Dialog ─────────────────────────────────────── */}
      <Dialog.Root
        lazyMount
        open={isConfirmResetOpen}
        onOpenChange={(details) => setIsConfirmResetOpen(details.open)}
        size="sm"
      >
        <Portal>
          <Dialog.Backdrop bg="blackAlpha.700" backdropFilter="blur(4px)" />
          <Dialog.Positioner>
            <Dialog.Content borderRadius="xl" boxShadow="2xl" bg="white" p={2}>
              <Dialog.Header p={4} pb={2}>
                <Dialog.Title fontWeight="bold" fontSize="md" color="red.700">
                  Clear Table Data?
                </Dialog.Title>
              </Dialog.Header>
              <Dialog.Body px={4} pb={2}>
                <Flex direction="column" gap={3}>
                  <Text fontSize="sm" color="gray.700">
                    This will permanently clear all synced data and reset
                    tracking for{" "}
                    <Text as="span" fontWeight="semibold">
                      {displayName}
                    </Text>
                    .
                  </Text>
                  {formattedFirstSync && (
                    <Text fontSize="sm" color="gray.500">
                      Initialisation on:{" "}
                      <Text as="span" fontWeight="medium">
                        {formattedFirstSync}
                      </Text>
                    </Text>
                  )}
                  <Text
                    fontSize="xs"
                    color="red.600"
                    bg="red.50"
                    p={2}
                    borderRadius="md"
                  >
                    <strong>Warning:</strong> You must start a new sync for this
                    table to re-initialise it. The sync tracking state will be
                    cleared. The next run will be treated as a first run. This
                    action cannot be undone.
                  </Text>
                </Flex>
              </Dialog.Body>
              <Dialog.Footer p={4} gap={3}>
                <Button
                  variant="outline"
                  size="sm"
                  borderRadius="full"
                  onClick={() => setIsConfirmResetOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  colorPalette="red"
                  size="sm"
                  borderRadius="full"
                  onClick={handleConfirmReset}
                  loading={isDeletingDelta}
                >
                  Yes, Reset Delta
                </Button>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </>
  );
};

export default TargetSettingsModal;
