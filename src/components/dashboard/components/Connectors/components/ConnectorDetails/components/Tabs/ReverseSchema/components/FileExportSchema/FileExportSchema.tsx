import { useEffect, useMemo, useState } from "react";

import {
  Box,
  Button,
  Checkbox,
  Flex,
  Grid,
  IconButton,
  Image,
  Input,
  InputGroup,
  Text,
  VStack,
} from "@chakra-ui/react";

import {
  IoMdMail,
  IoMdOptions,
  IoMdPlay,
  IoMdSettings,
  IoMdTrash,
} from "react-icons/io";
import { IoCaretDownSharp } from "react-icons/io5";
import { MdSearch } from "react-icons/md";
import { PiKeyFill } from "react-icons/pi";

import CheckIcon from "@/assets/icons/check-icon.svg";
import ErrorIcon from "@/assets/icons/error-icon.svg";
import SandtimeIcon from "@/assets/icons/sand-time-icon.svg";
import Pagination from "@/components/shared/Pagination";
import { toaster } from "@/components/ui/toaster";
import { Tooltip } from "@/components/ui/tooltip";
import { type ReverseSchemaResponse } from "@/queryOptions/connector/reverseSchema/useFetchReverseSchema";
import useFetchTableStatus from "@/queryOptions/connector/schema/useFetchTableStatus";
import { usePagination } from "@/queryOptions/connector/schema/usePagination";
import useUpdateSelectedTables from "@/queryOptions/connector/schema/useUpdateSelectedTables";
import useFetchEmailGroups from "@/queryOptions/emailGroups/useFetchEmailGroups";
import {
  type Connector,
  type ConnectorTable,
  type ExcelConditionalFormat,
  type ExcelOptions,
} from "@/types/connectors";

import { isPrimaryKey } from "../../utils/validation";
import EmailGroupSelectionModal from "./EmailGroupSelectionModal";
import { DEFAULT_EXCEL_OPTIONS, cleanRulePayload } from "./ExcelSettings";
import FieldSelectionModal from "./FieldSelectionModal";
import TableExportSettingsModal from "./TableExportSettingsModal";
import useUpdateSelectedFields from "./hooks/useUpdateSelectedFields";
import useUpdateTableEmailGroups from "./hooks/useUpdateTableEmailGroups";
import useUpdateTableExportSettings from "./hooks/useUpdateTableExportSettings";
import { useQueryClient } from "@tanstack/react-query";

type FileFormat = "csv" | "json" | "parquet" | "excel";

type TableExportSetting = {
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
};

type TableExportDefaults = Omit<TableExportSetting, "output_file_name">;

interface SnowflakeFileExportSchemaProps {
  connector: Connector;
  reverseSchemaData: ReverseSchemaResponse | null;
  isDisabled: boolean;
}

const ITEMS_PER_PAGE = 50;
const COLLAPSED_ROW_MIN_HEIGHT = "40px";
const COLLAPSED_ROW_PX = 2;
const COLLAPSED_ROW_PY = 1;

const DEFAULT_TABLE_SETTINGS: TableExportDefaults = {
  target_folder: "",
  file_format: "csv",
  csv_delimiter: ",",
  csv_quote_char: '"',
  add_utc_timestamp: true,
  notification_email_group_ids: [],
};

const isValidFileFormat = (value: unknown): value is FileFormat =>
  value === "csv" ||
  value === "json" ||
  value === "parquet" ||
  value === "excel";

function safeParseJson<T>(val: unknown): T | undefined {
  if (typeof val === "string") {
    try {
      return JSON.parse(val) as T;
    } catch {
      return undefined;
    }
  }
  return val as T;
}

const sanitizeExcelOptions = (
  opts?: ExcelOptions,
): ExcelOptions | undefined => {
  if (!opts) return undefined;
  const nextOpts = { ...opts };
  if (nextOpts.sheet_header_enabled === false) {
    delete nextOpts.sheet_header;
    delete nextOpts.sheet_header_style;
    delete nextOpts.sheet_header_row_span;
    delete (nextOpts as Record<string, unknown>).sheet_header_title;
    delete (nextOpts as Record<string, unknown>).sheet_header_merge_rows;
  }
  return nextOpts;
};

