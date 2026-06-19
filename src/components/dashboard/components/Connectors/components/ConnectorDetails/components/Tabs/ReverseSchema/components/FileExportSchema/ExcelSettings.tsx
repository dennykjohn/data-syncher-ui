import { useEffect, useRef, useState } from "react";

import {
  Box,
  Button,
  Checkbox,
  Field,
  Flex,
  Grid,
  HStack,
  IconButton,
  Input,
  NativeSelect,
  Text,
  VStack,
} from "@chakra-ui/react";

import { IoMdAdd, IoMdTrash } from "react-icons/io";

import {
  type ExcelBodyStyle,
  type ExcelConditionalFormat,
  type ExcelDifferentialStyle,
  type ExcelHeaderStyle,
  type ExcelOptions,
} from "@/types/connectors";

import ExcelColorPicker from "./ExcelColorPicker";

interface ExcelSettingsProps {
  excelOptions: ExcelOptions | undefined;
  excelSheetName: string | undefined;
  conditionalFormats: ExcelConditionalFormat[] | undefined;
  tableFields: Record<string, string>;
  tableName: string;
  onChange: (_patch: {
    excel_sheet_name?: string;
    excel_options?: ExcelOptions;
    excel_conditional_formats?: ExcelConditionalFormat[];
  }) => void;
}

export const DEFAULT_HEADER_STYLE: ExcelHeaderStyle = {
  fill: "FFFFFF",
  font_color: "000000",
  bold: false,
  italic: false,
  font_name: "Calibri",
  font_size: 11,
  horizontal: "center",
  vertical: "center",
  wrap_text: true,
};

export const DEFAULT_SHEET_HEADER_STYLE: ExcelHeaderStyle = {
  fill: "2F5597",
  font_color: "FFFFFF",
  bold: true,
  italic: false,
  font_name: "Calibri",
  font_size: 16,
  horizontal: "center",
  vertical: "center",
};

export const DEFAULT_EXCEL_OPTIONS: ExcelOptions = {
  sheet_name: "Sheet1",
  auto_filter: true,
  freeze_header: true,
  auto_width: true,
  date_format: "yyyy-mm-dd",
  datetime_format: "yyyy-mm-dd hh:mm:ss",
  time_format: "hh:mm:ss",
  header_style: DEFAULT_HEADER_STYLE,
  sheet_header_style: DEFAULT_SHEET_HEADER_STYLE,
  sheet_header_enabled: false,
  hidden_columns: [],
};

const getCssColor = (hex: string | undefined, defaultColor: string): string => {
  if (!hex) return defaultColor;
  const clean = hex.trim();
  if (clean.startsWith("#")) return clean;
  if (/^[0-9A-Fa-f]{3,6}$/.test(clean)) return `#${clean}`;
  return clean;
};

const getCssAlignItems = (valign: string | undefined): string => {
  if (!valign) return "center";
  const v = valign.toLowerCase();
  if (v === "top") return "flex-start";
  if (v === "bottom") return "flex-end";
  return "center";
};

export const normalizeRuleType = (type: string | undefined): string => {
  if (!type) return "";
  return type.toLowerCase().replace(/[^a-z0-9]/g, "");
};

export type ColumnDataType = "numeric" | "datetime" | "boolean" | "text";

export const getColumnDataType = (
  typeStr: string | undefined,
): ColumnDataType => {
  if (!typeStr) return "text";
  const lower = typeStr.toLowerCase();
  if (
    lower.includes("number") ||
    lower.includes("int") ||
    lower.includes("float") ||
    lower.includes("double") ||
    lower.includes("decimal") ||
    lower.includes("numeric") ||
    lower.includes("real")
  ) {
    return "numeric";
  }
  if (
    lower.includes("date") ||
    lower.includes("time") ||
    lower.includes("timestamp")
  ) {
    return "datetime";
  }
  if (lower.includes("bool")) {
    return "boolean";
  }
  return "text";
};

export const isRuleTypeAllowed = (
  ruleType: string,
  colDataType: ColumnDataType,
): boolean => {
  const norm = ruleType.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (colDataType === "boolean") {
    return ["cellis", "formula"].includes(norm);
  }
  if (colDataType === "text") {
    return [
      "cellis",
      "containstext",
      "notcontainstext",
      "beginswith",
      "endswith",
      "duplicaterecords",
      "uniquerecords",
      "formula",
    ].includes(norm);
  }
  if (colDataType === "datetime") {
    return ["cellis", "formula", "duplicaterecords", "uniquerecords"].includes(
      norm,
    );
  }
  return ![
    "containstext",
    "notcontainstext",
    "beginswith",
    "endswith",
  ].includes(norm);
};

export const isOperatorAllowed = (
  operator: string,
  colDataType: ColumnDataType,
): boolean => {
  if (colDataType === "boolean" || colDataType === "text") {
    return ["equal", "notEqual"].includes(operator);
  }
  return true;
};

export const getValidationError = (
  value: string | string[] | undefined,
  colDataType: ColumnDataType,
): string | null => {
  if (value === undefined || value === null) return null;
  const valStr = Array.isArray(value) ? value[0] : value;
  if (!valStr || valStr.trim() === "") return null;
  if (valStr.trim().startsWith("=")) return null;

  if (colDataType === "numeric") {
    const num = Number(valStr);
    if (isNaN(num)) {
      return "Value must be a number or a formula starting with '='";
    }
  }

  if (colDataType === "datetime") {
    const timestamp = Date.parse(valStr);
    const isIsoDate = /^\d{4}-\d{2}-\d{2}$/.test(valStr.trim());
    if (isNaN(timestamp) && !isIsoDate) {
      return "Value must be a valid date or a formula starting with '='";
    }
  }

  return null;
};

const getIconSetPreview = (style: string) => {
  const normStyle = (style || "3TrafficLights1").toLowerCase();
  switch (normStyle) {
    case "3trafficlights1":
      return (
        <HStack gap={1} mt={1.5}>
          <Box w="10px" h="10px" borderRadius="full" bg="red.500" title="Low" />
          <Box
            w="10px"
            h="10px"
            borderRadius="full"
            bg="yellow.500"
            title="Medium"
          />
          <Box
            w="10px"
            h="10px"
            borderRadius="full"
            bg="green.500"
            title="High"
          />
          <Text fontSize="10px" color="gray.500" ml={1}>
            (Red / Yellow / Green Lights)
          </Text>
        </HStack>
      );
    case "3arrows":
      return (
        <HStack gap={1} mt={1.5} fontSize="10px" fontWeight="bold">
          <Text color="red.500">⬇</Text>
          <Text color="yellow.500">➡</Text>
          <Text color="green.500">⬆</Text>
          <Text color="gray.500" ml={1} fontWeight="normal">
            (Red Down / Yellow Right / Green Up)
          </Text>
        </HStack>
      );
    case "3flags":
      return (
        <HStack gap={1} mt={1.5} fontSize="10px">
          <Text color="red.500">🚩</Text>
          <Text color="yellow.500">🚩</Text>
          <Text color="green.500">🚩</Text>
          <Text color="gray.500" ml={1}>
            (Red / Yellow / Green Flags)
          </Text>
        </HStack>
      );
    case "3symbols":
      return (
        <HStack gap={1} mt={1.5} fontSize="10px" fontWeight="bold">
          <Text color="red.500">✖</Text>
          <Text color="yellow.500">⚠</Text>
          <Text color="green.500">✔</Text>
          <Text color="gray.500" ml={1} fontWeight="normal">
            (Red Cross / Yellow Warning / Green Check)
          </Text>
        </HStack>
      );
    case "4arrows":
      return (
        <HStack gap={1} mt={1.5} fontSize="10px" fontWeight="bold">
          <Text color="red.500">⬇</Text>
          <Text color="yellow.500">↘</Text>
          <Text color="yellow.500">↗</Text>
          <Text color="green.500">⬆</Text>
          <Text color="gray.500" ml={1} fontWeight="normal">
            (4-Directional colored arrows)
          </Text>
        </HStack>
      );
    case "5arrows":
      return (
        <HStack gap={1} mt={1.5} fontSize="10px" fontWeight="bold">
          <Text color="red.500">⬇</Text>
          <Text color="yellow.500">↘</Text>
          <Text color="yellow.500">➡</Text>
          <Text color="yellow.500">↗</Text>
          <Text color="green.500">⬆</Text>
          <Text color="gray.500" ml={1} fontWeight="normal">
            (5-Directional colored arrows)
          </Text>
        </HStack>
      );
    default:
      return null;
  }
};

export const cleanRulePayload = (
  rule: ExcelConditionalFormat,
): ExcelConditionalFormat => {
  const typeNorm = normalizeRuleType(rule.type);

  const base: ExcelConditionalFormat = {
    type: typeNorm,
  };

  if (rule.range !== undefined && rule.range !== null && rule.range !== "") {
    base.range = rule.range;
  } else {
    base.column_name = rule.column_name || "";
  }

  if (rule.stop_if_true !== undefined) {
    base.stop_if_true = rule.stop_if_true;
  }

  base.highlight_scope = rule.highlight_scope || "cell";

  const cleanStyle = (
    s: ExcelDifferentialStyle | undefined,
  ): ExcelDifferentialStyle | undefined => {
    if (!s) return undefined;

    const hasFill = !!(s.fill || s.fill_color || s.background_color);
    const hasFont = !!s.font_color;
    const hasBold = s.bold !== undefined;
    const hasItalic = s.italic !== undefined;

    if (!hasFill && !hasFont && !hasBold && !hasItalic) {
      return undefined;
    }

    const cleaned: ExcelDifferentialStyle = {};
    if (s.bold !== undefined) cleaned.bold = s.bold;
    if (s.italic !== undefined) cleaned.italic = s.italic;
    if (s.horizontal !== undefined) cleaned.horizontal = s.horizontal;
    if (s.vertical !== undefined) cleaned.vertical = s.vertical;
    if (s.wrap_text !== undefined) cleaned.wrap_text = s.wrap_text;

    const fillVal = s.fill || s.fill_color || s.background_color;
    if (fillVal) {
      const hex = fillVal.replace("#", "");
      cleaned.fill = hex;
      cleaned.fill_color = hex;
      cleaned.background_color = hex;
    }
    if (s.font_color) {
      cleaned.font_color = s.font_color.replace("#", "");
    }
    return cleaned;
  };

  switch (typeNorm) {
    case "cellis":
      base.operator = rule.operator || "equal";
      base.formula = Array.isArray(rule.formula)
        ? rule.formula.filter((f) => f !== "")
        : rule.formula
          ? [rule.formula]
          : [];
      base.style = cleanStyle(rule.style);
      break;

    case "formula":
    case "expression":
      base.formula = Array.isArray(rule.formula)
        ? rule.formula.filter((f) => f !== "")
        : rule.formula
          ? [rule.formula]
          : [];
      base.style = cleanStyle(rule.style);
      break;

    case "containstext":
    case "notcontainstext":
    case "beginswith":
    case "endswith":
      if (rule.text !== undefined) {
        base.text = rule.text;
      }
      if (rule.formula) {
        base.formula = Array.isArray(rule.formula)
          ? rule.formula.filter((f) => f !== "")
          : [rule.formula];
      }
      base.style = cleanStyle(rule.style);
      break;

    case "duplicaterecords":
    case "uniquerecords":
      base.style = cleanStyle(rule.style);
      break;

    case "aboveaverage":
      if (rule.above_average !== undefined)
        base.above_average = rule.above_average;
      if (rule.below_average !== undefined)
        base.below_average = rule.below_average;
      if (rule.equal_average !== undefined)
        base.equal_average = rule.equal_average;
      base.style = cleanStyle(rule.style);
      break;

    case "top10":
      if (rule.rank !== undefined) base.rank = rule.rank;
      if (rule.percent !== undefined) base.percent = rule.percent;
      if (rule.bottom !== undefined) base.bottom = rule.bottom;
      base.style = cleanStyle(rule.style);
      break;

    case "timeperiod":
      base.time_period = rule.time_period || "today";
      base.style = cleanStyle(rule.style);
      break;

    case "colorscale": {
      const rawColors = rule.colors || [];
      const minColor = (rawColors[0] || "").replace("#", "").trim();
      const midColor = (rawColors[1] || "").replace("#", "").trim();
      const maxColor = (rawColors[2] || "").replace("#", "").trim();

      const list: string[] = [];
      list.push(minColor || "F8696B");
      if (midColor) {
        list.push(midColor);
      }
      list.push(maxColor || "63BE7B");

      base.colors = list;
      break;
    }

    case "databar":
      if (rule.color) {
        base.color = rule.color.replace("#", "");
      }
      if (rule.show_value !== undefined) base.show_value = rule.show_value;
      if (rule.start_type !== undefined) base.start_type = rule.start_type;
      if (rule.start_value !== undefined) base.start_value = rule.start_value;
      if (rule.end_type !== undefined) base.end_type = rule.end_type;
      if (rule.end_value !== undefined) base.end_value = rule.end_value;
      break;

    case "iconset":
      base.icon_style = rule.icon_style || "3TrafficLights1";
      if (rule.show_value !== undefined) base.show_value = rule.show_value;
      if (rule.percent !== undefined) base.percent = rule.percent;
      if (rule.value_type !== undefined) base.value_type = rule.value_type;
      if (rule.values !== undefined) base.values = rule.values;
      if (rule.reverse !== undefined) base.reverse = rule.reverse;
      break;

    default:
      base.style = cleanStyle(rule.style);
      break;
  }

  return base;
};

