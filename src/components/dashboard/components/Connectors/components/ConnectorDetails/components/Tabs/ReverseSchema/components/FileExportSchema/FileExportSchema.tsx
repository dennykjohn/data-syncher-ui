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
  Menu,
  Portal,
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
import {
  type ExportConfigResponse,
  useFetchExportConfig,
} from "@/queryOptions/destination/useFetchExportConfig";
import useFetchEmailGroups from "@/queryOptions/emailGroups/useFetchEmailGroups";
import {
  type Connector,
  type ConnectorTable,
  type ExcelConditionalFormat,
  type ExcelOptions,
} from "@/types/connectors";

import { isPrimaryKey } from "../../utils/validation";
import EmailGroupSelectionModal from "./EmailGroupSelectionModalNew";
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
  email_custom_fields?: {
    subject?: string;
    subject_styles?: {
      bold?: boolean;
      italic?: boolean;
      color?: string;
      font_family?: string;
      font_size?: string;
    } | null;
    body_fields?: string[];
    greeting_name?: string;
    greeting_styles?: {
      bold?: boolean;
      italic?: boolean;
      color?: string;
      font_family?: string;
      font_size?: string;
    } | null;
    body_content?: string;
    body_styles?: {
      bold?: boolean;
      italic?: boolean;
      color?: string;
      font_family?: string;
      font_size?: string;
    } | null;
    team_name?: string;
    team_styles?: {
      bold?: boolean;
      italic?: boolean;
      color?: string;
      font_family?: string;
      font_size?: string;
    } | null;
    styles?: {
      bold?: boolean;
      italic?: boolean;
      color?: string;
      font_family?: string;
      font_size?: string;
    } | null;
  };
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
  defaultHeaderName?: string,
): ExcelOptions | undefined => {
  if (!opts) return undefined;
  const nextOpts = { ...opts };
  if (nextOpts.sheet_header_enabled === false) {
    delete nextOpts.sheet_header;
    delete nextOpts.sheet_header_style;
    delete nextOpts.sheet_header_row_span;
    delete (nextOpts as Record<string, unknown>).sheet_header_title;
    delete (nextOpts as Record<string, unknown>).sheet_header_merge_rows;
  } else {
    nextOpts.sheet_header =
      nextOpts.sheet_header?.trim() || defaultHeaderName || "";
  }
  return nextOpts;
};