const normalizeTableSetting = (
  tableName: string,
  raw?: Partial<ConnectorTable>,
): TableExportSetting => ({
  output_file_name: raw?.output_file_name || tableName,
  target_folder: raw?.target_folder || "",
  file_format: isValidFileFormat(raw?.file_format) ? raw.file_format : "csv",
  csv_delimiter: raw?.csv_delimiter || DEFAULT_TABLE_SETTINGS.csv_delimiter,
  csv_quote_char: raw?.csv_quote_char || DEFAULT_TABLE_SETTINGS.csv_quote_char,
  add_utc_timestamp:
    typeof raw?.add_utc_timestamp === "boolean"
      ? raw.add_utc_timestamp
      : DEFAULT_TABLE_SETTINGS.add_utc_timestamp,
  notification_email_group_ids: Array.isArray(raw?.notification_email_group_ids)
    ? raw.notification_email_group_ids
    : [],
  excel_sheet_name: raw?.excel_sheet_name || undefined,
  excel_options:
    sanitizeExcelOptions(safeParseJson<ExcelOptions>(raw?.excel_options)) ||
    undefined,
  excel_conditional_formats:
    safeParseJson<ExcelConditionalFormat[]>(
      raw?.excel_conditional_formats,
    )?.map(cleanRulePayload) || undefined,
});

const sanitizeTableExportSetting = (
  setting: TableExportSetting,
  isEmailSupported: boolean,
): TableExportSetting => {
  const base: TableExportSetting = {
    output_file_name: setting.output_file_name.trim(),
    target_folder: setting.target_folder.trim(),
    file_format: setting.file_format,
    add_utc_timestamp: setting.add_utc_timestamp,
    ...(isEmailSupported
      ? {
          notification_email_group_ids:
            setting.notification_email_group_ids || [],
        }
      : {}),
  };

  if (setting.file_format === "csv") {
    base.csv_delimiter = setting.csv_delimiter || ",";
    base.csv_quote_char = setting.csv_quote_char || '"';
  } else if (setting.file_format === "excel") {
    base.excel_sheet_name =
      setting.excel_sheet_name || setting.excel_options?.sheet_name || "Sheet1";
    base.excel_options = sanitizeExcelOptions(
      setting.excel_options || {
        ...DEFAULT_EXCEL_OPTIONS,
        sheet_name: base.excel_sheet_name,
      },
    );
    base.excel_conditional_formats =
      setting.excel_conditional_formats?.map(cleanRulePayload) || [];
  }

  return base;
};

const hasApiTableExportSettings = (raw?: Partial<ConnectorTable>) =>
  !!raw &&
  ((raw.output_file_name !== null && raw.output_file_name !== undefined) ||
    (raw.target_folder !== null && raw.target_folder !== undefined) ||
    (raw.file_format !== null && raw.file_format !== undefined));

const getReusableTableDefaults = (
  raw?: Partial<TableExportSetting>,
): TableExportDefaults => ({
  target_folder:
    raw?.target_folder?.trim() ?? DEFAULT_TABLE_SETTINGS.target_folder,
  file_format: isValidFileFormat(raw?.file_format)
    ? raw.file_format
    : DEFAULT_TABLE_SETTINGS.file_format,
  csv_delimiter: raw?.csv_delimiter || DEFAULT_TABLE_SETTINGS.csv_delimiter,
  csv_quote_char: raw?.csv_quote_char || DEFAULT_TABLE_SETTINGS.csv_quote_char,
  add_utc_timestamp:
    typeof raw?.add_utc_timestamp === "boolean"
      ? raw.add_utc_timestamp
      : DEFAULT_TABLE_SETTINGS.add_utc_timestamp,
  notification_email_group_ids: Array.isArray(raw?.notification_email_group_ids)
    ? raw.notification_email_group_ids
    : [],
});

const validateTargetFolder = (_value: string, _connector?: Connector) => "";

