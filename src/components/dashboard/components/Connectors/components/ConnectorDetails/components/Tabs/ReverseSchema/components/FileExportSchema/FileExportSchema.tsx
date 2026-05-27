import { useEffect, useMemo, useState } from "react";

import {
  Box,
  Button,
  Checkbox,
  Field,
  Flex,
  Grid,
  IconButton,
  Image,
  Input,
  InputGroup,
  NativeSelect,
  Text,
  VStack,
} from "@chakra-ui/react";

import { IoMdMail, IoMdOptions, IoMdPlay, IoMdTrash } from "react-icons/io";
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
import { type Connector, type ConnectorTable } from "@/types/connectors";

import { isPrimaryKey } from "../../utils/validation";
import EmailGroupSelectionModal from "./EmailGroupSelectionModal";
import FieldSelectionModal from "./FieldSelectionModal";
import useUpdateSelectedFields from "./hooks/useUpdateSelectedFields";
import useUpdateTableEmailGroups from "./hooks/useUpdateTableEmailGroups";
import { useQueryClient } from "@tanstack/react-query";

type FileFormat = "csv" | "json" | "parquet";

type TableExportSetting = {
  output_file_name: string;
  target_folder: string;
  file_format: FileFormat;
  csv_delimiter: string;
  csv_quote_char: string;
  add_utc_timestamp: boolean;
  notification_email_group_ids?: number[];
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
  value === "csv" || value === "json" || value === "parquet";

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
});

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

const isDestinationGoogleDrive = (conn?: Connector) =>
  conn?.destination_name?.toLowerCase().replace(/[\s\-._]/g, "") ===
  "googledrive";

const isTargetFolderRequired = (conn?: Connector) =>
  // Target folder is not mandatory for Google Drive destinations
  !isDestinationGoogleDrive(conn);