const normalizeTableSetting = (
  tableName: string,
  raw?: Partial<ConnectorTable>,
  exportConfig?: ExportConfigResponse,
): TableExportSetting => {
  const defaultFormat = exportConfig?.destination?.default_format || "csv";
  const defaultCsvDelimiter =
    exportConfig?.destination?.csv_defaults?.delimiter || ",";
  const defaultCsvQuoteChar =
    exportConfig?.destination?.csv_defaults?.quote_char || '"';

  return {
    output_file_name: raw?.output_file_name || tableName,
    target_folder: raw?.target_folder || "",
    file_format: isValidFileFormat(raw?.file_format)
      ? raw.file_format
      : isValidFileFormat(defaultFormat)
        ? defaultFormat
        : "csv",
    csv_delimiter: raw?.csv_delimiter || defaultCsvDelimiter,
    csv_quote_char: raw?.csv_quote_char || defaultCsvQuoteChar,
    add_utc_timestamp:
      typeof raw?.add_utc_timestamp === "boolean"
        ? raw.add_utc_timestamp
        : DEFAULT_TABLE_SETTINGS.add_utc_timestamp,
    notification_email_group_ids: Array.isArray(
      raw?.notification_email_group_ids,
    )
      ? raw.notification_email_group_ids
      : [],
    email_custom_fields: raw?.email_custom_fields
      ? {
          subject:
            raw.email_custom_fields.subject !== undefined &&
            raw.email_custom_fields.subject !== null
              ? raw.email_custom_fields.subject
              : "",
          subject_styles: raw.email_custom_fields.subject_styles
            ? {
                bold: !!raw.email_custom_fields.subject_styles.bold,
                italic: !!raw.email_custom_fields.subject_styles.italic,
                color:
                  raw.email_custom_fields.subject_styles.color || undefined,
                font_family:
                  raw.email_custom_fields.subject_styles.font_family ||
                  undefined,
                font_size:
                  raw.email_custom_fields.subject_styles.font_size || undefined,
              }
            : undefined,
          body_fields: Array.isArray(raw.email_custom_fields.body_fields)
            ? raw.email_custom_fields.body_fields
            : undefined,
          greeting_name:
            raw.email_custom_fields.greeting_name !== undefined &&
            raw.email_custom_fields.greeting_name !== null
              ? raw.email_custom_fields.greeting_name
              : "",
          greeting_styles: raw.email_custom_fields.greeting_styles
            ? {
                bold: !!raw.email_custom_fields.greeting_styles.bold,
                italic: !!raw.email_custom_fields.greeting_styles.italic,
                color:
                  raw.email_custom_fields.greeting_styles.color || undefined,
                font_family:
                  raw.email_custom_fields.greeting_styles.font_family ||
                  undefined,
                font_size:
                  raw.email_custom_fields.greeting_styles.font_size ||
                  undefined,
              }
            : undefined,
          body_content:
            raw.email_custom_fields.body_content !== undefined &&
            raw.email_custom_fields.body_content !== null
              ? raw.email_custom_fields.body_content
              : "",
          body_styles: raw.email_custom_fields.body_styles
            ? {
                bold: !!raw.email_custom_fields.body_styles.bold,
                italic: !!raw.email_custom_fields.body_styles.italic,
                color: raw.email_custom_fields.body_styles.color || undefined,
                font_family:
                  raw.email_custom_fields.body_styles.font_family || undefined,
                font_size:
                  raw.email_custom_fields.body_styles.font_size || undefined,
              }
            : undefined,
          team_name:
            raw.email_custom_fields.team_name !== undefined &&
            raw.email_custom_fields.team_name !== null
              ? raw.email_custom_fields.team_name
              : "",
          team_styles: raw.email_custom_fields.team_styles
            ? {
                bold: !!raw.email_custom_fields.team_styles.bold,
                italic: !!raw.email_custom_fields.team_styles.italic,
                color: raw.email_custom_fields.team_styles.color || undefined,
                font_family:
                  raw.email_custom_fields.team_styles.font_family || undefined,
                font_size:
                  raw.email_custom_fields.team_styles.font_size || undefined,
              }
            : undefined,
          styles: raw.email_custom_fields.styles
            ? {
                bold: !!raw.email_custom_fields.styles.bold,
                italic: !!raw.email_custom_fields.styles.italic,
                color:
                  raw.email_custom_fields.styles.color !== undefined &&
                  raw.email_custom_fields.styles.color !== null
                    ? raw.email_custom_fields.styles.color
                    : undefined,
                font_family:
                  raw.email_custom_fields.styles.font_family !== undefined &&
                  raw.email_custom_fields.styles.font_family !== null
                    ? raw.email_custom_fields.styles.font_family
                    : undefined,
                font_size:
                  raw.email_custom_fields.styles.font_size !== undefined &&
                  raw.email_custom_fields.styles.font_size !== null
                    ? raw.email_custom_fields.styles.font_size
                    : undefined,
              }
            : undefined,
        }
      : undefined,
    excel_sheet_name: raw?.excel_sheet_name || undefined,
    excel_options:
      sanitizeExcelOptions(safeParseJson<ExcelOptions>(raw?.excel_options)) ||
      undefined,
    excel_conditional_formats:
      safeParseJson<ExcelConditionalFormat[]>(
        raw?.excel_conditional_formats,
      )?.map(cleanRulePayload) || undefined,
  };
};

