import { useState } from "react";

import {
  Box,
  Button,
  Checkbox,
  CloseButton,
  Dialog,
  Field,
  Flex,
  Grid,
  Input,
  NativeSelect,
  Portal,
  Text,
} from "@chakra-ui/react";

import {
  type ExcelConditionalFormat,
  type ExcelOptions,
} from "@/types/connectors";

import ExcelSettings from "./ExcelSettings";

export type FileFormat = "csv" | "json" | "parquet" | "excel";

export interface TableExportSetting {
  output_file_name: string;
  target_folder: string;
  file_format: FileFormat;
  csv_delimiter?: string;
  csv_quote_char?: string;
  add_utc_timestamp: boolean;
  notification_email_group_ids?: number[];
  excel_sheet_name?: string;
  excel_options?: ExcelOptions;
  excel_conditional_formats?: ExcelConditionalFormat[];
}

interface TableExportSettingsModalProps {
  open: boolean;
  onClose: () => void;
  tableName: string;
  settings: TableExportSetting;
  tableFields: Record<string, string | { data_type: string }>;
  onSave: (_settings: TableExportSetting) => void;
  isSaving?: boolean;
  supportedFormats?: string[];
}

const TableExportSettingsModal = ({
  open,
  onClose,
  tableName,
  settings,
  tableFields,
  onSave,
  isSaving = false,
  supportedFormats,
}: TableExportSettingsModalProps) => {
  const [prevOpen, setPrevOpen] = useState(open);
  const [localSettings, setLocalSettings] =
    useState<TableExportSetting>(settings);
  const [targetFolderError, setTargetFolderError] = useState("");

  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setLocalSettings(settings);
      setTargetFolderError("");
    }
  }

  const updateLocalSetting = (patch: Partial<TableExportSetting>) => {
    setLocalSettings((prev) => {
      const updated = { ...prev, ...patch };
      if (Object.prototype.hasOwnProperty.call(patch, "target_folder")) {
        setTargetFolderError("");
      }
      return updated;
    });
  };

  const handleTargetFolderChange = (value: string) => {
    updateLocalSetting({ target_folder: value });
  };

  const handleSave = () => {
    onSave(localSettings);
  };

  // Normalize tableFields for ExcelSettings component if needed.
  // ExcelSettings expects Record<string, string>, but tableFields could be Record<string, string | { data_type: string }>
  const normalizedTableFields = Object.entries(tableFields).reduce<
    Record<string, string>
  >((acc, [key, val]) => {
    acc[key] = typeof val === "string" ? val : val?.data_type || "";
    return acc;
  }, {});

  return (
    <Dialog.Root lazyMount open={open} size="lg">
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
            maxW="600px"
            width="95%"
          >
            <Dialog.Header
              bg="brand.50"
              borderBottomWidth="1px"
              borderColor="brand.100"
              p={3}
            >
              <Flex
                justifyContent="space-between"
                alignItems="center"
                width="100%"
              >
                <Dialog.Title color="brand.800" fontWeight="bold" fontSize="lg">
                  File Export Settings: {tableName}
                </Dialog.Title>
              </Flex>
            </Dialog.Header>
            <Dialog.Body p={3} overflowY="auto">
              <Flex width="100%" direction="column" gap={2}>
                <Grid templateColumns="1fr 1fr" gap={2}>
                  <Box>
                    <Field.Root gap={0} invalid={!!targetFolderError}>
                      <Field.Label
                        fontSize="xs"
                        fontWeight="semibold"
                        color="gray.600"
                        mb={0.5}
                      >
                        Target Folder
                      </Field.Label>
                      <Input
                        size="xs"
                        value={localSettings.target_folder}
                        onChange={(e) =>
                          handleTargetFolderChange(e.target.value)
                        }
                        placeholder="Target folder"
                      />
                      {targetFolderError && (
                        <Field.ErrorText fontSize="xs">
                          {targetFolderError}
                        </Field.ErrorText>
                      )}
                    </Field.Root>
                  </Box>

                  <Box>
                    <Field.Root gap={0}>
                      <Flex
                        alignItems="center"
                        gap={0}
                        mb={0.5}
                        wrap="nowrap"
                        whiteSpace="nowrap"
                      >
                        <Text
                          fontSize="xs"
                          fontWeight="semibold"
                          color="gray.600"
                          flexShrink={0}
                        >
                          Target File Name
                        </Text>
                        <Text
                          fontSize="10px"
                          color="gray.500"
                          ml={1.5}
                          flexShrink={0}
                        >
                          (Include Timestamp In Filename
                        </Text>
                        <Checkbox.Root
                          size="xs"
                          colorPalette="brand"
                          checked={localSettings.add_utc_timestamp}
                          onCheckedChange={(details) =>
                            updateLocalSetting({
                              add_utc_timestamp: !!details.checked,
                            })
                          }
                          display="inline-flex"
                          alignItems="center"
                          flexShrink={0}
                          ml={0.5}
                          mr={0}
                        >
                          <Checkbox.HiddenInput />
                          <Checkbox.Control />
                        </Checkbox.Root>
                        <Text fontSize="10px" color="gray.500" flexShrink={0}>
                          )
                        </Text>
                      </Flex>
                      <Input
                        size="xs"
                        value={localSettings.output_file_name}
                        onChange={(e) =>
                          updateLocalSetting({
                            output_file_name: e.target.value,
                          })
                        }
                        placeholder="Target file name"
                      />
                    </Field.Root>
                  </Box>
                </Grid>

                <Box>
                  <Text
                    fontSize="xs"
                    fontWeight="semibold"
                    color="gray.600"
                    mb={0.5}
                  >
                    File Type
                  </Text>
                  <NativeSelect.Root size="xs">
                    <NativeSelect.Field
                      value={localSettings.file_format}
                      onChange={(e) =>
                        updateLocalSetting({
                          file_format: e.target.value as FileFormat,
                        })
                      }
                    >
                      {(supportedFormats && supportedFormats.length > 0
                        ? supportedFormats
                        : ["csv", "excel", "json", "parquet"]
                      ).map((format) => (
                        <option key={format} value={format}>
                          {format === "csv"
                            ? "CSV"
                            : format === "excel"
                              ? "Excel"
                              : format === "json"
                                ? "JSON"
                                : format === "parquet"
                                  ? "Parquet"
                                  : format.toUpperCase()}
                        </option>
                      ))}
                    </NativeSelect.Field>
                    <NativeSelect.Indicator />
                  </NativeSelect.Root>
                </Box>

                {localSettings.file_format === "csv" && (
                  <Flex gap={3}>
                    <Box flex={1}>
                      <Text
                        fontSize="xs"
                        fontWeight="semibold"
                        color="gray.600"
                        mb={0.5}
                      >
                        CSV Delimiter
                      </Text>
                      <Input
                        size="xs"
                        value={localSettings.csv_delimiter ?? ""}
                        onChange={(e) =>
                          updateLocalSetting({
                            csv_delimiter: e.target.value,
                          })
                        }
                        placeholder=","
                      />
                    </Box>
                    <Box flex={1}>
                      <Text
                        fontSize="xs"
                        fontWeight="semibold"
                        color="gray.600"
                        mb={0.5}
                      >
                        CSV Quote Char
                      </Text>
                      <Input
                        size="xs"
                        value={localSettings.csv_quote_char ?? ""}
                        onChange={(e) =>
                          updateLocalSetting({
                            csv_quote_char: e.target.value,
                          })
                        }
                        placeholder={'"'}
                      />
                    </Box>
                  </Flex>
                )}

                {localSettings.file_format === "excel" && (
                  <ExcelSettings
                    excelOptions={localSettings.excel_options}
                    excelSheetName={localSettings.excel_sheet_name}
                    conditionalFormats={localSettings.excel_conditional_formats}
                    tableFields={normalizedTableFields}
                    tableName={tableName}
                    onChange={(patch) => updateLocalSetting(patch)}
                  />
                )}
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
              >
                Cancel
              </Button>
              <Button
                colorPalette="brand"
                onClick={handleSave}
                loading={isSaving}
                px={6}
                borderRadius="full"
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
  );
};

export default TableExportSettingsModal;