const STANDARD_FONTS = [
  "Calibri",
  "Arial",
  "Times New Roman",
  "Courier New",
  "Segoe UI",
  "Tahoma",
  "Verdana",
  "Georgia",
  "Garamond",
  "Trebuchet MS",
];

interface ExcelFontSelectorProps {
  value: string | undefined;
  onChange: (_val: string) => void;
}

function ExcelFontSelector({ value, onChange }: ExcelFontSelectorProps) {
  const currentVal = value || "Calibri";
  const isStandard = STANDARD_FONTS.includes(currentVal);
  const [isCustom, setIsCustom] = useState(!isStandard);
  const isTypingRef = useRef(false);

  useEffect(() => {
    if (isTypingRef.current) {
      isTypingRef.current = false;
      return;
    }
    const isValCustom = value ? !STANDARD_FONTS.includes(value) : false;
    if (isCustom !== isValCustom) {
      const timer = setTimeout(() => {
        setIsCustom(isValCustom);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [value, isCustom]);

  return (
    <Box width="100%">
      {isCustom ? (
        <Box position="relative" width="100%">
          <Input
            size="sm"
            bg="white"
            value={value ?? ""}
            onChange={(e) => {
              isTypingRef.current = true;
              onChange(e.target.value);
            }}
            placeholder="Type custom font name..."
            pr="32px"
          />
          <Button
            type="button"
            size="xs"
            variant="ghost"
            position="absolute"
            right="4px"
            top="50%"
            transform="translateY(-50%)"
            onClick={() => {
              setIsCustom(false);
              onChange("Calibri");
            }}
            color="gray.400"
            _hover={{ color: "gray.600" }}
            height="20px"
            minWidth="20px"
            px={0}
            zIndex={2}
          >
            ✕
          </Button>
        </Box>
      ) : (
        <NativeSelect.Root size="sm" width="100%">
          <NativeSelect.Field
            bg="white"
            value={currentVal}
            onChange={(e) => {
              if (e.target.value === "__custom__") {
                setIsCustom(true);
                onChange("");
              } else {
                onChange(e.target.value);
              }
            }}
          >
            {STANDARD_FONTS.map((font) => (
              <option key={font} value={font}>
                {font}
              </option>
            ))}
            <option value="__custom__">Custom...</option>
          </NativeSelect.Field>
          <NativeSelect.Indicator />
        </NativeSelect.Root>
      )}
    </Box>
  );
}

export default function ExcelSettings({
  excelOptions,
  excelSheetName,
  conditionalFormats = [],
  tableFields,
  tableName,
  onChange,
}: ExcelSettingsProps) {
  const [activeTab, setActiveTab] = useState<
    "basic" | "styling" | "formatting"
  >("basic");
  const [activeStylingSubTab, setActiveStylingSubTab] = useState<
    "sheet_header" | "column_headers" | "body"
  >("column_headers");

  const options = excelOptions || DEFAULT_EXCEL_OPTIONS;
  const headerStyle = options.header_style || DEFAULT_HEADER_STYLE;
  const sheetHeaderStyle =
    options.sheet_header_style || DEFAULT_SHEET_HEADER_STYLE;
  const colNames = Object.keys(tableFields || {});
  const rules = conditionalFormats || [];
  console.log("ExcelSettings render rules:", rules);

  const prevRulesLengthRef = useRef(rules.length);

  useEffect(() => {
    if (rules.length > prevRulesLengthRef.current) {
      setTimeout(() => {
        const lastRuleEl = document.getElementById(
          `excel-rule-${rules.length - 1}`,
        );
        if (lastRuleEl) {
          lastRuleEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
      }, 50);
    }
    prevRulesLengthRef.current = rules.length;
  }, [rules.length]);

  const sheetName = options.sheet_name || excelSheetName || "";
  const isSheetHeaderEnabled = !!(
    options.sheet_header_enabled ?? options.sheet_header !== undefined
  );

  const updateOptions = (patch: Partial<ExcelOptions>) => {
    const nextOptions = {
      ...options,
      ...patch,
    };

    if (nextOptions.sheet_header_enabled === false) {
      delete nextOptions.sheet_header;
      delete nextOptions.sheet_header_style;
      delete nextOptions.sheet_header_row_span;
      delete (nextOptions as Record<string, unknown>).sheet_header_title;
      delete (nextOptions as Record<string, unknown>).sheet_header_merge_rows;
    }

    onChange({
      excel_options: nextOptions,
      ...(patch.sheet_name !== undefined
        ? { excel_sheet_name: patch.sheet_name }
        : {}),
    });
  };

  const updateHeaderStyle = (patch: Partial<ExcelHeaderStyle>) => {
    const cleanPatch = { ...patch };
    if (cleanPatch.fill) {
      cleanPatch.fill = cleanPatch.fill.replace("#", "");
    }
    if (cleanPatch.font_color) {
      cleanPatch.font_color = cleanPatch.font_color.replace("#", "");
    }
    onChange({
      excel_options: {
        ...options,
        header_style: {
          ...headerStyle,
          ...cleanPatch,
        },
      },
    });
  };

  const updateSheetHeaderStyle = (patch: Partial<ExcelHeaderStyle>) => {
    const cleanPatch = { ...patch };
    if (cleanPatch.fill) {
      cleanPatch.fill = cleanPatch.fill.replace("#", "");
    }
    if (cleanPatch.font_color) {
      cleanPatch.font_color = cleanPatch.font_color.replace("#", "");
    }
    onChange({
      excel_options: {
        ...options,
        sheet_header_style: {
          ...sheetHeaderStyle,
          ...cleanPatch,
        },
      },
    });
  };

  const bodyStyle = options.body_style || {};

  const updateBodyStyle = (patch: Partial<ExcelBodyStyle>) => {
    const cleanPatch = { ...patch };
    if (cleanPatch.fill) {
      const cleanFill = cleanPatch.fill.replace("#", "");
      cleanPatch.fill = cleanFill;
      cleanPatch.fill_color = cleanFill;
      cleanPatch.background_color = cleanFill;
    }
    if (cleanPatch.banding_fill) {
      const cleanBandingFill = cleanPatch.banding_fill.replace("#", "");
      cleanPatch.banding_fill = cleanBandingFill;
      cleanPatch.banding_fill_color = cleanBandingFill;
      cleanPatch.banding_background_color = cleanBandingFill;
    }
    if (cleanPatch.font_color) {
      cleanPatch.font_color = cleanPatch.font_color.replace("#", "");
    }
    if (cleanPatch.banding_font_color) {
      cleanPatch.banding_font_color = cleanPatch.banding_font_color.replace(
        "#",
        "",
      );
    }

    updateOptions({
      body_style: {
        ...bodyStyle,
        ...cleanPatch,
      },
    });
  };

  const handleAddRule = () => {
    const newRule: ExcelConditionalFormat = {
      type: "cellis",
      column_name: colNames[0] || "",
    };
    onChange({
      excel_conditional_formats: [...rules, newRule].map(cleanRulePayload),
    });
  };

  const handleUpdateRule = (
    index: number,
    patch: Partial<ExcelConditionalFormat>,
  ) => {
    console.log("handleUpdateRule index:", index, "patch:", patch);
    const updated = [...rules];
    const mergedRule = {
      ...updated[index],
      ...patch,
    };

    const colName = mergedRule.column_name || "";
    const rawType = tableFields[colName] || "";
    const colDataType = getColumnDataType(rawType);

    let targetType = normalizeRuleType(mergedRule.type);
    if (!isRuleTypeAllowed(targetType, colDataType)) {
      targetType = "cellis";
    }

    let targetOperator = mergedRule.operator || "equal";
    if (
      targetType === "cellis" &&
      !isOperatorAllowed(targetOperator, colDataType)
    ) {
      targetOperator = "equal";
    }

    const prevType = updated[index].type;
    if (targetType !== normalizeRuleType(prevType)) {
      updated[index] = {
        type: targetType,
        column_name: colName,
        operator: targetOperator,
      };
    } else {
      updated[index] = {
        ...updated[index],
        ...patch,
        type: targetType,
        operator: targetOperator,
      };
    }

    console.log("handleUpdateRule output updated rule:", updated[index]);
    const cleaned = updated.map(cleanRulePayload);
    console.log(
      "handleUpdateRule calling onChange with cleaned rules:",
      cleaned,
    );

    onChange({
      excel_conditional_formats: cleaned,
    });
  };

  const handleUpdateRuleStyle = (
    index: number,
    patch: Partial<ExcelDifferentialStyle>,
  ) => {
    const updated = [...rules];
    const newStyle = {
      ...updated[index].style,
      ...patch,
    };
    if (newStyle.fill) {
      const cleanFill = newStyle.fill.replace("#", "");
      newStyle.fill = cleanFill;
      newStyle.fill_color = cleanFill;
      newStyle.background_color = cleanFill;
    }
    if (newStyle.font_color) {
      newStyle.font_color = newStyle.font_color.replace("#", "");
    }
    updated[index] = {
      ...updated[index],
      style: newStyle,
    };
    onChange({
      excel_conditional_formats: updated.map(cleanRulePayload),
    });
  };

  const handleDeleteRule = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    onChange({
      excel_conditional_formats: rules
        .filter((_, i) => i !== index)
        .map(cleanRulePayload),
    });
  };

  return (
    <Box
      mt={2}
      p={2}
      border="1px solid"
      borderColor="gray.200"
      borderRadius="md"
      bg="gray.50"
      className="excel-settings-compact"
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .excel-settings-compact {
          --gap: 6px !important;
          --grid-gap: 6px !important;
          padding: 8px !important;
          margin-top: 6px !important;
        }
        .excel-settings-compact input,
        .excel-settings-compact select {
          height: 24px !important;
          padding-top: 2px !important;
          padding-bottom: 2px !important;
          font-size: 11px !important;
        }
        .excel-settings-compact label,
        .excel-settings-compact p,
        .excel-settings-compact span,
        .excel-settings-compact div {
          font-size: 11px !important;
        }
        .excel-settings-compact .chakra-stack,
        .excel-settings-compact .chakra-grid,
        .excel-settings-compact .chakra-flex:not(.checkbox-row) {
          gap: 6px !important;
        }
        .excel-settings-compact .checkbox-row {
          gap: 16px !important;
        }
        .excel-settings-compact [class*="FieldLabel"],
        .excel-settings-compact label {
          margin-bottom: 2px !important;
        }
        .excel-settings-compact button {
          height: 22px !important;
          font-size: 10px !important;
          padding-inline: 8px !important;
        }
        .excel-settings-compact button.color-picker-btn {
          height: 20px !important;
          width: 20px !important;
          min-width: 20px !important;
        }
      `,
        }}
      />
      {/* Settings Navigation Tabs */}
      <HStack
        mb={4}
        borderBottom="1px solid"
        borderColor="gray.200"
        pb={2}
        gap={4}
      >
        <Button
          size="xs"
          variant={activeTab === "basic" ? "solid" : "ghost"}
          colorPalette={activeTab === "basic" ? "brand" : "gray"}
          onClick={() => setActiveTab("basic")}
        >
          Basic Options
        </Button>
        <Button
          size="xs"
          variant={activeTab === "styling" ? "solid" : "ghost"}
          colorPalette={activeTab === "styling" ? "brand" : "gray"}
          onClick={() => setActiveTab("styling")}
        >
          Styling
        </Button>
        <Button
          size="xs"
          variant={activeTab === "formatting" ? "solid" : "ghost"}
          colorPalette={activeTab === "formatting" ? "brand" : "gray"}
          onClick={() => setActiveTab("formatting")}
        >
          Conditional Formatting ({rules.length})
        </Button>
      </HStack>

      {/* Tab: Basic Options */}
      {activeTab === "basic" && (
        <VStack gap={3} align="stretch">
          <Grid templateColumns="3fr 1fr" gap={3} alignItems="end">
            <Field.Root gap={0}>
              <Field.Label
                fontSize="xs"
                fontWeight="semibold"
                color="gray.600"
                mb={0.5}
              >
                Sheet Name
              </Field.Label>
              <Input
                size="xs"
                bg="white"
                value={sheetName}
                onChange={(e) => updateOptions({ sheet_name: e.target.value })}
                placeholder="Sheet1"
              />
            </Field.Root>
            <Field.Root gap={0}>
              <Field.Label
                fontSize="xs"
                fontWeight="semibold"
                color="gray.600"
                mb={0.5}
              >
                Freeze Panes
              </Field.Label>
              <Input
                size="xs"
                bg="white"
                value={options.freeze_panes ?? ""}
                onChange={(e) =>
                  updateOptions({ freeze_panes: e.target.value })
                }
                placeholder="A2"
              />
            </Field.Root>
          </Grid>

          <Grid templateColumns="1fr 1fr 1fr" gap={3} alignItems="end">
            <Field.Root gap={0}>
              <Field.Label
                fontSize="xs"
                fontWeight="semibold"
                color="gray.600"
                mb={0.5}
              >
                Date Format
              </Field.Label>
              <NativeSelect.Root size="xs">
                <NativeSelect.Field
                  bg="white"
                  value={options.date_format ?? "yyyy-mm-dd"}
                  onChange={(e) =>
                    updateOptions({ date_format: e.target.value })
                  }
                >
                  <option value="yyyy-mm-dd">YYYY-MM-DD</option>
                  <option value="dd-mm-yyyy">DD-MM-YYYY</option>
                  <option value="mm/dd/yyyy">MM/DD/YYYY</option>
                  <option value="d-mmm-yy">D-MMM-YY</option>
                  <option value="mmmm d, yyyy">MMMM D, YYYY</option>
                </NativeSelect.Field>
                <NativeSelect.Indicator />
              </NativeSelect.Root>
            </Field.Root>

            <Field.Root gap={0}>
              <Field.Label
                fontSize="xs"
                fontWeight="semibold"
                color="gray.600"
                mb={0.5}
              >
                Datetime Format
              </Field.Label>
              <NativeSelect.Root size="xs">
                <NativeSelect.Field
                  bg="white"
                  value={options.datetime_format ?? "yyyy-mm-dd hh:mm:ss"}
                  onChange={(e) =>
                    updateOptions({ datetime_format: e.target.value })
                  }
                >
                  <option value="yyyy-mm-dd hh:mm:ss">
                    YYYY-MM-DD HH:mm:ss
                  </option>
                  <option value="yyyy-mm-dd hh:mm:ss AM/PM">
                    YYYY-MM-DD HH:mm:ss AM/PM
                  </option>
                  <option value="mm/dd/yyyy hh:mm:ss">
                    MM/DD/YYYY HH:mm:ss
                  </option>
                  <option value="dd-mm-yyyy hh:mm:ss">
                    DD-MM-YYYY HH:mm:ss
                  </option>
                </NativeSelect.Field>
                <NativeSelect.Indicator />
              </NativeSelect.Root>
            </Field.Root>

            <Field.Root gap={0}>
              <Field.Label
                fontSize="xs"
                fontWeight="semibold"
                color="gray.600"
                mb={0.5}
              >
                Time Format
              </Field.Label>
              <NativeSelect.Root size="xs">
                <NativeSelect.Field
                  bg="white"
                  value={options.time_format ?? "hh:mm:ss"}
                  onChange={(e) =>
                    updateOptions({ time_format: e.target.value })
                  }
                >
                  <option value="hh:mm:ss">HH:mm:ss</option>
                  <option value="hh:mm">HH:mm</option>
                  <option value="hh:mm:ss AM/PM">HH:mm:ss AM/PM</option>
                  <option value="hh:mm AM/PM">HH:mm AM/PM</option>
                </NativeSelect.Field>
                <NativeSelect.Indicator />
              </NativeSelect.Root>
            </Field.Root>
          </Grid>

          <Flex
            wrap="wrap"
            gap={6}
            py={2.5}
            px={1}
            borderTop="1px solid"
            borderColor="gray.200"
            mt={1}
            className="checkbox-row"
          >
            <Checkbox.Root
              size="sm"
              colorPalette="brand"
              checked={options.auto_filter ?? true}
              onCheckedChange={(details) =>
                updateOptions({ auto_filter: !!details.checked })
              }
            >
              <Checkbox.HiddenInput />
              <Checkbox.Control />
              <Checkbox.Label
                fontSize="xs"
                fontWeight="medium"
                color="gray.700"
              >
                Auto Filter
              </Checkbox.Label>
            </Checkbox.Root>

            <Checkbox.Root
              size="sm"
              colorPalette="brand"
              checked={options.auto_width ?? true}
              onCheckedChange={(details) =>
                updateOptions({ auto_width: !!details.checked })
              }
            >
              <Checkbox.HiddenInput />
              <Checkbox.Control />
              <Checkbox.Label
                fontSize="xs"
                fontWeight="medium"
                color="gray.700"
              >
                Auto Column Width
              </Checkbox.Label>
            </Checkbox.Root>

            <Checkbox.Root
              size="sm"
              colorPalette="brand"
              checked={options.freeze_header ?? true}
              onCheckedChange={(details) =>
                updateOptions({ freeze_header: !!details.checked })
              }
            >
              <Checkbox.HiddenInput />
              <Checkbox.Control />
              <Checkbox.Label
                fontSize="xs"
                fontWeight="medium"
                color="gray.700"
              >
                Freeze Header Row
              </Checkbox.Label>
            </Checkbox.Root>
          </Flex>
        </VStack>
      )}

      {/* Tab: Styling */}
      {activeTab === "styling" && (
        <VStack gap={4} align="stretch">
          {/* Sub-tabs Navigation */}
          <HStack
            borderBottom="1px solid"
            borderColor="gray.200"
            pb={1.5}
            gap={3}
            mb={2}
          >
            <Button
              size="2xs"
              variant={
                activeStylingSubTab === "sheet_header" ? "solid" : "outline"
              }
              colorPalette={
                activeStylingSubTab === "sheet_header" ? "brand" : "gray"
              }
              onClick={() => setActiveStylingSubTab("sheet_header")}
            >
              Sheet Header
            </Button>
            <Button
              size="2xs"
              variant={
                activeStylingSubTab === "column_headers" ? "solid" : "outline"
              }
              colorPalette={
                activeStylingSubTab === "column_headers" ? "brand" : "gray"
              }
              onClick={() => setActiveStylingSubTab("column_headers")}
            >
              Column Headers
            </Button>
            <Button
              size="2xs"
              variant={activeStylingSubTab === "body" ? "solid" : "outline"}
              colorPalette={activeStylingSubTab === "body" ? "brand" : "gray"}
              onClick={() => setActiveStylingSubTab("body")}
            >
              Body Style
            </Button>
          </HStack>

          {/* Sub-tab: Sheet Header */}
          {activeStylingSubTab === "sheet_header" && (
            <VStack gap={4} align="stretch">
              <Box>
                <Checkbox.Root
                  size="sm"
                  colorPalette="brand"
                  checked={isSheetHeaderEnabled}
                  onCheckedChange={(details) => {
                    const checked = !!details.checked;
                    if (checked) {
                      updateOptions({
                        sheet_header_enabled: true,
                        sheet_header: options.sheet_header || "",
                        sheet_header_row_span:
                          options.sheet_header_row_span || 1,
                      });
                    } else {
                      updateOptions({
                        sheet_header_enabled: false,
                      });
                    }
                  }}
                >
                  <Checkbox.HiddenInput />
                  <Checkbox.Label
                    fontSize="xs"
                    fontWeight="bold"
                    color="gray.700"
                  >
                    Enable Sheet Header
                  </Checkbox.Label>
                  <Checkbox.Control />
                </Checkbox.Root>
              </Box>

              {isSheetHeaderEnabled && (
                <>
                  <Grid
                    templateColumns={{ base: "1fr", md: "2fr 1fr" }}
                    gap={4}
                    alignItems="end"
                  >
                    <Field.Root gap={0}>
                      <Field.Label
                        fontSize="xs"
                        fontWeight="bold"
                        color="gray.700"
                        mb={1}
                      >
                        Sheet Header Title Text
                      </Field.Label>
                      <Input
                        size="sm"
                        bg="white"
                        value={options.sheet_header ?? ""}
                        onChange={(e) =>
                          updateOptions({ sheet_header: e.target.value })
                        }
                        placeholder="e.g. Weekly Stock Report"
                      />
                    </Field.Root>

                    <Field.Root gap={0}>
                      <Field.Label
                        fontSize="xs"
                        fontWeight="bold"
                        color="gray.700"
                        mb={1}
                      >
                        Row Span (Merge Height)
                      </Field.Label>
                      <NativeSelect.Root size="sm">
                        <NativeSelect.Field
                          bg="white"
                          value={options.sheet_header_row_span ?? 1}
                          onChange={(e) =>
                            updateOptions({
                              sheet_header_row_span:
                                parseInt(e.target.value) || 1,
                            })
                          }
                        >
                          <option value="1">1 Row (e.g. A1:F1)</option>
                          <option value="2">2 Rows (e.g. A1:F2)</option>
                          <option value="3">3 Rows (e.g. A1:F3)</option>
                          <option value="4">4 Rows (e.g. A1:F4)</option>
                          <option value="5">5 Rows (e.g. A1:F5)</option>
                        </NativeSelect.Field>
                        <NativeSelect.Indicator />
                      </NativeSelect.Root>
                    </Field.Root>
                  </Grid>

                  <Grid
                    templateColumns={{ base: "1fr", md: "2fr 1fr 2fr 2fr" }}
                    gap={2}
                    alignItems="end"
                  >
                    <Field.Root gap={0}>
                      <Field.Label
                        fontSize="xs"
                        fontWeight="semibold"
                        color="gray.600"
                        mb={0.5}
                      >
                        Font Name
                      </Field.Label>
                      <ExcelFontSelector
                        value={sheetHeaderStyle.font_name}
                        onChange={(val) =>
                          updateSheetHeaderStyle({ font_name: val })
                        }
                      />
                    </Field.Root>

                    <Field.Root gap={0}>
                      <Field.Label
                        fontSize="xs"
                        fontWeight="semibold"
                        color="gray.600"
                        mb={0.5}
                      >
                        Font Size
                      </Field.Label>
                      <Input
                        size="xs"
                        bg="white"
                        type="number"
                        value={sheetHeaderStyle.font_size ?? 16}
                        onChange={(e) =>
                          updateSheetHeaderStyle({
                            font_size: parseInt(e.target.value) || 16,
                          })
                        }
                      />
                    </Field.Root>

                    <Field.Root gap={0}>
                      <Field.Label
                        fontSize="xs"
                        fontWeight="semibold"
                        color="gray.600"
                        mb={0.5}
                      >
                        Background Color (HEX)
                      </Field.Label>
                      <HStack gap={1}>
                        <ExcelColorPicker
                          value={sheetHeaderStyle.fill}
                          onChange={(hex) =>
                            updateSheetHeaderStyle({ fill: hex })
                          }
                          w="20px"
                          h="20px"
                          borderRadius="sm"
                          allowNoFill={true}
                        />
                        <Input
                          size="xs"
                          bg="white"
                          value={sheetHeaderStyle.fill ?? ""}
                          onChange={(e) =>
                            updateSheetHeaderStyle({ fill: e.target.value })
                          }
                          placeholder="2F5597"
                        />
                      </HStack>
                    </Field.Root>

                    <Field.Root gap={0}>
                      <Field.Label
                        fontSize="xs"
                        fontWeight="semibold"
                        color="gray.600"
                        mb={0.5}
                      >
                        Text Color (HEX)
                      </Field.Label>
                      <HStack gap={1}>
                        <ExcelColorPicker
                          value={sheetHeaderStyle.font_color}
                          onChange={(hex) =>
                            updateSheetHeaderStyle({ font_color: hex })
                          }
                          w="20px"
                          h="20px"
                          borderRadius="sm"
                        />
                        <Input
                          size="xs"
                          bg="white"
                          value={sheetHeaderStyle.font_color ?? ""}
                          onChange={(e) =>
                            updateSheetHeaderStyle({
                              font_color: e.target.value,
                            })
                          }
                          placeholder="FFFFFF"
                        />
                      </HStack>
                    </Field.Root>
                  </Grid>

                  <Flex gap={3} align="flex-end" wrap="wrap" mt={1}>
                    <Field.Root gap={0} width="160px">
                      <Field.Label
                        fontSize="xs"
                        fontWeight="semibold"
                        color="gray.600"
                        mb={0.5}
                      >
                        Horizontal Alignment
                      </Field.Label>
                      <NativeSelect.Root size="xs">
                        <NativeSelect.Field
                          bg="white"
                          value={sheetHeaderStyle.horizontal ?? "center"}
                          onChange={(e) =>
                            updateSheetHeaderStyle({
                              horizontal: e.target.value,
                            })
                          }
                        >
                          <option value="left">Left</option>
                          <option value="center">Center</option>
                          <option value="right">Right</option>
                        </NativeSelect.Field>
                        <NativeSelect.Indicator />
                      </NativeSelect.Root>
                    </Field.Root>

                    <Field.Root gap={0} width="160px">
                      <Field.Label
                        fontSize="xs"
                        fontWeight="semibold"
                        color="gray.600"
                        mb={0.5}
                      >
                        Vertical Alignment
                      </Field.Label>
                      <NativeSelect.Root size="xs">
                        <NativeSelect.Field
                          bg="white"
                          value={sheetHeaderStyle.vertical ?? "center"}
                          onChange={(e) =>
                            updateSheetHeaderStyle({
                              vertical: e.target.value,
                            })
                          }
                        >
                          <option value="top">Top</option>
                          <option value="center">Center</option>
                          <option value="bottom">Bottom</option>
                        </NativeSelect.Field>
                        <NativeSelect.Indicator />
                      </NativeSelect.Root>
                    </Field.Root>

                    <HStack gap={4} height="24px" align="center">
                      <Checkbox.Root
                        size="sm"
                        colorPalette="brand"
                        checked={sheetHeaderStyle.bold ?? true}
                        onCheckedChange={(details) =>
                          updateSheetHeaderStyle({ bold: !!details.checked })
                        }
                      >
                        <Checkbox.HiddenInput />
                        <Checkbox.Control />
                        <Checkbox.Label
                          fontSize="xs"
                          fontWeight="medium"
                          color="gray.700"
                        >
                          Bold
                        </Checkbox.Label>
                      </Checkbox.Root>

                      <Checkbox.Root
                        size="sm"
                        colorPalette="brand"
                        checked={sheetHeaderStyle.italic ?? false}
                        onCheckedChange={(details) =>
                          updateSheetHeaderStyle({ italic: !!details.checked })
                        }
                      >
                        <Checkbox.HiddenInput />
                        <Checkbox.Control />
                        <Checkbox.Label
                          fontSize="xs"
                          fontWeight="medium"
                          color="gray.700"
                        >
                          Italic
                        </Checkbox.Label>
                      </Checkbox.Root>
                    </HStack>
                  </Flex>

                  {/* Sheet Header Preview */}
                  <Box
                    p={1.5}
                    bg="white"
                    borderRadius="md"
                    border="1px solid"
                    borderColor="gray.200"
                    mt={1}
                  >
                    <Text
                      fontSize="10px"
                      fontWeight="semibold"
                      color="gray.500"
                      mb={1}
                    >
                      Sheet Header Preview
                    </Text>
                    <Flex
                      p={1.5}
                      bg={getCssColor(sheetHeaderStyle.fill, "#2F5597")}
                      color={getCssColor(
                        sheetHeaderStyle.font_color,
                        "#FFFFFF",
                      )}
                      fontWeight={sheetHeaderStyle.bold ? "bold" : "normal"}
                      fontStyle={sheetHeaderStyle.italic ? "italic" : "normal"}
                      fontSize={`${sheetHeaderStyle.font_size ?? 16}px`}
                      fontFamily={sheetHeaderStyle.font_name || "Calibri"}
                      justifyContent={sheetHeaderStyle.horizontal || "center"}
                      alignItems={getCssAlignItems(sheetHeaderStyle.vertical)}
                      borderRadius="sm"
                      border="1px solid"
                      borderColor="gray.300"
                      minHeight={`${Math.max(45, 24 * (options.sheet_header_row_span ?? 1))}px`}
                      textAlign={sheetHeaderStyle.horizontal || "center"}
                    >
                      {options.sheet_header ||
                        tableName ||
                        "Report Title Header"}
                    </Flex>
                  </Box>
                </>
              )}
            </VStack>
          )}

          {/* Sub-tab: Column Headers */}
          {activeStylingSubTab === "column_headers" && (
            <VStack gap={4} align="stretch">
              <Grid
                templateColumns={{ base: "1fr", md: "2fr 1fr 2fr 2fr" }}
                gap={2}
                alignItems="end"
              >
                <Field.Root gap={0}>
                  <Field.Label
                    fontSize="xs"
                    fontWeight="semibold"
                    color="gray.600"
                    mb={0.5}
                  >
                    Font Name
                  </Field.Label>
                  <ExcelFontSelector
                    value={headerStyle.font_name}
                    onChange={(val) => updateHeaderStyle({ font_name: val })}
                  />
                </Field.Root>

                <Field.Root gap={0}>
                  <Field.Label
                    fontSize="xs"
                    fontWeight="semibold"
                    color="gray.600"
                    mb={0.5}
                  >
                    Font Size
                  </Field.Label>
                  <Input
                    size="xs"
                    bg="white"
                    type="number"
                    value={headerStyle.font_size ?? 11}
                    onChange={(e) =>
                      updateHeaderStyle({
                        font_size: parseInt(e.target.value) || 11,
                      })
                    }
                  />
                </Field.Root>

                <Field.Root gap={0}>
                  <Field.Label
                    fontSize="xs"
                    fontWeight="semibold"
                    color="gray.600"
                    mb={0.5}
                  >
                    Background Color (HEX)
                  </Field.Label>
                  <HStack gap={1}>
                    <ExcelColorPicker
                      value={headerStyle.fill}
                      onChange={(hex) => updateHeaderStyle({ fill: hex })}
                      w="20px"
                      h="20px"
                      borderRadius="sm"
                      allowNoFill={true}
                    />
                    <Input
                      size="xs"
                      bg="white"
                      value={headerStyle.fill ?? ""}
                      onChange={(e) =>
                        updateHeaderStyle({ fill: e.target.value })
                      }
                      placeholder="1F4E78"
                    />
                  </HStack>
                </Field.Root>

                <Field.Root gap={0}>
                  <Field.Label
                    fontSize="xs"
                    fontWeight="semibold"
                    color="gray.600"
                    mb={0.5}
                  >
                    Text Color (HEX)
                  </Field.Label>
                  <HStack gap={1}>
                    <ExcelColorPicker
                      value={headerStyle.font_color}
                      onChange={(hex) => updateHeaderStyle({ font_color: hex })}
                      w="20px"
                      h="20px"
                      borderRadius="sm"
                    />
                    <Input
                      size="xs"
                      bg="white"
                      value={headerStyle.font_color ?? ""}
                      onChange={(e) =>
                        updateHeaderStyle({ font_color: e.target.value })
                      }
                      placeholder="FFFFFF"
                    />
                  </HStack>
                </Field.Root>
              </Grid>

              <Flex gap={3} align="flex-end" wrap="wrap" mt={1}>
                <Field.Root gap={0} width="160px">
                  <Field.Label
                    fontSize="xs"
                    fontWeight="semibold"
                    color="gray.600"
                    mb={0.5}
                  >
                    Horizontal Alignment
                  </Field.Label>
                  <NativeSelect.Root size="xs">
                    <NativeSelect.Field
                      bg="white"
                      value={headerStyle.horizontal ?? "center"}
                      onChange={(e) =>
                        updateHeaderStyle({ horizontal: e.target.value })
                      }
                    >
                      <option value="left">Left</option>
                      <option value="center">Center</option>
                      <option value="right">Right</option>
                    </NativeSelect.Field>
                    <NativeSelect.Indicator />
                  </NativeSelect.Root>
                </Field.Root>

                <Field.Root gap={0} width="160px">
                  <Field.Label
                    fontSize="xs"
                    fontWeight="semibold"
                    color="gray.600"
                    mb={0.5}
                  >
                    Vertical Alignment
                  </Field.Label>
                  <NativeSelect.Root size="xs">
                    <NativeSelect.Field
                      bg="white"
                      value={headerStyle.vertical ?? "center"}
                      onChange={(e) =>
                        updateHeaderStyle({ vertical: e.target.value })
                      }
                    >
                      <option value="top">Top</option>
                      <option value="center">Center</option>
                      <option value="bottom">Bottom</option>
                    </NativeSelect.Field>
                    <NativeSelect.Indicator />
                  </NativeSelect.Root>
                </Field.Root>

                <HStack gap={4} height="24px" align="center">
                  <Checkbox.Root
                    size="sm"
                    colorPalette="brand"
                    checked={headerStyle.bold ?? true}
                    onCheckedChange={(details) =>
                      updateHeaderStyle({ bold: !!details.checked })
                    }
                  >
                    <Checkbox.HiddenInput />
                    <Checkbox.Control />
                    <Checkbox.Label
                      fontSize="xs"
                      fontWeight="medium"
                      color="gray.700"
                    >
                      Bold
                    </Checkbox.Label>
                  </Checkbox.Root>

                  <Checkbox.Root
                    size="sm"
                    colorPalette="brand"
                    checked={headerStyle.italic ?? false}
                    onCheckedChange={(details) =>
                      updateHeaderStyle({ italic: !!details.checked })
                    }
                  >
                    <Checkbox.HiddenInput />
                    <Checkbox.Control />
                    <Checkbox.Label
                      fontSize="xs"
                      fontWeight="medium"
                      color="gray.700"
                    >
                      Italic
                    </Checkbox.Label>
                  </Checkbox.Root>

                  <Checkbox.Root
                    size="sm"
                    colorPalette="brand"
                    checked={headerStyle.wrap_text ?? true}
                    onCheckedChange={(details) =>
                      updateHeaderStyle({ wrap_text: !!details.checked })
                    }
                  >
                    <Checkbox.HiddenInput />
                    <Checkbox.Control />
                    <Checkbox.Label
                      fontSize="xs"
                      fontWeight="medium"
                      color="gray.700"
                    >
                      Wrap Text
                    </Checkbox.Label>
                  </Checkbox.Root>
                </HStack>
              </Flex>

              {/* Header Preview */}
              <Box
                p={1.5}
                bg="white"
                borderRadius="md"
                border="1px solid"
                borderColor="gray.200"
                mt={1}
              >
                <Text
                  fontSize="10px"
                  fontWeight="semibold"
                  color="gray.500"
                  mb={1}
                >
                  Header Cell Preview
                </Text>
                <Flex
                  p={1.5}
                  bg={getCssColor(headerStyle.fill, "#1F4E78")}
                  color={getCssColor(headerStyle.font_color, "#FFFFFF")}
                  fontWeight={headerStyle.bold ? "bold" : "normal"}
                  fontStyle={headerStyle.italic ? "italic" : "normal"}
                  fontSize={`${headerStyle.font_size ?? 11}px`}
                  fontFamily={headerStyle.font_name || "Calibri"}
                  justifyContent={headerStyle.horizontal || "center"}
                  alignItems={getCssAlignItems(headerStyle.vertical)}
                  borderRadius="sm"
                  border="1px solid"
                  borderColor="gray.300"
                  minHeight="45px"
                  textAlign={headerStyle.horizontal || "center"}
                >
                  {sheetName || "Sheet1"} Header Column
                </Flex>
              </Box>
            </VStack>
          )}

          {/* Sub-tab: Body Style */}
          {activeStylingSubTab === "body" && (
            <VStack gap={4} align="stretch">
              <Grid
                templateColumns={{ base: "1fr", md: "2fr 1fr 2fr 2fr" }}
                gap={2}
                alignItems="end"
              >
                <Field.Root gap={0}>
                  <Field.Label
                    fontSize="xs"
                    fontWeight="semibold"
                    color="gray.600"
                    mb={0.5}
                  >
                    Background Color (HEX)
                  </Field.Label>
                  <HStack gap={1}>
                    <ExcelColorPicker
                      value={bodyStyle.fill}
                      onChange={(hex) => updateBodyStyle({ fill: hex })}
                      w="20px"
                      h="20px"
                      borderRadius="sm"
                      allowNoFill={true}
                    />
                    <Input
                      size="xs"
                      bg="white"
                      value={bodyStyle.fill ?? ""}
                      onChange={(e) =>
                        updateBodyStyle({ fill: e.target.value })
                      }
                      placeholder="FFFFFF"
                    />
                  </HStack>
                </Field.Root>

                <Field.Root gap={0}>
                  <Field.Label
                    fontSize="xs"
                    fontWeight="semibold"
                    color="gray.600"
                    mb={0.5}
                  >
                    Text Color (HEX)
                  </Field.Label>
                  <HStack gap={1}>
                    <ExcelColorPicker
                      value={bodyStyle.font_color}
                      onChange={(hex) => updateBodyStyle({ font_color: hex })}
                      w="20px"
                      h="20px"
                      borderRadius="sm"
                    />
                    <Input
                      size="xs"
                      bg="white"
                      value={bodyStyle.font_color ?? ""}
                      onChange={(e) =>
                        updateBodyStyle({ font_color: e.target.value })
                      }
                      placeholder="000000"
                    />
                  </HStack>
                </Field.Root>

                <Field.Root gap={0}>
                  <Field.Label
                    fontSize="xs"
                    fontWeight="semibold"
                    color="gray.600"
                    mb={0.5}
                  >
                    Font Name
                  </Field.Label>
                  <ExcelFontSelector
                    value={bodyStyle.font_name}
                    onChange={(val) => updateBodyStyle({ font_name: val })}
                  />
                </Field.Root>

                <Field.Root gap={0}>
                  <Field.Label
                    fontSize="xs"
                    fontWeight="semibold"
                    color="gray.600"
                    mb={0.5}
                  >
                    Font Size
                  </Field.Label>
                  <Input
                    size="xs"
                    bg="white"
                    type="number"
                    value={bodyStyle.font_size ?? 11}
                    onChange={(e) =>
                      updateBodyStyle({
                        font_size: parseInt(e.target.value) || 11,
                      })
                    }
                  />
                </Field.Root>
              </Grid>

              <Flex wrap="wrap" gap={4} mt={1} align="center">
                <Checkbox.Root
                  size="sm"
                  colorPalette="brand"
                  checked={bodyStyle.bold ?? false}
                  onCheckedChange={(details) =>
                    updateBodyStyle({ bold: !!details.checked })
                  }
                >
                  <Checkbox.HiddenInput />
                  <Checkbox.Control />
                  <Checkbox.Label
                    fontSize="xs"
                    fontWeight="medium"
                    color="gray.700"
                  >
                    Bold
                  </Checkbox.Label>
                </Checkbox.Root>

                <Checkbox.Root
                  size="sm"
                  colorPalette="brand"
                  checked={bodyStyle.italic ?? false}
                  onCheckedChange={(details) =>
                    updateBodyStyle({ italic: !!details.checked })
                  }
                >
                  <Checkbox.HiddenInput />
                  <Checkbox.Control />
                  <Checkbox.Label
                    fontSize="xs"
                    fontWeight="medium"
                    color="gray.700"
                  >
                    Italic
                  </Checkbox.Label>
                </Checkbox.Root>

                <Checkbox.Root
                  size="sm"
                  colorPalette="brand"
                  checked={!!bodyStyle.banding_fill}
                  onCheckedChange={(details) => {
                    if (details.checked) {
                      updateBodyStyle({
                        banding_fill: "F2F2F2",
                        banding_font_color: bodyStyle.font_color || "000000",
                        banding_frequency: 2,
                      });
                    } else {
                      onChange({
                        excel_options: {
                          ...options,
                          body_style: {
                            ...bodyStyle,
                            banding_fill: undefined,
                            banding_fill_color: undefined,
                            banding_background_color: undefined,
                            banding_font_color: undefined,
                            banding_frequency: undefined,
                          },
                        },
                      });
                    }
                  }}
                >
                  <Checkbox.HiddenInput />
                  <Checkbox.Control />
                  <Checkbox.Label
                    fontSize="xs"
                    fontWeight="bold"
                    color="gray.700"
                  >
                    Enable Alternating Row Banding / Shading
                  </Checkbox.Label>
                </Checkbox.Root>
              </Flex>

              {/* Alternating Row Shading (Banding) Section */}
              {!!bodyStyle.banding_fill && (
                <Box
                  p={1.5}
                  bg="white"
                  border="1px solid"
                  borderColor="gray.200"
                  borderRadius="md"
                  mt={1}
                >
                  <Grid
                    templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }}
                    gap={2}
                    alignItems="end"
                  >
                    <Field.Root gap={0}>
                      <Field.Label
                        fontSize="xs"
                        fontWeight="semibold"
                        color="gray.600"
                        mb={0.5}
                      >
                        Banding Fill Color (HEX)
                      </Field.Label>
                      <HStack gap={1}>
                        <ExcelColorPicker
                          value={bodyStyle.banding_fill}
                          onChange={(hex) =>
                            updateBodyStyle({ banding_fill: hex })
                          }
                          w="20px"
                          h="20px"
                          borderRadius="sm"
                        />
                        <Input
                          size="xs"
                          bg="white"
                          value={bodyStyle.banding_fill ?? ""}
                          onChange={(e) =>
                            updateBodyStyle({ banding_fill: e.target.value })
                          }
                          placeholder="F2F2F2"
                        />
                      </HStack>
                    </Field.Root>

                    <Field.Root gap={0}>
                      <Field.Label
                        fontSize="xs"
                        fontWeight="semibold"
                        color="gray.600"
                        mb={0.5}
                      >
                        Banding Text Color (HEX)
                      </Field.Label>
                      <HStack gap={1}>
                        <ExcelColorPicker
                          value={bodyStyle.banding_font_color}
                          onChange={(hex) =>
                            updateBodyStyle({ banding_font_color: hex })
                          }
                          w="20px"
                          h="20px"
                          borderRadius="sm"
                        />
                        <Input
                          size="xs"
                          bg="white"
                          value={bodyStyle.banding_font_color ?? ""}
                          onChange={(e) =>
                            updateBodyStyle({
                              banding_font_color: e.target.value,
                            })
                          }
                          placeholder="000000"
                        />
                      </HStack>
                    </Field.Root>

                    <Field.Root gap={0}>
                      <Field.Label
                        fontSize="xs"
                        fontWeight="semibold"
                        color="gray.600"
                        mb={0.5}
                      >
                        Banding Frequency
                      </Field.Label>
                      <Input
                        size="xs"
                        bg="white"
                        type="number"
                        min={2}
                        value={bodyStyle.banding_frequency ?? 2}
                        onChange={(e) =>
                          updateBodyStyle({
                            banding_frequency: parseInt(e.target.value) || 2,
                          })
                        }
                        placeholder="e.g. 2 for alternating rows"
                      />
                    </Field.Root>
                  </Grid>
                </Box>
              )}

              {/* Body Preview */}
              <Box
                p={1.5}
                bg="white"
                borderRadius="md"
                border="1px solid"
                borderColor="gray.200"
                mt={1}
              >
                <Text
                  fontSize="10px"
                  fontWeight="semibold"
                  color="gray.500"
                  mb={1}
                >
                  Body Rows Preview
                </Text>
                <VStack gap={0.5} align="stretch">
                  <Flex
                    p={1.5}
                    bg={getCssColor(bodyStyle.fill, "#FFFFFF")}
                    color={getCssColor(bodyStyle.font_color, "#000000")}
                    fontWeight={bodyStyle.bold ? "bold" : "normal"}
                    fontStyle={bodyStyle.italic ? "italic" : "normal"}
                    fontSize={`${bodyStyle.font_size ?? 11}px`}
                    fontFamily={bodyStyle.font_name || "Calibri"}
                    borderRadius="sm"
                    border="1px solid"
                    borderColor="gray.200"
                    minHeight="22px"
                    align="center"
                    px={2}
                  >
                    Row 1 (Base Row Style)
                  </Flex>
                  <Flex
                    p={1.5}
                    bg={
                      bodyStyle.banding_fill
                        ? getCssColor(bodyStyle.banding_fill, "#F2F2F2")
                        : getCssColor(bodyStyle.fill, "#FFFFFF")
                    }
                    color={
                      bodyStyle.banding_fill
                        ? getCssColor(bodyStyle.banding_font_color, "#000000")
                        : getCssColor(bodyStyle.font_color, "#000000")
                    }
                    fontWeight={bodyStyle.bold ? "bold" : "normal"}
                    fontStyle={bodyStyle.italic ? "italic" : "normal"}
                    fontSize={`${bodyStyle.font_size ?? 11}px`}
                    fontFamily={bodyStyle.font_name || "Calibri"}
                    borderRadius="sm"
                    border="1px solid"
                    borderColor="gray.200"
                    minHeight="22px"
                    align="center"
                    px={2}
                  >
                    Row 2{" "}
                    {bodyStyle.banding_fill
                      ? "(Banded Alternate Row Style)"
                      : "(Base Row Style)"}
                  </Flex>
                  <Flex
                    p={1.5}
                    bg={getCssColor(bodyStyle.fill, "#FFFFFF")}
                    color={getCssColor(bodyStyle.font_color, "#000000")}
                    fontWeight={bodyStyle.bold ? "bold" : "normal"}
                    fontStyle={bodyStyle.italic ? "italic" : "normal"}
                    fontSize={`${bodyStyle.font_size ?? 11}px`}
                    fontFamily={bodyStyle.font_name || "Calibri"}
                    borderRadius="sm"
                    border="1px solid"
                    borderColor="gray.200"
                    minHeight="22px"
                    align="center"
                    px={2}
                  >
                    Row 3 (Base Row Style)
                  </Flex>
                </VStack>
              </Box>
            </VStack>
          )}
        </VStack>
      )}

      {/* Tab: Conditional Formatting */}
      {activeTab === "formatting" && (
        <VStack gap={3} align="stretch">
          <Flex justifyContent="space-between" alignItems="center">
            <Text fontSize="xs" fontWeight="semibold" color="gray.700">
              Formatting Rules ({rules.length})
            </Text>
            <Button
              size="xs"
              variant="surface"
              colorPalette="brand"
              onClick={handleAddRule}
            >
              <IoMdAdd /> Add Rule
            </Button>
          </Flex>

          {rules.length === 0 ? (
            <Box
              py={8}
              textAlign="center"
              border="1px dashed"
              borderColor="gray.300"
              borderRadius="md"
              bg="white"
            >
              <Text fontSize="xs" color="gray.500">
                No conditional formatting rules added yet.
              </Text>
            </Box>
          ) : (
            <VStack gap={2} align="stretch">
              {rules.map((rule, idx) => {
                const ruleStyle = rule.style || {};
                const typeNorm = normalizeRuleType(rule.type);
                const colName = rule.column_name || "";
                const rawType = tableFields[colName] || "";
                const colDataType = getColumnDataType(rawType);

                const minVal = Array.isArray(rule.formula)
                  ? (rule.formula[0] ?? "")
                  : (rule.formula ?? "");
                const minValErr = getValidationError(minVal, colDataType);

                const maxVal = Array.isArray(rule.formula)
                  ? (rule.formula[1] ?? "")
                  : "";
                const maxValErr = getValidationError(maxVal, colDataType);

                const singleVal = Array.isArray(rule.formula)
                  ? rule.formula.join(",")
                  : (rule.formula ?? "");
                const singleValErr = getValidationError(singleVal, colDataType);

                const formulaExpr = Array.isArray(rule.formula)
                  ? (rule.formula[0] ?? "")
                  : (rule.formula ?? "");
                const formulaExprErr =
                  formulaExpr && !formulaExpr.trim().startsWith("=")
                    ? "Formula must start with '=' (e.g. =A2>100)"
                    : null;

                const isStylingInternally = [
                  "colorscale",
                  "databar",
                  "iconset",
                ].includes(typeNorm);

                return (
                  <Box
                    key={idx}
                    id={`excel-rule-${idx}`}
                    p={2}
                    bg="white"
                    border="1px solid"
                    borderColor="gray.200"
                    borderRadius="md"
                    shadow="xs"
                  >
                    {/* Header Row */}
                    <Flex
                      justifyContent="space-between"
                      alignItems="center"
                      mb={1.5}
                      pb={1}
                      borderBottom="1px solid"
                      borderColor="gray.100"
                    >
                      <Text fontSize="xs" fontWeight="bold" color="brand.600">
                        Rule #{idx + 1}
                      </Text>
                      <IconButton
                        aria-label="Delete rule"
                        size="xs"
                        variant="ghost"
                        colorPalette="red"
                        onClick={(e) => handleDeleteRule(e, idx)}
                      >
                        <IoMdTrash />
                      </IconButton>
                    </Flex>

                    {/* Columns Layout: Equal 1fr 1fr split */}
                    <Grid
                      templateColumns={{ base: "1fr", md: "1fr 1fr" }}
                      gap={3}
                    >
                      {/* Left: Criteria */}
                      <VStack align="stretch" gap={2}>
                        <Grid
                          templateColumns="repeat(2, 1fr)"
                          gap={2}
                          alignItems="end"
                        >
                          <Field.Root gap={0}>
                            <Field.Label
                              fontSize="xs"
                              fontWeight="semibold"
                              color="gray.600"
                              mb={0.5}
                            >
                              Rule Type
                            </Field.Label>
                            <NativeSelect.Root size="xs">
                              <NativeSelect.Field
                                bg="white"
                                value={typeNorm}
                                onChange={(e) =>
                                  handleUpdateRule(idx, {
                                    type: e.target.value,
                                  })
                                }
                              >
                                {isRuleTypeAllowed("cellis", colDataType) && (
                                  <option value="cellis">Cell Value Is</option>
                                )}
                                {isRuleTypeAllowed(
                                  "containstext",
                                  colDataType,
                                ) && (
                                  <option value="containstext">
                                    Contains Text
                                  </option>
                                )}
                                {isRuleTypeAllowed(
                                  "notcontainstext",
                                  colDataType,
                                ) && (
                                  <option value="notcontainstext">
                                    Does Not Contain Text
                                  </option>
                                )}
                                {isRuleTypeAllowed(
                                  "beginswith",
                                  colDataType,
                                ) && (
                                  <option value="beginswith">
                                    Begins With
                                  </option>
                                )}
                                {isRuleTypeAllowed("endswith", colDataType) && (
                                  <option value="endswith">Ends With</option>
                                )}
                                {isRuleTypeAllowed(
                                  "duplicaterecords",
                                  colDataType,
                                ) && (
                                  <option value="duplicaterecords">
                                    Duplicate Values
                                  </option>
                                )}
                                {isRuleTypeAllowed(
                                  "uniquerecords",
                                  colDataType,
                                ) && (
                                  <option value="uniquerecords">
                                    Unique Values
                                  </option>
                                )}
                                {isRuleTypeAllowed(
                                  "aboveaverage",
                                  colDataType,
                                ) && (
                                  <option value="aboveaverage">
                                    Above/Below Average
                                  </option>
                                )}
                                {isRuleTypeAllowed("top10", colDataType) && (
                                  <option value="top10">Top/Bottom 10</option>
                                )}
                                {isRuleTypeAllowed("formula", colDataType) && (
                                  <option value="formula">
                                    Custom Formula
                                  </option>
                                )}
                                {isRuleTypeAllowed(
                                  "colorscale",
                                  colDataType,
                                ) && (
                                  <option value="colorscale">
                                    Color Scale
                                  </option>
                                )}
                                {isRuleTypeAllowed("databar", colDataType) && (
                                  <option value="databar">Data Bar</option>
                                )}
                                {isRuleTypeAllowed("iconset", colDataType) && (
                                  <option value="iconset">Icon Set</option>
                                )}
                              </NativeSelect.Field>
                              <NativeSelect.Indicator />
                            </NativeSelect.Root>
                          </Field.Root>

                          <Field.Root gap={0}>
                            <Field.Label
                              fontSize="xs"
                              fontWeight="semibold"
                              color="gray.600"
                              mb={0.5}
                            >
                              Column Name
                            </Field.Label>
                            <NativeSelect.Root size="xs">
                              <NativeSelect.Field
                                bg="white"
                                value={rule.column_name ?? ""}
                                onChange={(e) =>
                                  handleUpdateRule(idx, {
                                    column_name: e.target.value,
                                    range: undefined,
                                  })
                                }
                              >
                                <option value="">-- Select Column --</option>
                                {colNames.map((col) => (
                                  <option key={col} value={col}>
                                    {col}
                                  </option>
                                ))}
                              </NativeSelect.Field>
                              <NativeSelect.Indicator />
                            </NativeSelect.Root>
                          </Field.Root>
                        </Grid>

                        {/* Rule Parameters details */}
                        <Box
                          p={1.5}
                          bg="gray.50"
                          borderRadius="md"
                          border="1px solid"
                          borderColor="gray.200"
                        >
                          {typeNorm === "cellis" && (
                            <Grid
                              templateColumns={
                                ["between", "notBetween"].includes(
                                  rule.operator ?? "",
                                )
                                  ? "1fr 2fr"
                                  : "1fr 1fr"
                              }
                              gap={3}
                              alignItems="end"
                            >
                              <Field.Root gap={0}>
                                <Field.Label
                                  fontSize="xs"
                                  color="gray.600"
                                  mb={1}
                                >
                                  Operator
                                </Field.Label>
                                <NativeSelect.Root size="xs">
                                  <NativeSelect.Field
                                    bg="white"
                                    value={rule.operator ?? "equal"}
                                    onChange={(e) =>
                                      handleUpdateRule(idx, {
                                        operator: e.target.value,
                                      })
                                    }
                                  >
                                    {isOperatorAllowed(
                                      "equal",
                                      colDataType,
                                    ) && (
                                      <option value="equal">Equal to</option>
                                    )}
                                    {isOperatorAllowed(
                                      "notEqual",
                                      colDataType,
                                    ) && (
                                      <option value="notEqual">
                                        Not equal to
                                      </option>
                                    )}
                                    {isOperatorAllowed(
                                      "greaterThan",
                                      colDataType,
                                    ) && (
                                      <option value="greaterThan">
                                        Greater than
                                      </option>
                                    )}
                                    {isOperatorAllowed(
                                      "lessThan",
                                      colDataType,
                                    ) && (
                                      <option value="lessThan">
                                        Less than
                                      </option>
                                    )}
                                    {isOperatorAllowed(
                                      "greaterThanOrEqual",
                                      colDataType,
                                    ) && (
                                      <option value="greaterThanOrEqual">
                                        Greater than or equal to
                                      </option>
                                    )}
                                    {isOperatorAllowed(
                                      "lessThanOrEqual",
                                      colDataType,
                                    ) && (
                                      <option value="lessThanOrEqual">
                                        Less than or equal to
                                      </option>
                                    )}
                                    {isOperatorAllowed(
                                      "between",
                                      colDataType,
                                    ) && (
                                      <option value="between">Between</option>
                                    )}
                                    {isOperatorAllowed(
                                      "notBetween",
                                      colDataType,
                                    ) && (
                                      <option value="notBetween">
                                        Not between
                                      </option>
                                    )}
                                  </NativeSelect.Field>
                                  <NativeSelect.Indicator />
                                </NativeSelect.Root>
                              </Field.Root>
                              {["between", "notBetween"].includes(
                                rule.operator ?? "",
                              ) ? (
                                <Grid
                                  templateColumns="1fr 1fr"
                                  gap={2}
                                  width="100%"
                                  alignItems="end"
                                >
                                  <Field.Root gap={0}>
                                    <Field.Label
                                      fontSize="xs"
                                      color="gray.600"
                                      mb={1}
                                    >
                                      Min Value
                                    </Field.Label>
                                    <Input
                                      size="xs"
                                      bg="white"
                                      value={
                                        Array.isArray(rule.formula)
                                          ? (rule.formula[0] ?? "")
                                          : (rule.formula ?? "")
                                      }
                                      onChange={(e) => {
                                        const currentFormulas = Array.isArray(
                                          rule.formula,
                                        )
                                          ? [...rule.formula]
                                          : [rule.formula ?? ""];
                                        currentFormulas[0] = e.target.value;
                                        handleUpdateRule(idx, {
                                          formula: currentFormulas,
                                        });
                                      }}
                                      placeholder="Min"
                                    />
                                    {minValErr && (
                                      <Text
                                        color="red.500"
                                        fontSize="9px"
                                        mt={0.5}
                                        lineHeight="normal"
                                      >
                                        {minValErr}
                                      </Text>
                                    )}
                                  </Field.Root>
                                  <Field.Root gap={0}>
                                    <Field.Label
                                      fontSize="xs"
                                      color="gray.600"
                                      mb={1}
                                    >
                                      Max Value
                                    </Field.Label>
                                    <Input
                                      size="xs"
                                      bg="white"
                                      value={
                                        Array.isArray(rule.formula)
                                          ? (rule.formula[1] ?? "")
                                          : ""
                                      }
                                      onChange={(e) => {
                                        const currentFormulas = Array.isArray(
                                          rule.formula,
                                        )
                                          ? [...rule.formula]
                                          : [rule.formula ?? ""];
                                        if (currentFormulas.length === 0) {
                                          currentFormulas[0] = "";
                                        }
                                        currentFormulas[1] = e.target.value;
                                        handleUpdateRule(idx, {
                                          formula: currentFormulas,
                                        });
                                      }}
                                      placeholder="Max"
                                    />
                                    {maxValErr && (
                                      <Text
                                        color="red.500"
                                        fontSize="9px"
                                        mt={0.5}
                                        lineHeight="normal"
                                      >
                                        {maxValErr}
                                      </Text>
                                    )}
                                  </Field.Root>
                                </Grid>
                              ) : (
                                <Field.Root gap={0}>
                                  <Field.Label
                                    fontSize="xs"
                                    color="gray.600"
                                    mb={1}
                                  >
                                    Value / Formula
                                  </Field.Label>
                                  <Input
                                    size="xs"
                                    bg="white"
                                    value={
                                      Array.isArray(rule.formula)
                                        ? rule.formula.join(",")
                                        : (rule.formula ?? "")
                                    }
                                    onChange={(e) => {
                                      const vals = e.target.value.split(",");
                                      handleUpdateRule(idx, {
                                        formula:
                                          vals.length > 1
                                            ? vals
                                            : e.target.value,
                                      });
                                    }}
                                    placeholder='e.g. 10 or "Draft"'
                                  />
                                  {singleValErr && (
                                    <Text
                                      color="red.500"
                                      fontSize="9px"
                                      mt={0.5}
                                      lineHeight="normal"
                                    >
                                      {singleValErr}
                                    </Text>
                                  )}
                                </Field.Root>
                              )}
                            </Grid>
                          )}

                          {(typeNorm === "containstext" ||
                            typeNorm === "notcontainstext" ||
                            typeNorm === "beginswith" ||
                            typeNorm === "endswith") && (
                            <Field.Root gap={0}>
                              <Field.Label
                                fontSize="xs"
                                color="gray.600"
                                mb={1}
                              >
                                Text Value
                              </Field.Label>
                              <Input
                                size="xs"
                                bg="white"
                                value={rule.text ?? ""}
                                onChange={(e) =>
                                  handleUpdateRule(idx, {
                                    text: e.target.value,
                                  })
                                }
                                placeholder="Text to match"
                              />
                            </Field.Root>
                          )}

                          {typeNorm === "formula" && (
                            <VStack align="stretch" gap={2}>
                              <Field.Root gap={0}>
                                <Field.Label
                                  fontSize="xs"
                                  color="gray.600"
                                  mb={1}
                                >
                                  Formula Expression
                                </Field.Label>
                                <Input
                                  size="xs"
                                  bg="white"
                                  value={
                                    Array.isArray(rule.formula)
                                      ? (rule.formula[0] ?? "")
                                      : (rule.formula ?? "")
                                  }
                                  onChange={(e) =>
                                    handleUpdateRule(idx, {
                                      formula: [e.target.value],
                                    })
                                  }
                                  placeholder="e.g. =A2>100"
                                />
                                {formulaExprErr && (
                                  <Text
                                    color="red.500"
                                    fontSize="9px"
                                    mt={0.5}
                                    lineHeight="normal"
                                  >
                                    {formulaExprErr}
                                  </Text>
                                )}
                              </Field.Root>
                              <Flex h="24px" align="center">
                                <Checkbox.Root
                                  size="xs"
                                  colorPalette="brand"
                                  checked={rule.stop_if_true ?? false}
                                  onCheckedChange={(details) =>
                                    handleUpdateRule(idx, {
                                      stop_if_true: !!details.checked,
                                    })
                                  }
                                >
                                  <Checkbox.HiddenInput />
                                  <Checkbox.Control />
                                  <Checkbox.Label fontSize="xs">
                                    Stop If True
                                  </Checkbox.Label>
                                </Checkbox.Root>
                              </Flex>
                            </VStack>
                          )}

                          {typeNorm === "top10" && (
                            <Grid
                              templateColumns="repeat(3, 1fr)"
                              gap={2}
                              alignItems="end"
                            >
                              <Field.Root gap={0}>
                                <Field.Label
                                  fontSize="xs"
                                  color="gray.600"
                                  mb={1}
                                >
                                  Rank / Items
                                </Field.Label>
                                <Input
                                  size="xs"
                                  type="number"
                                  bg="white"
                                  value={rule.rank ?? 10}
                                  onChange={(e) =>
                                    handleUpdateRule(idx, {
                                      rank: parseInt(e.target.value) || 10,
                                    })
                                  }
                                />
                              </Field.Root>
                              <Flex h="24px" align="center">
                                <Checkbox.Root
                                  size="xs"
                                  colorPalette="brand"
                                  checked={rule.percent ?? false}
                                  onCheckedChange={(details) =>
                                    handleUpdateRule(idx, {
                                      percent: !!details.checked,
                                    })
                                  }
                                >
                                  <Checkbox.HiddenInput />
                                  <Checkbox.Control />
                                  <Checkbox.Label fontSize="xs">
                                    Percent
                                  </Checkbox.Label>
                                </Checkbox.Root>
                              </Flex>
                              <Flex h="24px" align="center">
                                <Checkbox.Root
                                  size="xs"
                                  colorPalette="brand"
                                  checked={rule.bottom ?? false}
                                  onCheckedChange={(details) =>
                                    handleUpdateRule(idx, {
                                      bottom: !!details.checked,
                                    })
                                  }
                                >
                                  <Checkbox.HiddenInput />
                                  <Checkbox.Control />
                                  <Checkbox.Label fontSize="xs">
                                    Bottom
                                  </Checkbox.Label>
                                </Checkbox.Root>
                              </Flex>
                            </Grid>
                          )}

                          {typeNorm === "aboveaverage" && (
                            <Grid
                              templateColumns="repeat(2, 1fr)"
                              gap={2}
                              alignItems="end"
                            >
                              <Field.Root gap={0}>
                                <Field.Label
                                  fontSize="xs"
                                  color="gray.600"
                                  mb={1}
                                >
                                  Condition
                                </Field.Label>
                                <NativeSelect.Root size="xs">
                                  <NativeSelect.Field
                                    bg="white"
                                    value={
                                      rule.above_average === false
                                        ? "below"
                                        : "above"
                                    }
                                    onChange={(e) =>
                                      handleUpdateRule(idx, {
                                        above_average:
                                          e.target.value === "above",
                                        below_average:
                                          e.target.value === "below",
                                      })
                                    }
                                  >
                                    <option value="above">Above Average</option>
                                    <option value="below">Below Average</option>
                                  </NativeSelect.Field>
                                  <NativeSelect.Indicator />
                                </NativeSelect.Root>
                              </Field.Root>
                              <Flex h="24px" align="center">
                                <Checkbox.Root
                                  size="xs"
                                  colorPalette="brand"
                                  checked={rule.equal_average ?? false}
                                  onCheckedChange={(details) =>
                                    handleUpdateRule(idx, {
                                      equal_average: !!details.checked,
                                    })
                                  }
                                >
                                  <Checkbox.HiddenInput />
                                  <Checkbox.Control />
                                  <Checkbox.Label fontSize="xs">
                                    Equal Avg
                                  </Checkbox.Label>
                                </Checkbox.Root>
                              </Flex>
                            </Grid>
                          )}

                          {typeNorm === "timeperiod" && (
                            <Field.Root gap={0}>
                              <Field.Label
                                fontSize="xs"
                                color="gray.600"
                                mb={1}
                              >
                                Time Period
                              </Field.Label>
                              <NativeSelect.Root size="xs">
                                <NativeSelect.Field
                                  bg="white"
                                  value={rule.time_period ?? "today"}
                                  onChange={(e) =>
                                    handleUpdateRule(idx, {
                                      time_period: e.target.value,
                                    })
                                  }
                                >
                                  <option value="today">Today</option>
                                  <option value="yesterday">Yesterday</option>
                                  <option value="tomorrow">Tomorrow</option>
                                  <option value="last7Days">Last 7 Days</option>
                                  <option value="thisWeek">This Week</option>
                                  <option value="lastWeek">Last Week</option>
                                  <option value="thisMonth">This Month</option>
                                  <option value="lastMonth">Last Month</option>
                                </NativeSelect.Field>
                                <NativeSelect.Indicator />
                              </NativeSelect.Root>
                            </Field.Root>
                          )}

                          {typeNorm === "colorscale" && (
                            <Grid templateColumns="repeat(3, 1fr)" gap={2}>
                              <Field.Root gap={0}>
                                <Field.Label
                                  fontSize="xs"
                                  color="gray.600"
                                  mb={1}
                                >
                                  Min Color
                                </Field.Label>
                                <HStack gap={1}>
                                  <ExcelColorPicker
                                    value={rule.colors?.[0]}
                                    onChange={(hex) => {
                                      const list = [
                                        hex,
                                        rule.colors?.[1] || "FFEB84",
                                        rule.colors?.[2] || "63BE7B",
                                      ];
                                      handleUpdateRule(idx, { colors: list });
                                    }}
                                    w="14px"
                                    h="14px"
                                    borderRadius="full"
                                  />
                                  <Input
                                    size="xs"
                                    bg="white"
                                    value={rule.colors?.[0] ?? ""}
                                    onChange={(e) => {
                                      const list = [
                                        e.target.value.replace("#", ""),
                                        rule.colors?.[1] || "FFEB84",
                                        rule.colors?.[2] || "63BE7B",
                                      ];
                                      handleUpdateRule(idx, { colors: list });
                                    }}
                                    placeholder="F8696B"
                                  />
                                </HStack>
                              </Field.Root>
                              <Field.Root gap={0}>
                                <Field.Label
                                  fontSize="xs"
                                  color="gray.600"
                                  mb={1}
                                >
                                  Mid Color
                                </Field.Label>
                                <HStack gap={1}>
                                  <ExcelColorPicker
                                    value={rule.colors?.[1]}
                                    onChange={(hex) => {
                                      const list = [
                                        rule.colors?.[0] || "F8696B",
                                        hex,
                                        rule.colors?.[2] || "63BE7B",
                                      ];
                                      handleUpdateRule(idx, { colors: list });
                                    }}
                                    w="14px"
                                    h="14px"
                                    borderRadius="full"
                                  />
                                  <Input
                                    size="xs"
                                    bg="white"
                                    value={rule.colors?.[1] ?? ""}
                                    onChange={(e) => {
                                      const list = [
                                        rule.colors?.[0] || "F8696B",
                                        e.target.value.replace("#", ""),
                                        rule.colors?.[2] || "63BE7B",
                                      ];
                                      handleUpdateRule(idx, { colors: list });
                                    }}
                                    placeholder="FFEB84"
                                  />
                                </HStack>
                              </Field.Root>
                              <Field.Root gap={0}>
                                <Field.Label
                                  fontSize="xs"
                                  color="gray.600"
                                  mb={1}
                                >
                                  Max Color
                                </Field.Label>
                                <HStack gap={1}>
                                  <ExcelColorPicker
                                    value={rule.colors?.[2]}
                                    onChange={(hex) => {
                                      const list = [
                                        rule.colors?.[0] || "F8696B",
                                        rule.colors?.[1] || "FFEB84",
                                        hex,
                                      ];
                                      handleUpdateRule(idx, { colors: list });
                                    }}
                                    w="14px"
                                    h="14px"
                                    borderRadius="full"
                                  />
                                  <Input
                                    size="xs"
                                    bg="white"
                                    value={rule.colors?.[2] ?? ""}
                                    onChange={(e) => {
                                      const list = [
                                        rule.colors?.[0] || "F8696B",
                                        rule.colors?.[1] || "FFEB84",
                                        e.target.value.replace("#", ""),
                                      ];
                                      handleUpdateRule(idx, { colors: list });
                                    }}
                                    placeholder="63BE7B"
                                  />
                                </HStack>
                              </Field.Root>
                            </Grid>
                          )}

                          {typeNorm === "databar" && (
                            <VStack align="stretch" gap={3}>
                              <Grid
                                templateColumns="repeat(2, 1fr)"
                                gap={2}
                                alignItems="end"
                              >
                                <Field.Root gap={0}>
                                  <Field.Label
                                    fontSize="xs"
                                    color="gray.600"
                                    mb={1}
                                  >
                                    Bar Color
                                  </Field.Label>
                                  <HStack gap={1}>
                                    <ExcelColorPicker
                                      value={rule.color}
                                      onChange={(hex) =>
                                        handleUpdateRule(idx, { color: hex })
                                      }
                                      w="14px"
                                      h="14px"
                                      borderRadius="full"
                                    />
                                    <Input
                                      size="xs"
                                      bg="white"
                                      value={rule.color ?? ""}
                                      onChange={(e) =>
                                        handleUpdateRule(idx, {
                                          color: e.target.value.replace(
                                            "#",
                                            "",
                                          ),
                                        })
                                      }
                                      placeholder="638EC6"
                                    />
                                  </HStack>
                                  <Text
                                    fontSize="10px"
                                    color="gray.500"
                                    mt={1.5}
                                  >
                                    Note: Rendered as a gradient fill.
                                  </Text>
                                </Field.Root>
                                <Flex h="24px" align="center">
                                  <Checkbox.Root
                                    size="xs"
                                    colorPalette="brand"
                                    checked={rule.show_value ?? true}
                                    onCheckedChange={(details) =>
                                      handleUpdateRule(idx, {
                                        show_value: !!details.checked,
                                      })
                                    }
                                  >
                                    <Checkbox.HiddenInput />
                                    <Checkbox.Control />
                                    <Checkbox.Label fontSize="xs">
                                      Show Value
                                    </Checkbox.Label>
                                  </Checkbox.Root>
                                </Flex>
                              </Grid>

                              {/* Data Bar Min/Max bounds customization */}
                              <Box
                                borderTop="1px solid"
                                borderColor="gray.200"
                                pt={2}
                                mt={1}
                              >
                                <Text
                                  fontSize="xs"
                                  fontWeight="semibold"
                                  color="gray.600"
                                  mb={2}
                                >
                                  Configure Bounds
                                </Text>
                                <Grid templateColumns="1fr 1fr" gap={3}>
                                  <VStack align="stretch" gap={1.5}>
                                    <Text
                                      fontSize="10px"
                                      fontWeight="medium"
                                      color="gray.500"
                                    >
                                      Minimum
                                    </Text>
                                    <NativeSelect.Root size="xs">
                                      <NativeSelect.Field
                                        bg="white"
                                        value={rule.start_type ?? "min"}
                                        onChange={(e) =>
                                          handleUpdateRule(idx, {
                                            start_type: e.target.value,
                                            start_value:
                                              e.target.value === "min"
                                                ? undefined
                                                : (rule.start_value ?? 0),
                                          })
                                        }
                                      >
                                        <option value="min">
                                          Automatic (Min)
                                        </option>
                                        <option value="num">Number</option>
                                        <option value="percent">Percent</option>
                                        <option value="percentile">
                                          Percentile
                                        </option>
                                        <option value="formula">Formula</option>
                                      </NativeSelect.Field>
                                      <NativeSelect.Indicator />
                                    </NativeSelect.Root>
                                    {rule.start_type &&
                                      rule.start_type !== "min" && (
                                        <Input
                                          size="xs"
                                          bg="white"
                                          value={rule.start_value ?? ""}
                                          onChange={(e) =>
                                            handleUpdateRule(idx, {
                                              start_value: e.target.value,
                                            })
                                          }
                                          placeholder="Value"
                                        />
                                      )}
                                  </VStack>

                                  <VStack align="stretch" gap={1.5}>
                                    <Text
                                      fontSize="10px"
                                      fontWeight="medium"
                                      color="gray.500"
                                    >
                                      Maximum
                                    </Text>
                                    <NativeSelect.Root size="xs">
                                      <NativeSelect.Field
                                        bg="white"
                                        value={rule.end_type ?? "max"}
                                        onChange={(e) =>
                                          handleUpdateRule(idx, {
                                            end_type: e.target.value,
                                            end_value:
                                              e.target.value === "max"
                                                ? undefined
                                                : (rule.end_value ?? 100),
                                          })
                                        }
                                      >
                                        <option value="max">
                                          Automatic (Max)
                                        </option>
                                        <option value="num">Number</option>
                                        <option value="percent">Percent</option>
                                        <option value="percentile">
                                          Percentile
                                        </option>
                                        <option value="formula">Formula</option>
                                      </NativeSelect.Field>
                                      <NativeSelect.Indicator />
                                    </NativeSelect.Root>
                                    {rule.end_type &&
                                      rule.end_type !== "max" && (
                                        <Input
                                          size="xs"
                                          bg="white"
                                          value={rule.end_value ?? ""}
                                          onChange={(e) =>
                                            handleUpdateRule(idx, {
                                              end_value: e.target.value,
                                            })
                                          }
                                          placeholder="Value"
                                        />
                                      )}
                                  </VStack>
                                </Grid>
                              </Box>
                            </VStack>
                          )}

                          {typeNorm === "iconset" && (
                            <VStack align="stretch" gap={3}>
                              <Grid
                                templateColumns="repeat(2, 1fr)"
                                gap={2}
                                alignItems="end"
                              >
                                <Field.Root gap={0}>
                                  <Field.Label
                                    fontSize="xs"
                                    color="gray.600"
                                    mb={1}
                                  >
                                    Icon Style
                                  </Field.Label>
                                  <NativeSelect.Root size="xs">
                                    <NativeSelect.Field
                                      bg="white"
                                      value={
                                        rule.icon_style ?? "3TrafficLights1"
                                      }
                                      onChange={(e) => {
                                        const style = e.target.value;
                                        let defaultVals = [0, 33, 67];
                                        if (style === "4Arrows") {
                                          defaultVals = [0, 25, 50, 75];
                                        } else if (style === "5Arrows") {
                                          defaultVals = [0, 20, 40, 60, 80];
                                        }
                                        handleUpdateRule(idx, {
                                          icon_style: style,
                                          values: defaultVals,
                                        });
                                      }}
                                    >
                                      <option value="3TrafficLights1">
                                        Traffic Lights
                                      </option>
                                      <option value="3Arrows">3 Arrows</option>
                                      <option value="3Flags">3 Flags</option>
                                      <option value="3Symbols">
                                        3 Symbols
                                      </option>
                                      <option value="4Arrows">4 Arrows</option>
                                      <option value="5Arrows">5 Arrows</option>
                                    </NativeSelect.Field>
                                    <NativeSelect.Indicator />
                                  </NativeSelect.Root>
                                  {getIconSetPreview(
                                    rule.icon_style ?? "3TrafficLights1",
                                  )}
                                </Field.Root>
                                <Flex h="24px" align="center">
                                  <Checkbox.Root
                                    size="xs"
                                    colorPalette="brand"
                                    checked={rule.show_value ?? true}
                                    onCheckedChange={(details) =>
                                      handleUpdateRule(idx, {
                                        show_value: !!details.checked,
                                      })
                                    }
                                  >
                                    <Checkbox.HiddenInput />
                                    <Checkbox.Control />
                                    <Checkbox.Label fontSize="xs">
                                      Show Value
                                    </Checkbox.Label>
                                  </Checkbox.Root>
                                </Flex>
                              </Grid>

                              {/* Icon Set Value Thresholds customization */}
                              <Box
                                borderTop="1px solid"
                                borderColor="gray.200"
                                pt={2}
                                mt={1}
                              >
                                <Flex
                                  align="center"
                                  justify="space-between"
                                  mb={2}
                                >
                                  <Text
                                    fontSize="xs"
                                    fontWeight="semibold"
                                    color="gray.600"
                                  >
                                    Configure Thresholds
                                  </Text>
                                  <HStack gap={1}>
                                    <Text fontSize="10px" color="gray.500">
                                      Type:
                                    </Text>
                                    <NativeSelect.Root size="xs" width="80px">
                                      <NativeSelect.Field
                                        bg="white"
                                        value={rule.value_type ?? "percent"}
                                        onChange={(e) =>
                                          handleUpdateRule(idx, {
                                            value_type: e.target.value,
                                            percent:
                                              e.target.value === "percent",
                                          })
                                        }
                                      >
                                        <option value="percent">Percent</option>
                                        <option value="num">Number</option>
                                      </NativeSelect.Field>
                                      <NativeSelect.Indicator />
                                    </NativeSelect.Root>
                                  </HStack>
                                </Flex>

                                <VStack align="stretch" gap={2}>
                                  {(() => {
                                    const style =
                                      rule.icon_style ?? "3TrafficLights1";
                                    const is5 = style === "5Arrows";
                                    const is4 = style === "4Arrows";
                                    const numThresholds = is5 ? 4 : is4 ? 3 : 2;
                                    const currentValues =
                                      rule.values ||
                                      (is5
                                        ? [0, 20, 40, 60, 80]
                                        : is4
                                          ? [0, 25, 50, 75]
                                          : [0, 33, 67]);

                                    const labels = is5
                                      ? [
                                          "Tier 5 (Highest) Lower Bound",
                                          "Tier 4 Lower Bound",
                                          "Tier 3 Lower Bound",
                                          "Tier 2 Lower Bound",
                                        ]
                                      : is4
                                        ? [
                                            "Tier 4 (Highest) Lower Bound",
                                            "Tier 3 Lower Bound",
                                            "Tier 2 Lower Bound",
                                          ]
                                        : [
                                            "Tier 3 (Highest) Lower Bound",
                                            "Tier 2 Lower Bound",
                                          ];

                                    return Array.from({
                                      length: numThresholds,
                                    }).map((_, tIdx) => {
                                      const valIndex = numThresholds - tIdx;
                                      const val =
                                        currentValues[valIndex] ??
                                        (is5
                                          ? 80 - tIdx * 20
                                          : is4
                                            ? 75 - tIdx * 25
                                            : 67 - tIdx * 34);

                                      return (
                                        <Flex
                                          key={tIdx}
                                          align="center"
                                          justify="space-between"
                                        >
                                          <Text
                                            fontSize="10px"
                                            color="gray.600"
                                          >
                                            {labels[tIdx]}
                                          </Text>
                                          <HStack
                                            gap={1}
                                            width="100px"
                                            justify="flex-end"
                                          >
                                            <Text
                                              fontSize="10px"
                                              color="gray.400"
                                            >
                                              &gt;=
                                            </Text>
                                            <Input
                                              size="xs"
                                              bg="white"
                                              type="number"
                                              width="60px"
                                              value={val}
                                              onChange={(e) => {
                                                const newVal =
                                                  parseFloat(e.target.value) ||
                                                  0;
                                                const newValues = [
                                                  ...currentValues,
                                                ];
                                                newValues[valIndex] = newVal;
                                                handleUpdateRule(idx, {
                                                  values: newValues,
                                                });
                                              }}
                                            />
                                          </HStack>
                                        </Flex>
                                      );
                                    });
                                  })()}
                                </VStack>
                              </Box>
                            </VStack>
                          )}
                          {/* Fallback empty message for duplicaterecords / uniquerecords */}
                          {["duplicaterecords", "uniquerecords"].includes(
                            typeNorm,
                          ) && (
                            <Text
                              fontSize="xs"
                              color="gray.500"
                              fontStyle="italic"
                            >
                              No extra parameters required.
                            </Text>
                          )}
                        </Box>
                      </VStack>

                      {/* Right: Style / Format to Apply */}
                      {!isStylingInternally ? (
                        <VStack
                          align="stretch"
                          gap={2}
                          borderLeft={{ base: "none", md: "1px solid" }}
                          borderColor="gray.200"
                          pl={{ base: 0, md: 3 }}
                        >
                          <Text
                            fontSize="xs"
                            fontWeight="semibold"
                            color="gray.600"
                          >
                            Format to Apply
                          </Text>
                          <Grid templateColumns="repeat(2, 1fr)" gap={2}>
                            <Field.Root gap={0}>
                              <Field.Label
                                fontSize="xs"
                                color="gray.600"
                                mb={0.5}
                              >
                                Fill Color (HEX)
                              </Field.Label>
                              <HStack gap={1}>
                                <ExcelColorPicker
                                  value={ruleStyle.fill}
                                  onChange={(hex) =>
                                    handleUpdateRuleStyle(idx, { fill: hex })
                                  }
                                  w="14px"
                                  h="14px"
                                  borderRadius="full"
                                  allowNoFill={true}
                                />
                                <Input
                                  size="xs"
                                  bg="white"
                                  value={ruleStyle.fill ?? ""}
                                  onChange={(e) =>
                                    handleUpdateRuleStyle(idx, {
                                      fill: e.target.value,
                                    })
                                  }
                                  placeholder="FFC7CE"
                                />
                              </HStack>
                            </Field.Root>
                            <Field.Root gap={0}>
                              <Field.Label
                                fontSize="xs"
                                color="gray.600"
                                mb={0.5}
                              >
                                Text Color (HEX)
                              </Field.Label>
                              <HStack gap={1}>
                                <ExcelColorPicker
                                  value={ruleStyle.font_color}
                                  onChange={(hex) =>
                                    handleUpdateRuleStyle(idx, {
                                      font_color: hex,
                                    })
                                  }
                                  w="14px"
                                  h="14px"
                                  borderRadius="full"
                                />
                                <Input
                                  size="xs"
                                  bg="white"
                                  value={ruleStyle.font_color ?? ""}
                                  onChange={(e) =>
                                    handleUpdateRuleStyle(idx, {
                                      font_color: e.target.value,
                                    })
                                  }
                                  placeholder="9C0006"
                                />
                              </HStack>
                            </Field.Root>
                          </Grid>
                          <Flex gap={4} mt={1} align="center">
                            <Checkbox.Root
                              size="xs"
                              colorPalette="brand"
                              checked={ruleStyle.bold ?? false}
                              onCheckedChange={(details) =>
                                handleUpdateRuleStyle(idx, {
                                  bold: !!details.checked,
                                })
                              }
                            >
                              <Checkbox.HiddenInput />
                              <Checkbox.Control />
                              <Checkbox.Label fontSize="xs">
                                Bold
                              </Checkbox.Label>
                            </Checkbox.Root>
                            <Checkbox.Root
                              size="xs"
                              colorPalette="brand"
                              checked={ruleStyle.italic ?? false}
                              onCheckedChange={(details) =>
                                handleUpdateRuleStyle(idx, {
                                  italic: !!details.checked,
                                })
                              }
                            >
                              <Checkbox.HiddenInput />
                              <Checkbox.Control />
                              <Checkbox.Label fontSize="xs">
                                Italic
                              </Checkbox.Label>
                            </Checkbox.Root>
                          </Flex>

                          {/* Highlight Scope Selection */}
                          <Field.Root gap={0} mt={1}>
                            <Field.Label
                              fontSize="xs"
                              fontWeight="semibold"
                              color="gray.600"
                              mb={1}
                            >
                              Highlight Scope
                            </Field.Label>
                            <HStack
                              gap={4}
                              height="24px"
                              className="checkbox-row"
                              align="center"
                            >
                              <Flex
                                align="center"
                                gap={1.5}
                                cursor="pointer"
                                userSelect="none"
                                onClick={() => {
                                  console.log("Cell Only clicked");
                                  handleUpdateRule(idx, {
                                    highlight_scope: "cell",
                                  });
                                }}
                              >
                                <Box
                                  w="14px"
                                  h="14px"
                                  borderRadius="full"
                                  border="1px solid"
                                  borderColor={
                                    rule.highlight_scope !== "entire_row"
                                      ? "brand.500"
                                      : "gray.300"
                                  }
                                  bg="white"
                                  display="flex"
                                  alignItems="center"
                                  justifyContent="center"
                                  transition="border-color 0.2s"
                                >
                                  {rule.highlight_scope !== "entire_row" && (
                                    <Box
                                      w="6px"
                                      h="6px"
                                      borderRadius="full"
                                      bg="brand.500"
                                    />
                                  )}
                                </Box>
                                <Text
                                  fontSize="xs"
                                  color="gray.700"
                                  fontWeight="medium"
                                >
                                  Cell Only
                                </Text>
                              </Flex>

                              <Flex
                                align="center"
                                gap={1.5}
                                cursor="pointer"
                                userSelect="none"
                                onClick={() => {
                                  console.log("Entire Row clicked");
                                  handleUpdateRule(idx, {
                                    highlight_scope: "entire_row",
                                  });
                                }}
                              >
                                <Box
                                  w="14px"
                                  h="14px"
                                  borderRadius="full"
                                  border="1px solid"
                                  borderColor={
                                    rule.highlight_scope === "entire_row"
                                      ? "brand.500"
                                      : "gray.300"
                                  }
                                  bg="white"
                                  display="flex"
                                  alignItems="center"
                                  justifyContent="center"
                                  transition="border-color 0.2s"
                                >
                                  {rule.highlight_scope === "entire_row" && (
                                    <Box
                                      w="6px"
                                      h="6px"
                                      borderRadius="full"
                                      bg="brand.500"
                                    />
                                  )}
                                </Box>
                                <Text
                                  fontSize="xs"
                                  color="gray.700"
                                  fontWeight="medium"
                                >
                                  Entire Row
                                </Text>
                              </Flex>
                            </HStack>
                          </Field.Root>

                          {/* Live Preview Box */}
                          <Box
                            mt={1}
                            p={2}
                            borderRadius="sm"
                            border="1px solid"
                            borderColor="gray.200"
                            bg={getCssColor(ruleStyle.fill, "#FFFFFF")}
                            color={getCssColor(ruleStyle.font_color, "#000000")}
                            fontWeight={ruleStyle.bold ? "bold" : "normal"}
                            fontStyle={ruleStyle.italic ? "italic" : "normal"}
                            textAlign="center"
                            fontSize="xs"
                          >
                            Preview Text
                          </Box>
                        </VStack>
                      ) : (
                        <Flex
                          align="center"
                          justify="center"
                          h="100%"
                          pl={5}
                          borderLeft={{ base: "none", md: "1px solid" }}
                          borderColor="gray.200"
                        >
                          <Text
                            fontSize="xs"
                            color="gray.400"
                            fontStyle="italic"
                            textAlign="center"
                          >
                            Formatting is managed internally by the selected
                            visual scale.
                          </Text>
                        </Flex>
                      )}
                    </Grid>
                  </Box>
                );
              })}
            </VStack>
          )}
        </VStack>
      )}
    </Box>
  );
}