const sanitizeTableExportSetting = (
  setting: TableExportSetting,
  isEmailSupported: boolean,
  defaultSheetName?: string,
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
          email_custom_fields: setting.email_custom_fields || undefined,
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
      defaultSheetName || setting.output_file_name,
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
  exportConfig?: ExportConfigResponse,
): TableExportDefaults => {
  const defaultFormat = exportConfig?.destination?.default_format || "csv";
  const defaultCsvDelimiter =
    exportConfig?.destination?.csv_defaults?.delimiter || ",";
  const defaultCsvQuoteChar =
    exportConfig?.destination?.csv_defaults?.quote_char || '"';

  return {
    target_folder:
      raw?.target_folder?.trim() ?? DEFAULT_TABLE_SETTINGS.target_folder,
    file_format: isValidFileFormat(raw?.file_format)
      ? raw.file_format
      : isValidFileFormat(defaultFormat)
        ? defaultFormat
        : "csv",
    csv_delimiter: raw?.csv_delimiter || defaultCsvDelimiter,
    csv_quote_char: raw?.csv_quote_char || defaultCsvQuoteChar,
    add_utc_timestamp:
      typeof raw?.add_utc_timestamp === "boolean"
        ? raw.add_utc_timestamp
        : DEFAULT_TABLE_SETTINGS.add_utc_timestamp,
    notification_email_group_ids: [],
  };
};

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
  const { data: exportConfig } = useFetchExportConfig(
    connector.destination_name,
  );
  const isEmailSupportedDestination = exportConfig?.destination
    ? exportConfig.destination.supports_notification_groups
    : !!connector.supports_notification_groups;

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
  const [activeTableForCopy, setActiveTableForCopy] = useState<string | null>(
    null,
  );
  const [copyType, setCopyType] = useState<"email" | "export" | null>(null);
  const [selectedCopyTargets, setSelectedCopyTargets] = useState<string[]>([]);

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
      normalizeTableSetting(activeTableForSettings, undefined, exportConfig)
    );
  }, [activeTableForSettings, tableExportSettings, exportConfig]);

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
        nextSettings[tableName] = normalizeTableSetting(
          tableName,
          schemaRow,
          exportConfig,
        );
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
        normalizeTableSetting(mostRecentSavedTable, schemaRow, exportConfig),
        exportConfig,
      );
      setLastSavedDefaults((current) => {
        if (JSON.stringify(current) === JSON.stringify(nextDefaults)) {
          return current;
        }
        return nextDefaults;
      });
    }
    setIsSelectionDirty(false);
  }, [sourceTables, isSelectionDirty, isSavingSelection, exportConfig]);

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
          table,
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
            ? normalizeTableSetting(tableName, schemaRow, exportConfig)
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
        tableExportSettings[table] ||
        normalizeTableSetting(table, undefined, exportConfig);
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
      const row =
        tableExportSettings[table] ||
        normalizeTableSetting(table, undefined, exportConfig);
      acc[table] = sanitizeTableExportSetting(
        row,
        isEmailSupportedDestination,
        table,
      );
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
              getReusableTableDefaults(
                tableExportPayload[templateSourceTable],
                exportConfig,
              ),
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

  const handleSaveEmailGroups = (
    selectedGroupIds: number[],
    customFields?: {
      subject?: string;
      subject_styles?: {
        bold?: boolean;
        italic?: boolean;
        color?: string;
        font_family?: string;
      } | null;
      body_fields: string[];
      greeting_name?: string;
      greeting_styles?: {
        bold?: boolean;
        italic?: boolean;
        color?: string;
        font_family?: string;
      } | null;
      body_content?: string;
      body_styles?: {
        bold?: boolean;
        italic?: boolean;
        color?: string;
        font_family?: string;
      } | null;
      team_name?: string;
      team_styles?: {
        bold?: boolean;
        italic?: boolean;
        color?: string;
        font_family?: string;
      } | null;
      styles?: {
        bold?: boolean;
        italic?: boolean;
        color?: string;
        font_family?: string;
      } | null;
    },
  ) => {
    if (!activeTableForEmail) return;
    updateTableEmailGroups(
      {
        tableName: activeTableForEmail,
        notification_email_group_ids: selectedGroupIds,
        email_custom_fields: customFields,
      },
      {
        onSuccess: () => {
          toaster.success({ title: "Email groups updated" });
          setTableExportSettings((prev) => ({
            ...prev,
            [activeTableForEmail]: {
              ...(prev[activeTableForEmail] ||
                normalizeTableSetting(
                  activeTableForEmail,
                  undefined,
                  exportConfig,
                )),
              notification_email_group_ids: selectedGroupIds,
              email_custom_fields: customFields,
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

  const handleCopySettings = (targetTables: string[]) => {
    if (!activeTableForCopy) return;

    const sourceSettings =
      tableExportSettings[activeTableForCopy] ||
      normalizeTableSetting(activeTableForCopy, undefined, exportConfig);
    const updatedSettings = { ...tableExportSettings };

    if (copyType === "email") {
      const sourceEmailGroups =
        sourceSettings.notification_email_group_ids || [];
      const sourceEmailCustomFields =
        sourceSettings.email_custom_fields || undefined;
      targetTables.forEach((table) => {
        updatedSettings[table] = {
          ...(updatedSettings[table] ||
            normalizeTableSetting(table, undefined, exportConfig)),
          notification_email_group_ids: sourceEmailGroups,
          email_custom_fields: sourceEmailCustomFields,
        };
      });
    } else {
      targetTables.forEach((table) => {
        const currentTargetSettings =
          updatedSettings[table] ||
          normalizeTableSetting(table, undefined, exportConfig);

        const sourceExcelOpts = sourceSettings.excel_options;
        const targetExcelOpts = currentTargetSettings.excel_options;

        const mergedExcelOptions = sourceExcelOpts
          ? {
              ...sourceExcelOpts,
              sheet_name: targetExcelOpts?.sheet_name,
              sheet_header: targetExcelOpts?.sheet_header,
              hidden_columns: targetExcelOpts?.hidden_columns,
              column_styles: targetExcelOpts?.column_styles,
            }
          : undefined;

        updatedSettings[table] = {
          ...currentTargetSettings,
          target_folder: sourceSettings.target_folder,
          file_format: sourceSettings.file_format,
          csv_delimiter: sourceSettings.csv_delimiter,
          csv_quote_char: sourceSettings.csv_quote_char,
          add_utc_timestamp: sourceSettings.add_utc_timestamp,
          excel_sheet_name: currentTargetSettings.excel_sheet_name,
          excel_options: mergedExcelOptions,
          excel_conditional_formats:
            currentTargetSettings.excel_conditional_formats,
        };
      });
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
      const row = updatedSettings[table] || normalizeTableSetting(table);
      acc[table] = sanitizeTableExportSetting(
        row,
        isEmailSupportedDestination,
        table,
      );
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
          toaster.success({
            title: "Settings copied successfully",
            description: `Copied ${
              copyType === "email" ? "email notifications" : "export settings"
            } from ${activeTableForCopy} to ${targetTables.length} table(s).`,
          });
          setTableExportSettings(updatedSettings);
          setActiveTableForCopy(null);
          setCopyType(null);
          setSelectedCopyTargets([]);
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
                disabled={!!activeTableForCopy}
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
                              if (activeTableForCopy) return;
                              e.stopPropagation();
                              setExpanded((prev) => ({
                                ...prev,
                                [table]: !prev[table],
                              }));
                            }}
                            cursor={
                              activeTableForCopy ? "not-allowed" : "pointer"
                            }
                            padding={1}
                            _hover={
                              activeTableForCopy
                                ? undefined
                                : {
                                    backgroundColor: "brand.200",
                                    borderRadius: 4,
                                  }
                            }
                            opacity={activeTableForCopy ? 0.5 : 1}
                          >
                            {isExpanded ? <IoCaretDownSharp /> : <IoMdPlay />}
                          </Box>
                          <Checkbox.Root
                            colorPalette="brand"
                            checked={isSelected}
                            onCheckedChange={() => toggleTableSelection(table)}
                            disabled={!!activeTableForCopy}
                          >
                            <Checkbox.HiddenInput />
                            <Checkbox.Control />
                          </Checkbox.Root>
                          <Text
                            fontSize="sm"
                            fontWeight="medium"
                            flex="1"
                            truncate
                          >
                            {table}
                          </Text>
                        </Flex>
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
                <Box
                  opacity={activeTableForCopy ? 0.5 : 1}
                  pointerEvents={activeTableForCopy ? "none" : "auto"}
                >
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={jumpToPage}
                  />
                </Box>
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
                    draggable={!activeTableForCopy}
                    onDragStart={
                      activeTableForCopy
                        ? undefined
                        : () => setDraggedTable(item.table)
                    }
                    onDragOver={activeTableForCopy ? undefined : handleDragOver}
                    onDrop={
                      activeTableForCopy
                        ? undefined
                        : () => handleTableDrop(item.table)
                    }
                    onDragEnd={
                      activeTableForCopy
                        ? undefined
                        : () => setDraggedTable(null)
                    }
                  >
                    <Flex
                      alignItems="center"
                      gap={3}
                      width="100%"
                      _hover={{ bg: "whiteAlpha.400" }}
                      transition="background 0.2s"
                      borderRadius="md"
                    >
                      <Box
                        w="24px"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        flexShrink={0}
                        pl={1}
                      >
                        {activeTableForCopy ? (
                          item.table === activeTableForCopy ? (
                            <Box
                              w="8px"
                              h="8px"
                              borderRadius="full"
                              bg="brand.600"
                            />
                          ) : (
                            <Checkbox.Root
                              colorPalette="brand"
                              checked={selectedCopyTargets.includes(item.table)}
                              onCheckedChange={(details) => {
                                setSelectedCopyTargets((prev) =>
                                  details.checked === true
                                    ? [...prev, item.table]
                                    : prev.filter((t) => t !== item.table),
                                );
                              }}
                            >
                              <Checkbox.HiddenInput />
                              <Checkbox.Control />
                            </Checkbox.Root>
                          )
                        ) : null}
                      </Box>
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

                        {(() => {
                          const hasSelectedFields = !!(
                            item.selected_fields &&
                            item.selected_fields.length > 0
                          );
                          return (
                            <Tooltip content="Select Export Fields">
                              <IconButton
                                size="xs"
                                variant={hasSelectedFields ? "subtle" : "ghost"}
                                colorPalette="brand"
                                disabled={!!activeTableForCopy}
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
                                bg={
                                  hasSelectedFields ? "brand.50" : "transparent"
                                }
                                color={
                                  hasSelectedFields ? "brand.600" : "gray.500"
                                }
                                borderColor="transparent"
                                _hover={{
                                  bg: "brand.50",
                                  color: "brand.600",
                                }}
                                transition="all 0.2s"
                              >
                                <IoMdOptions />
                              </IconButton>
                            </Tooltip>
                          );
                        })()}

                        {isEmailSupportedDestination &&
                          (() => {
                            const isEmailConfigured = !!(
                              tableExportSettings?.[item.table]
                                ?.notification_email_group_ids &&
                              (tableExportSettings?.[item.table]
                                ?.notification_email_group_ids?.length ?? 0) > 0
                            );
                            return (
                              <Tooltip content="Email Notifications">
                                <Menu.Root
                                  positioning={{ placement: "bottom-end" }}
                                >
                                  <Menu.Trigger asChild>
                                    <IconButton
                                      size="xs"
                                      variant={
                                        isEmailConfigured ? "subtle" : "ghost"
                                      }
                                      colorPalette="brand"
                                      disabled={!!activeTableForCopy}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                      }}
                                      borderRadius="md"
                                      height="22px"
                                      px={1.5}
                                      minWidth="34px"
                                      flexShrink={0}
                                      boxShadow="none"
                                      bg={
                                        isEmailConfigured
                                          ? "brand.50"
                                          : "transparent"
                                      }
                                      color={
                                        isEmailConfigured
                                          ? "brand.600"
                                          : "gray.500"
                                      }
                                      borderColor="transparent"
                                      _hover={{
                                        bg: "brand.50",
                                        color: "brand.600",
                                      }}
                                      transition="all 0.2s"
                                    >
                                      <Flex alignItems="center" gap={0.5}>
                                        <IoMdMail />
                                        <IoCaretDownSharp
                                          style={{ fontSize: "8px" }}
                                        />
                                      </Flex>
                                    </IconButton>
                                  </Menu.Trigger>
                                  <Portal>
                                    <Menu.Positioner>
                                      <Menu.Content>
                                        <Menu.Item
                                          value="edit-email"
                                          cursor="pointer"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setActiveTableForEmail(item.table);
                                            setEmailModalOpen(true);
                                          }}
                                        >
                                          Edit
                                        </Menu.Item>
                                        <Menu.Item
                                          value="copy-email"
                                          cursor="pointer"
                                          disabled={
                                            selectedTables.length <= 1 ||
                                            !item.selected ||
                                            !isEmailConfigured
                                          }
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setActiveTableForCopy(item.table);
                                            setCopyType("email");
                                            setSelectedCopyTargets([]);
                                          }}
                                        >
                                          Copy
                                        </Menu.Item>
                                      </Menu.Content>
                                    </Menu.Positioner>
                                  </Portal>
                                </Menu.Root>
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
                          <Menu.Root positioning={{ placement: "bottom-end" }}>
                            <Menu.Trigger asChild>
                              <IconButton
                                size="xs"
                                variant="ghost"
                                colorPalette={hasError ? "red" : "brand"}
                                disabled={!!activeTableForCopy}
                                onClick={(e) => {
                                  e.stopPropagation();
                                }}
                                borderRadius="md"
                                height="22px"
                                px={1.5}
                                minWidth="34px"
                                flexShrink={0}
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
                                <Flex alignItems="center" gap={0.5}>
                                  <IoMdSettings />
                                  <IoCaretDownSharp
                                    style={{ fontSize: "8px" }}
                                  />
                                </Flex>
                              </IconButton>
                            </Menu.Trigger>
                            <Portal>
                              <Menu.Positioner>
                                <Menu.Content>
                                  <Menu.Item
                                    value="edit-settings"
                                    cursor="pointer"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveTableForSettings(item.table);
                                      setSettingsModalOpen(true);
                                    }}
                                  >
                                    Edit
                                  </Menu.Item>
                                  <Menu.Item
                                    value="copy-settings"
                                    cursor="pointer"
                                    disabled={
                                      selectedTables.length <= 1 ||
                                      !item.selected
                                    }
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveTableForCopy(item.table);
                                      setCopyType("export");
                                      setSelectedCopyTargets([]);
                                    }}
                                  >
                                    Copy
                                  </Menu.Item>
                                </Menu.Content>
                              </Menu.Positioner>
                            </Portal>
                          </Menu.Root>
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
                                      disabled={!!activeTableForCopy}
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

          <Flex
            justifyContent="space-between"
            alignItems="center"
            pt={2}
            mt="auto"
          >
            {activeTableForCopy ? (
              <Flex gap={3} alignItems="center" w="100%">
                <Checkbox.Root
                  colorPalette="brand"
                  checked={
                    selectedCopyTargets.length > 0 &&
                    selectedCopyTargets.length ===
                      filteredSelectedTables.filter(
                        (t) => t.table !== activeTableForCopy,
                      ).length
                      ? true
                      : selectedCopyTargets.length > 0 &&
                          selectedCopyTargets.length <
                            filteredSelectedTables.filter(
                              (t) => t.table !== activeTableForCopy,
                            ).length
                        ? "indeterminate"
                        : false
                  }
                  onCheckedChange={(details) => {
                    if (details.checked === true) {
                      setSelectedCopyTargets(
                        filteredSelectedTables
                          .map((t) => t.table)
                          .filter((t) => t !== activeTableForCopy),
                      );
                    } else {
                      setSelectedCopyTargets([]);
                    }
                  }}
                >
                  <Checkbox.HiddenInput />
                  <Checkbox.Control />
                  <Text fontSize="xs" color="gray.600" fontWeight="semibold">
                    Select All
                  </Text>
                </Checkbox.Root>
                <Flex gap={2} alignItems="center" ml="auto">
                  <Button
                    size="xs"
                    variant="ghost"
                    onClick={() => {
                      setActiveTableForCopy(null);
                      setCopyType(null);
                      setSelectedCopyTargets([]);
                    }}
                    disabled={isSavingSelection}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="xs"
                    colorPalette="brand"
                    onClick={() => {
                      handleCopySettings(selectedCopyTargets);
                    }}
                    loading={isSavingSelection}
                    disabled={selectedCopyTargets.length === 0}
                  >
                    Paste
                  </Button>
                </Flex>
              </Flex>
            ) : (
              <Button
                size="sm"
                colorPalette="brand"
                onClick={handleSaveSelection}
                loading={isSavingSelection}
                disabled={isDisabled || !isSelectionDirty}
                ml="auto"
              >
                Save
              </Button>
            )}
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
        initialEmailCustomFields={
          activeTableForEmail
            ? tableExportSettings[activeTableForEmail]?.email_custom_fields
            : undefined
        }
        destinationName={connector.destination_name || ""}
        pathLabel={exportConfig?.destination?.path_label}
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
          supportedFormats={exportConfig?.destination?.supported_formats}
          onSave={(localSettings) => {
            const normalizedSettings = sanitizeTableExportSetting(
              {
                ...localSettings,
                output_file_name:
                  localSettings.output_file_name.trim() ||
                  activeTableForSettings,
              },
              isEmailSupportedDestination,
              activeTableForSettings,
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