const SnowflakeFileExportSchema = ({
  connector,
  reverseSchemaData,
  isDisabled,
}: SnowflakeFileExportSchemaProps) => {
  const queryClient = useQueryClient();
  const { mutate: updateSelectedTables, isPending: isSavingSelection } =
    useUpdateSelectedTables({
      connectorId: connector.connection_id,
    });

  const { data: tableStatusData } = useFetchTableStatus(
    connector.connection_id,
    true,
  );

  const { data: emailGroups = [] } = useFetchEmailGroups();
  const isEmailSupportedDestination = ["sharepoint", "googledrive"].includes(
    connector.destination_name?.toLowerCase() || "",
  );

  const sourceTables = useMemo(
    () => reverseSchemaData?.source_tables || [],
    [reverseSchemaData?.source_tables],
  );

  const [selectedTables, setSelectedTables] = useState<string[]>([]);
  const [tableExportSettings, setTableExportSettings] = useState<
    Record<string, TableExportSetting>
  >({});
  const [isSelectionDirty, setIsSelectionDirty] = useState(false);
  const [sourceSearch, setSourceSearch] = useState("");
  const [mappingSearch, setMappingSearch] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [activeTableForSettings, setActiveTableForSettings] = useState<
    string | null
  >(null);
  const [targetFolderErrors, setTargetFolderErrors] = useState<
    Record<string, string>
  >({});
  const [lastSavedDefaults, setLastSavedDefaults] =
    useState<TableExportDefaults>(DEFAULT_TABLE_SETTINGS);
  const [lastInteractedTable, setLastInteractedTable] = useState<string | null>(
    null,
  );
  const [fieldModalOpen, setFieldModalOpen] = useState(false);
  const [activeTableForFields, setActiveTableForFields] = useState<
    string | null
  >(null);
  const [draggedTable, setDraggedTable] = useState<string | null>(null);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [activeTableForEmail, setActiveTableForEmail] = useState<string | null>(
    null,
  );

  const { mutate: updateSelectedFields, isPending: isUpdatingFields } =
    useUpdateSelectedFields({
      connectorId: connector.connection_id,
    });

  const { mutate: updateTableEmailGroups, isPending: isUpdatingEmails } =
    useUpdateTableEmailGroups({
      connectorId: connector.connection_id,
    });

  const { mutate: updateTableExportSettings, isPending: isUpdatingSettings } =
    useUpdateTableExportSettings({
      connectorId: connector.connection_id,
    });

  const activeTableSettings = useMemo(() => {
    if (!activeTableForSettings) return null;
    return (
      tableExportSettings[activeTableForSettings] ||
      normalizeTableSetting(activeTableForSettings)
    );
  }, [activeTableForSettings, tableExportSettings]);

  const activeTableFields = useMemo(() => {
    if (!activeTableForSettings) return {};
    const tableData = sourceTables.find(
      (t) => t.table === activeTableForSettings,
    );
    return tableData?.table_fields || {};
  }, [activeTableForSettings, sourceTables]);

  useEffect(() => {
    if (isSelectionDirty || isSavingSelection) return;

    const selectedFromSchema = sourceTables
      .filter((item) => item.selected)
      .map((item) => item.table);
    const nextSelected = Array.from(new Set([...selectedFromSchema]));

    setSelectedTables((current) => {
      if (JSON.stringify(current) === JSON.stringify(nextSelected)) {
        return current;
      }
      return nextSelected;
    });

    setTableExportSettings((current) => {
      const nextSettings: Record<string, TableExportSetting> = {};
      nextSelected.forEach((tableName) => {
        const schemaRow = sourceTables.find((item) => item.table === tableName);
        nextSettings[tableName] = normalizeTableSetting(tableName, schemaRow);
      });

      if (JSON.stringify(current) === JSON.stringify(nextSettings)) {
        return current;
      }
      return nextSettings;
    });

    const mostRecentSavedTable = [...nextSelected]
      .reverse()
      .find((tableName) => {
        const schemaRow = sourceTables.find((item) => item.table === tableName);
        return hasApiTableExportSettings(schemaRow);
      });
    if (mostRecentSavedTable) {
      const schemaRow = sourceTables.find(
        (item) => item.table === mostRecentSavedTable,
      );
      const nextDefaults = getReusableTableDefaults(
        normalizeTableSetting(mostRecentSavedTable, schemaRow),
      );
      setLastSavedDefaults((current) => {
        if (JSON.stringify(current) === JSON.stringify(nextDefaults)) {
          return current;
        }
        return nextDefaults;
      });
    }
    setIsSelectionDirty(false);
  }, [sourceTables, isSelectionDirty, isSavingSelection]);

  const filteredSourcePanelTables = useMemo(() => {
    const query = sourceSearch.trim().toLowerCase();
    const filtered = query
      ? sourceTables.filter((item) => item.table.toLowerCase().includes(query))
      : [...sourceTables];

    return filtered.sort((a, b) => a.table.localeCompare(b.table));
  }, [sourceSearch, sourceTables]);

  const selectedSourceTables = useMemo(() => {
    const selectedSet = new Set(selectedTables);
    return sourceTables.filter((item) => selectedSet.has(item.table));
  }, [sourceTables, selectedTables]);

  const filteredSelectedTables = useMemo(() => {
    const query = mappingSearch.trim().toLowerCase();
    if (!query) return selectedSourceTables;
    return selectedSourceTables.filter((item) =>
      item.table.toLowerCase().includes(query),
    );
  }, [mappingSearch, selectedSourceTables]);

  const {
    currentData: paginatedSourceTables,
    currentPage,
    totalPages,
    jumpToPage,
  } = usePagination({
    data: filteredSourcePanelTables,
    itemsPerPage: ITEMS_PER_PAGE,
  });

  useEffect(() => {
    jumpToPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceSearch]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleTableDrop = (targetTable: string) => {
    if (!draggedTable || draggedTable === targetTable) return;

    setSelectedTables((prev) => {
      const newList = [...prev];
      const draggedIndex = newList.indexOf(draggedTable);
      const targetIndex = newList.indexOf(targetTable);

      if (draggedIndex === -1 || targetIndex === -1) return prev;

      newList.splice(draggedIndex, 1);
      newList.splice(targetIndex, 0, draggedTable);

      // Auto-save the new order
      const truncateFlags = newList.reduce<Record<string, boolean>>(
        (acc, table) => {
          acc[table] = false;
          return acc;
        },
        {},
      );

      const tableExportPayload = newList.reduce<
        Record<string, TableExportSetting>
      >((acc, table) => {
        const row = tableExportSettings[table] || normalizeTableSetting(table);
        acc[table] = sanitizeTableExportSetting(
          row,
          isEmailSupportedDestination,
        );
        return acc;
      }, {});

      updateSelectedTables(
        {
          selected_tables: newList,
          truncate_flags: truncateFlags,
          table_export_settings: tableExportPayload,
        },
        {
          onSuccess: () => {
            toaster.success({ title: "Table order updated" });
            setIsSelectionDirty(false);
            queryClient.invalidateQueries({
              queryKey: ["ReverseSchema", connector.connection_id],
            });
          },
        },
      );

      return newList;
    });
    setDraggedTable(null);
  };

  const toggleTableSelection = (tableName: string) => {
    setSelectedTables((prev) => {
      if (prev.includes(tableName)) {
        setIsSelectionDirty(true);
        return prev.filter((name) => name !== tableName);
      }
      const schemaRow = sourceTables.find((item) => item.table === tableName);
      setTableExportSettings((current) => ({
        ...current,
        [tableName]:
          current[tableName] ||
          (hasApiTableExportSettings(schemaRow)
            ? normalizeTableSetting(tableName, schemaRow)
            : {
                output_file_name: tableName,
                ...lastSavedDefaults,
              }),
      }));
      setTargetFolderErrors((prev) => {
        const next = { ...prev };
        delete next[tableName];
        return next;
      });
      setLastInteractedTable(tableName);
      setIsSelectionDirty(true);
      return [...prev, tableName];
    });
  };

  const handleSaveSelection = () => {
    if (isDisabled) {
      toaster.warning({
        title: "Operation in progress",
        description: "Please wait for the current operation to complete.",
      });
      return;
    }

    const nextTargetFolderErrors = selectedTables.reduce<
      Record<string, string>
    >((acc, table) => {
      const settings =
        tableExportSettings[table] || normalizeTableSetting(table);
      const error = validateTargetFolder(settings.target_folder, connector);
      if (error) {
        acc[table] = error;
      }
      return acc;
    }, {});

    if (Object.keys(nextTargetFolderErrors).length > 0) {
      setTargetFolderErrors(nextTargetFolderErrors);
      toaster.error({
        title: "Target folder is required",
        description:
          "Enter a target folder for each selected table before saving.",
      });
      return;
    }

    const truncateFlags = selectedTables.reduce<Record<string, boolean>>(
      (acc, table) => {
        acc[table] = false;
        return acc;
      },
      {},
    );

    const tableExportPayload = selectedTables.reduce<
      Record<string, TableExportSetting>
    >((acc, table) => {
      const row = tableExportSettings[table] || normalizeTableSetting(table);
      acc[table] = sanitizeTableExportSetting(row, isEmailSupportedDestination);
      return acc;
    }, {});

    updateSelectedTables(
      {
        selected_tables: selectedTables,
        truncate_flags: truncateFlags,
        table_export_settings: tableExportPayload,
      },
      {
        onSuccess: () => {
          toaster.success({ title: "Selection saved" });
          setIsSelectionDirty(false);
          setTargetFolderErrors({});
          const templateSourceTable =
            (lastInteractedTable &&
              tableExportPayload[lastInteractedTable] &&
              lastInteractedTable) ||
            selectedTables[selectedTables.length - 1];
          if (templateSourceTable) {
            setLastSavedDefaults(
              getReusableTableDefaults(tableExportPayload[templateSourceTable]),
            );
          }
          queryClient.invalidateQueries({
            queryKey: ["ReverseSchema", connector.connection_id],
          });
        },
      },
    );
  };

  const handleSaveFields = (selectedFields: string[]) => {
    if (!activeTableForFields) return;
    updateSelectedFields(
      { tableName: activeTableForFields, selected_fields: selectedFields },
      {
        onSuccess: () => {
          toaster.success({ title: "Field selection updated" });
          setFieldModalOpen(false);
          queryClient.invalidateQueries({
            queryKey: ["ReverseSchema", connector.connection_id],
          });
        },
      },
    );
  };

  const handleSaveEmailGroups = (selectedGroupIds: number[]) => {
    if (!activeTableForEmail) return;
    updateTableEmailGroups(
      {
        tableName: activeTableForEmail,
        notification_email_group_ids: selectedGroupIds,
      },
      {
        onSuccess: () => {
          toaster.success({ title: "Email groups updated" });
          setTableExportSettings((prev) => ({
            ...prev,
            [activeTableForEmail]: {
              ...(prev[activeTableForEmail] ||
                normalizeTableSetting(activeTableForEmail)),
              notification_email_group_ids: selectedGroupIds,
            },
          }));
          setEmailModalOpen(false);
          queryClient.invalidateQueries({
            queryKey: ["ReverseSchema", connector.connection_id],
          });
        },
      },
    );
  };

  const activeTableData = useMemo(() => {
    if (!activeTableForFields) return null;
    return sourceTables.find((t) => t.table === activeTableForFields);
  }, [activeTableForFields, sourceTables]);

  return (
    <>
      <Grid templateColumns={["1fr", "1fr 1fr"]} gap={4} w="100%">
        <Flex
          direction="column"
          gap={2}
          borderWidth={1}
          borderColor="gray.300"
          borderRadius="lg"
          padding={4}
          bgColor="white"
        >
          <Flex mb={2} justifyContent="space-between" alignItems="center">
            <Text fontSize="sm" fontWeight="semibold">
              Source Tables
            </Text>
          </Flex>

          <Flex mb={2}>
            <InputGroup endElement={<MdSearch size={20} />}>
              <Input
                placeholder="Search table name"
                size="sm"
                value={sourceSearch}
                onChange={(e) => setSourceSearch(e.target.value)}
              />
            </InputGroup>
          </Flex>

          {!filteredSourcePanelTables.length && (
            <Flex direction="column" alignItems="center" py={8}>
              <Text>No Source Tables available</Text>
            </Flex>
          )}

          {filteredSourcePanelTables.length > 0 && (
            <>
              <Flex direction="column" gap={2}>
                {paginatedSourceTables.map((item, index) => {
                  const { table, table_fields } = item;
                  const isEven = index % 2 === 0;
                  const rowBg = isEven ? "gray.100" : "gray.50";
                  const isExpanded = !!expanded[table];
                  const isSelected = selectedTables.includes(table);

                  return (
                    <Flex
                      key={table}
                      justifyContent="space-between"
                      backgroundColor={rowBg}
                      alignItems="center"
                      direction={isExpanded ? "column" : "row"}
                      px={COLLAPSED_ROW_PX}
                      py={COLLAPSED_ROW_PY}
                      borderRadius={4}
                      minHeight={COLLAPSED_ROW_MIN_HEIGHT}
                    >
                      <Flex
                        alignItems="center"
                        justifyContent="space-between"
                        gap={2}
                        width="100%"
                      >
                        <Flex alignItems="center" gap={2} flex="1">
                          <Box
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpanded((prev) => ({
                                ...prev,
                                [table]: !prev[table],
                              }));
                            }}
                            cursor="pointer"
                            padding={1}
                            _hover={{
                              backgroundColor: "brand.200",
                              borderRadius: 4,
                            }}
                          >
                            {isExpanded ? <IoCaretDownSharp /> : <IoMdPlay />}
                          </Box>
                          <Text fontSize="sm" fontWeight="medium" flex="1">
                            {table}
                          </Text>
                        </Flex>
                        <Checkbox.Root
                          colorPalette="brand"
                          checked={isSelected}
                          onCheckedChange={() => toggleTableSelection(table)}
                        >
                          <Checkbox.HiddenInput />
                          <Checkbox.Control />
                        </Checkbox.Root>
                      </Flex>

                      {isExpanded && (
                        <Flex
                          direction="column"
                          gap={2}
                          paddingBlock={4}
                          width="100%"
                        >
                          {table_fields &&
                            Object.entries(table_fields)
                              .sort(([nameA, infoA], [nameB, infoB]) => {
                                const isPKA = isPrimaryKey(nameA, infoA);
                                const isPKB = isPrimaryKey(nameB, infoB);
                                if (isPKA && !isPKB) return -1;
                                if (!isPKA && isPKB) return 1;
                                return 0;
                              })
                              .map(([field, fieldInfo]) => {
                                const dataType =
                                  typeof fieldInfo === "string"
                                    ? fieldInfo
                                    : (fieldInfo as { data_type: string })
                                        .data_type;
                                const isPK = isPrimaryKey(field, fieldInfo);

                                return (
                                  <Flex
                                    key={field}
                                    direction="column"
                                    gap={1}
                                    width="100%"
                                  >
                                    <Flex alignItems="center" gap={2}>
                                      {isPK && (
                                        <Box color="yellow.500">
                                          <PiKeyFill />
                                        </Box>
                                      )}
                                      <Text fontSize="sm">
                                        {field}: {dataType}
                                      </Text>
                                    </Flex>
                                  </Flex>
                                );
                              })}
                        </Flex>
                      )}
                    </Flex>
                  );
                })}
              </Flex>

              {totalPages > 1 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={jumpToPage}
                />
              )}
            </>
          )}
        </Flex>

        <Flex
          direction="column"
          gap={2}
          borderWidth={1}
          borderColor="gray.300"
          borderRadius="lg"
          padding={4}
          bgColor="white"
        >
          <Flex mb={2} justifyContent="space-between" alignItems="center">
            <Text fontSize="sm" fontWeight="semibold">
              File Mappings
            </Text>
          </Flex>

          <Flex mb={2}>
            <InputGroup endElement={<MdSearch size={20} />}>
              <Input
                placeholder="Search selected table"
                size="sm"
                value={mappingSearch}
                onChange={(e) => setMappingSearch(e.target.value)}
              />
            </InputGroup>
          </Flex>

          {!filteredSelectedTables.length ? (
            <Flex justifyContent="center" py={8}>
              <Text fontSize="sm" color="gray.500">
                {selectedSourceTables.length === 0
                  ? "Select source tables first."
                  : "No matching selected source tables found"}
              </Text>
            </Flex>
          ) : (
            <VStack align="stretch" gap={2}>
              {filteredSelectedTables.map((item, index) => {
                const rowBg = index % 2 === 0 ? "gray.100" : "gray.50";
                const hasError = !!targetFolderErrors[item.table];

                return (
                  <Flex
                    key={item.table}
                    direction="column"
                    px={COLLAPSED_ROW_PX}
                    py={COLLAPSED_ROW_PY}
                    bgColor={rowBg}
                    borderRadius={4}
                    gap={1}
                    minHeight={COLLAPSED_ROW_MIN_HEIGHT}
                    draggable
                    onDragStart={() => setDraggedTable(item.table)}
                    onDragOver={handleDragOver}
                    onDrop={() => handleTableDrop(item.table)}
                    onDragEnd={() => setDraggedTable(null)}
                  >
                    <Flex
                      alignItems="center"
                      gap={3}
                      width="100%"
                      _hover={{ bg: "whiteAlpha.400" }}
                      transition="background 0.2s"
                      borderRadius="md"
                    >
                      <Flex
                        alignItems="center"
                        gap={2}
                        flex={1}
                        minW={0}
                        padding={1.5}
                      >
                        <Text
                          fontSize="sm"
                          fontWeight="semibold"
                          color="gray.800"
                          letterSpacing="tight"
                          truncate
                        >
                          {item.table}
                        </Text>
                      </Flex>
                      <Flex gap={1.5} alignItems="center" pr={1} flexShrink={0}>
                        {(() => {
                          const status = tableStatusData?.tables?.find(
                            (t) => t.table === item.table,
                          )?.status;
                          return (
                            <Box
                              w="22px"
                              h="22px"
                              minW="22px"
                              flexShrink={0}
                              display="flex"
                              alignItems="center"
                              justifyContent="center"
                            >
                              {status === "in_progress" && (
                                <Image
                                  src={SandtimeIcon}
                                  boxSize="16px"
                                  objectFit="contain"
                                />
                              )}
                              {status === "completed" && (
                                <Image
                                  src={CheckIcon}
                                  boxSize="16px"
                                  objectFit="contain"
                                />
                              )}
                              {status === "failed" && (
                                <Image
                                  src={ErrorIcon}
                                  boxSize="16px"
                                  objectFit="contain"
                                />
                              )}
                            </Box>
                          );
                        })()}

                        <Tooltip content="Select Export Fields">
                          <IconButton
                            size="xs"
                            variant="ghost"
                            colorPalette="brand"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveTableForFields(item.table);
                              setFieldModalOpen(true);
                            }}
                            borderRadius="full"
                            height="22px"
                            width="22px"
                            minWidth="22px"
                            flexShrink={0}
                            fontSize="14px"
                            boxShadow="none"
                            bg="transparent"
                            borderColor="transparent"
                            color="gray.500"
                            _hover={{
                              bg: "brand.50",
                              color: "brand.600",
                            }}
                            transition="all 0.2s"
                          >
                            <IoMdOptions />
                          </IconButton>
                        </Tooltip>

                        {isEmailSupportedDestination &&
                          (() => {
                            const isEmailConfigured = !!(
                              tableExportSettings?.[item.table]
                                ?.notification_email_group_ids &&
                              (tableExportSettings?.[item.table]
                                ?.notification_email_group_ids?.length ?? 0) > 0
                            );
                            return (
                              <Tooltip content="Select Email Notifications">
                                <IconButton
                                  size="xs"
                                  variant={
                                    isEmailConfigured ? "subtle" : "ghost"
                                  }
                                  colorPalette="brand"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveTableForEmail(item.table);
                                    setEmailModalOpen(true);
                                  }}
                                  borderRadius="full"
                                  height="22px"
                                  width="22px"
                                  minWidth="22px"
                                  flexShrink={0}
                                  fontSize="14px"
                                  boxShadow="none"
                                  bg={
                                    isEmailConfigured
                                      ? "brand.50"
                                      : "transparent"
                                  }
                                  color={
                                    isEmailConfigured ? "brand.600" : "gray.500"
                                  }
                                  borderColor="transparent"
                                  _hover={{
                                    bg: "brand.50",
                                    color: "brand.600",
                                  }}
                                  transition="all 0.2s"
                                >
                                  <IoMdMail />
                                </IconButton>
                              </Tooltip>
                            );
                          })()}

                        <Tooltip
                          content={
                            hasError
                              ? targetFolderErrors[item.table]
                              : "Export Settings"
                          }
                        >
                          <IconButton
                            size="xs"
                            variant="ghost"
                            colorPalette={hasError ? "red" : "brand"}
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveTableForSettings(item.table);
                              setSettingsModalOpen(true);
                            }}
                            borderRadius="full"
                            height="22px"
                            width="22px"
                            minWidth="22px"
                            flexShrink={0}
                            fontSize="14px"
                            boxShadow="none"
                            bg="transparent"
                            borderColor="transparent"
                            color={hasError ? "red.500" : "gray.500"}
                            _hover={{
                              bg: hasError ? "red.50" : "brand.50",
                              color: hasError ? "red.600" : "brand.600",
                            }}
                            transition="all 0.2s"
                          >
                            <IoMdSettings />
                          </IconButton>
                        </Tooltip>

                        {(() => {
                          const hasSelectedFields = !!(
                            item.selected_fields &&
                            item.selected_fields.length > 0
                          );
                          return (
                            <Box
                              w="29px"
                              h="22px"
                              minW="29px"
                              flexShrink={0}
                              display="flex"
                              alignItems="center"
                              justifyContent="center"
                            >
                              {hasSelectedFields && (
                                <Flex
                                  gap={1.5}
                                  w="100%"
                                  h="100%"
                                  alignItems="center"
                                  flexShrink={0}
                                >
                                  <Box
                                    w="1px"
                                    h="14px"
                                    bg="gray.300"
                                    flexShrink={0}
                                  />
                                  <Tooltip content="Reset to all fields">
                                    <IconButton
                                      size="xs"
                                      variant="ghost"
                                      colorPalette="red"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        updateSelectedFields(
                                          {
                                            tableName: item.table,
                                            selected_fields: [],
                                          },
                                          {
                                            onSuccess: () => {
                                              toaster.success({
                                                title:
                                                  "Reset fields successfully",
                                              });
                                              queryClient.invalidateQueries({
                                                queryKey: [
                                                  "ReverseSchema",
                                                  connector.connection_id,
                                                ],
                                              });
                                            },
                                          },
                                        );
                                      }}
                                      borderRadius="full"
                                      height="22px"
                                      width="22px"
                                      minWidth="22px"
                                      flexShrink={0}
                                      fontSize="14px"
                                      boxShadow="none"
                                      bg="transparent"
                                      borderColor="transparent"
                                      color="red.500"
                                      _hover={{
                                        bg: "red.50",
                                        color: "red.600",
                                      }}
                                      transition="all 0.2s"
                                    >
                                      <IoMdTrash />
                                    </IconButton>
                                  </Tooltip>
                                </Flex>
                              )}
                            </Box>
                          );
                        })()}
                      </Flex>
                    </Flex>
                  </Flex>
                );
              })}
            </VStack>
          )}

          <Flex justifyContent="flex-end" pt={2} mt="auto">
            <Button
              size="sm"
              colorPalette="brand"
              onClick={handleSaveSelection}
              loading={isSavingSelection}
              disabled={isDisabled || !isSelectionDirty}
            >
              Save
            </Button>
          </Flex>
        </Flex>
      </Grid>

      <FieldSelectionModal
        open={fieldModalOpen}
        onClose={() => setFieldModalOpen(false)}
        tableName={activeTableForFields || ""}
        tableFields={activeTableData?.table_fields || {}}
        initialSelectedFields={activeTableData?.selected_fields}
        onSave={handleSaveFields}
        isSaving={isUpdatingFields}
      />

      <EmailGroupSelectionModal
        open={emailModalOpen}
        onClose={() => setEmailModalOpen(false)}
        tableName={activeTableForEmail || ""}
        emailGroups={emailGroups}
        initialSelectedGroupIds={
          (activeTableForEmail &&
            tableExportSettings[activeTableForEmail]
              ?.notification_email_group_ids) ||
          []
        }
        onSave={handleSaveEmailGroups}
        isSaving={isUpdatingEmails}
      />

      {activeTableForSettings && activeTableSettings && (
        <TableExportSettingsModal
          open={settingsModalOpen}
          onClose={() => {
            setSettingsModalOpen(false);
            setActiveTableForSettings(null);
          }}
          tableName={activeTableForSettings}
          settings={activeTableSettings}
          tableFields={activeTableFields}
          isSaving={isUpdatingSettings}
          onSave={(localSettings) => {
            const normalizedSettings = sanitizeTableExportSetting(
              {
                ...localSettings,
                output_file_name:
                  localSettings.output_file_name.trim() ||
                  activeTableForSettings,
              },
              isEmailSupportedDestination,
            );

            updateTableExportSettings(
              {
                tableName: activeTableForSettings,
                settings: normalizedSettings,
              },
              {
                onSuccess: () => {
                  toaster.success({
                    title: "Settings saved successfully",
                  });
                  setTableExportSettings((prev) => ({
                    ...prev,
                    [activeTableForSettings]: normalizedSettings,
                  }));
                  setTargetFolderErrors((prev) => {
                    const next = { ...prev };
                    delete next[activeTableForSettings];
                    return next;
                  });
                  setSettingsModalOpen(false);
                  setActiveTableForSettings(null);
                },
              },
            );
          }}
        />
      )}
    </>
  );
};

export default SnowflakeFileExportSchema;