const validateTargetFolder = (value: string, conn?: Connector) =>
  isTargetFolderRequired(conn)
    ? value.trim()
      ? ""
      : "Target folder is required."
    : "";

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
  const [expandedMappings, setExpandedMappings] = useState<
    Record<string, boolean>
  >({});
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

  useEffect(() => {
    if (isSelectionDirty || isSavingSelection) return;

    const selectedFromSchema = sourceTables
      .filter((item) => item.selected)
      .map((item) => item.table);
    const nextSelected = Array.from(new Set([...selectedFromSchema]));

    setSelectedTables(nextSelected);
    setTableExportSettings(() => {
      const nextSettings: Record<string, TableExportSetting> = {};
      nextSelected.forEach((tableName) => {
        const schemaRow = sourceTables.find((item) => item.table === tableName);
        nextSettings[tableName] = normalizeTableSetting(tableName, schemaRow);
      });
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
      setLastSavedDefaults(
        getReusableTableDefaults(
          normalizeTableSetting(mostRecentSavedTable, schemaRow),
        ),
      );
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
        acc[table] = {
          ...row,
          ...(row.file_format === "csv"
            ? {
                csv_delimiter: row.csv_delimiter || ",",
                csv_quote_char: row.csv_quote_char || '"',
              }
            : {}),
          ...(!isEmailSupportedDestination
            ? { notification_email_group_ids: undefined }
            : {}),
        };
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
      setExpandedMappings((prev) => ({
        ...prev,
        [tableName]: true,
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

  const updateTableSetting = (
    tableName: string,
    patch: Partial<TableExportSetting>,
  ) => {
    setLastInteractedTable(tableName);
    setTableExportSettings((prev) => ({
      ...prev,
      [tableName]: {
        ...(prev[tableName] || normalizeTableSetting(tableName)),
        ...patch,
      },
    }));
    if (Object.prototype.hasOwnProperty.call(patch, "target_folder")) {
      setTargetFolderErrors((prev) => {
        const next = { ...prev };
        const nextError = validateTargetFolder(
          patch.target_folder ?? "",
          connector,
        );
        if (nextError) {
          next[tableName] = nextError;
        } else {
          delete next[tableName];
        }
        return next;
      });
    }
    setIsSelectionDirty(true);
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
      setExpandedMappings((prev) => {
        const next = { ...prev };
        Object.keys(nextTargetFolderErrors).forEach((table) => {
          next[table] = true;
        });
        return next;
      });
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
      Record<
        string,
        {
          output_file_name: string;
          target_folder: string;
          file_format: FileFormat;
          add_utc_timestamp: boolean;
          csv_delimiter?: string;
          csv_quote_char?: string;
          notification_email_group_ids?: number[];
        }
      >
    >((acc, table) => {
      const row = tableExportSettings[table] || normalizeTableSetting(table);
      acc[table] = {
        output_file_name: row.output_file_name.trim() || table,
        target_folder: row.target_folder.trim(),
        file_format: row.file_format,
        add_utc_timestamp: row.add_utc_timestamp,
        ...(row.file_format === "csv"
          ? {
              csv_delimiter: row.csv_delimiter || ",",
              csv_quote_char: row.csv_quote_char || '"',
            }
          : {}),
        ...(isEmailSupportedDestination
          ? {
              notification_email_group_ids:
                row.notification_email_group_ids || [],
            }
          : {}),
      };
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
                const settings =
                  tableExportSettings[item.table] ||
                  normalizeTableSetting(item.table);
                const rowBg = index % 2 === 0 ? "gray.100" : "gray.50";
                const isExpanded = !!expandedMappings[item.table];

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
                        onClick={() =>
                          setExpandedMappings((prev) => ({
                            ...prev,
                            [item.table]: !prev[item.table],
                          }))
                        }
                        cursor="pointer"
                      >
                        <Box
                          padding={1.5}
                          color="gray.500"
                          _hover={{
                            color: "brand.500",
                            bg: "brand.50",
                            borderRadius: "full",
                          }}
                        >
                          {isExpanded ? <IoCaretDownSharp /> : <IoMdPlay />}
                        </Box>
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
                      <Flex gap={2} alignItems="center" pr={1}>
                        {(() => {
                          const status = tableStatusData?.tables?.find(
                            (t) => t.table === item.table,
                          )?.status;
                          if (!status) return null;
                          return (
                            <Box>
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
                            height="24px"
                            width="24px"
                            minWidth="24px"
                            fontSize="16px"
                            boxShadow="none"
                            bg="transparent"
                            borderColor="transparent"
                            _hover={{
                              transform: "translateY(-1px)",
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
                              tableExportSettings[item.table]
                                ?.notification_email_group_ids &&
                              (tableExportSettings[item.table]
                                ?.notification_email_group_ids?.length || 0) > 0
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
                                  height="24px"
                                  width="24px"
                                  minWidth="24px"
                                  fontSize="16px"
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
                                    transform: "translateY(-1px)",
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

                        <Box
                          width="24px"
                          display="flex"
                          justifyContent="center"
                        >
                          {item.selected_fields &&
                            item.selected_fields.length > 0 && (
                              <Tooltip content="Reset to all fields">
                                <IconButton
                                  size="xs"
                                  variant="ghost"
                                  colorPalette="red"
                                  onClick={(e: React.MouseEvent) => {
                                    e.stopPropagation();
                                    updateSelectedFields({
                                      tableName: item.table,
                                      selected_fields: [],
                                    });
                                  }}
                                  aria-label="Clear selection"
                                  borderRadius="full"
                                  height="24px"
                                  width="24px"
                                  _hover={{ bg: "red.50" }}
                                >
                                  <IoMdTrash />
                                </IconButton>
                              </Tooltip>
                            )}
                        </Box>
                      </Flex>
                    </Flex>

                    {isExpanded && (
                      <Flex
                        width="100%"
                        direction="column"
                        gap={1}
                        pt={1}
                        px={1}
                      >
                        <Box>
                          <Field.Root gap={0}>
                            <Field.Label fontSize="xs" color="gray.600" mb={0}>
                              Target File Name
                            </Field.Label>
                            <Input
                              size="sm"
                              value={settings.output_file_name}
                              onChange={(e) =>
                                updateTableSetting(item.table, {
                                  output_file_name: e.target.value,
                                })
                              }
                              placeholder="Target file name"
                            />
                          </Field.Root>
                          <Checkbox.Root
                            mt={2}
                            colorPalette="brand"
                            checked={settings.add_utc_timestamp}
                            onCheckedChange={(details) =>
                              updateTableSetting(item.table, {
                                add_utc_timestamp: !!details.checked,
                              })
                            }
                          >
                            <Checkbox.HiddenInput />
                            <Checkbox.Label fontSize="sm">
                              Include timestamp in file name
                            </Checkbox.Label>
                            <Checkbox.Control />
                          </Checkbox.Root>
                        </Box>

                        <Box>
                          <Field.Root
                            gap={0}
                            required={isTargetFolderRequired(connector)}
                            invalid={!!targetFolderErrors[item.table]}
                          >
                            <Field.Label fontSize="xs" color="gray.600" mb={0}>
                              Target Folder
                            </Field.Label>
                            <Input
                              size="sm"
                              value={settings.target_folder}
                              onChange={(e) =>
                                updateTableSetting(item.table, {
                                  target_folder: e.target.value,
                                })
                              }
                              placeholder="Target folder"
                            />
                            {targetFolderErrors[item.table] && (
                              <Field.ErrorText>
                                {targetFolderErrors[item.table]}
                              </Field.ErrorText>
                            )}
                          </Field.Root>
                        </Box>

                        <Box>
                          <Text fontSize="xs" color="gray.600" mb={0}>
                            File Type
                          </Text>
                          <NativeSelect.Root size="sm">
                            <NativeSelect.Field
                              value={settings.file_format}
                              onChange={(e) =>
                                updateTableSetting(item.table, {
                                  file_format: e.target.value as FileFormat,
                                })
                              }
                            >
                              <option value="csv">CSV</option>
                              <option value="json">JSON</option>
                              <option value="parquet">Parquet</option>
                            </NativeSelect.Field>
                            <NativeSelect.Indicator />
                          </NativeSelect.Root>
                        </Box>

                        {settings.file_format === "csv" && (
                          <Flex gap={2}>
                            <Box flex={1}>
                              <Text fontSize="xs" color="gray.600" mb={0}>
                                CSV Delimiter
                              </Text>
                              <Input
                                size="sm"
                                value={settings.csv_delimiter}
                                onChange={(e) =>
                                  updateTableSetting(item.table, {
                                    csv_delimiter: e.target.value,
                                  })
                                }
                                placeholder=","
                              />
                            </Box>
                            <Box flex={1}>
                              <Text fontSize="xs" color="gray.600" mb={0}>
                                CSV Quote Char
                              </Text>
                              <Input
                                size="sm"
                                value={settings.csv_quote_char}
                                onChange={(e) =>
                                  updateTableSetting(item.table, {
                                    csv_quote_char: e.target.value,
                                  })
                                }
                                placeholder={'"'}
                              />
                            </Box>
                          </Flex>
                        )}
                      </Flex>
                    )}
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
    </>
  );
};

export default SnowflakeFileExportSchema;
