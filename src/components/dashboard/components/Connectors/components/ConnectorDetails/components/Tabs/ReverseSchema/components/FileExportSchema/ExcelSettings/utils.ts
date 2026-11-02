import {
  type ExcelConditionalFormat,
  type ExcelDifferentialStyle,
} from "@/types/connectors";

import {
  type ColumnDataType,
  generateMultipleConditionsFormula,
} from "./components/MultipleConditionsRule";

export const getCssColor = (
  hex: string | undefined,
  defaultColor: string,
): string => {
  if (!hex) return defaultColor;
  const clean = hex.trim();
  if (clean.startsWith("#")) return clean;
  if (/^[0-9A-Fa-f]{3,6}$/.test(clean)) return `#${clean}`;
  return clean;
};

export const getCssAlignItems = (val?: string) => {
  if (val === "top") return "flex-start";
  if (val === "bottom") return "flex-end";
  return "center";
};

export const normalizeRuleType = (type: string | undefined): string => {
  if (!type) return "";
  return type.toLowerCase().replace(/[^a-z0-9]/g, "");
};

export const isRuleTypeAllowed = (
  ruleType: string,
  colDataType: ColumnDataType,
): boolean => {
  const norm = ruleType.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (norm === "multipleconditions") {
    return true;
  }
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

export const cleanRulePayload = (
  rule: ExcelConditionalFormat,
  colNames?: string[] | unknown,
  tableFields?: Record<string, string> | unknown,
): ExcelConditionalFormat => {
  const safeColNames = Array.isArray(colNames) ? colNames : undefined;
  const safeTableFields =
    tableFields &&
    typeof tableFields === "object" &&
    !Array.isArray(tableFields)
      ? (tableFields as Record<string, string>)
      : undefined;
  const typeNorm = normalizeRuleType(rule.type);

  const base: ExcelConditionalFormat = {
    type: typeNorm,
  };

  const colVal =
    rule.target_columns && rule.target_columns.length > 0
      ? rule.target_columns.join(",")
      : rule.column_name || "";

  if (rule.range !== undefined && rule.range !== null && rule.range !== "") {
    base.range = rule.range;
  } else {
    base.column_name = colVal;
  }

  if (rule.target_columns && rule.target_columns.length > 0) {
    base.target_columns = rule.target_columns;
  }

  if (rule.condition_column_name) {
    base.condition_column_name = rule.condition_column_name;
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

    case "multipleconditions": {
      base.type = "multipleconditions";
      base.highlight_scope = rule.highlight_scope || "entire_row";
      base.target_columns = Array.isArray(rule.target_columns)
        ? rule.target_columns
        : [];
      base.column_name = base.target_columns[0] || "";
      const cleanedConds = (rule.conditions || []).map((c, i) => ({
        ...(i > 0
          ? {
              logic: c.logic === "or" ? ("or" as const) : ("and" as const),
            }
          : {}),
        column: c.column || "",
        operator: c.operator || "equal",
        value: c.value ?? "",
        ...(c.value2 !== undefined ? { value2: c.value2 } : {}),
      }));
      base.conditions = cleanedConds;
      const validForFormula = cleanedConds.filter((c) => c.column);
      base.formula = generateMultipleConditionsFormula(
        validForFormula,
        safeColNames,
        safeTableFields,
      );
      base.style = cleanStyle(rule.style);
      break;
    }

    default:
      base.style = cleanStyle(rule.style);
      break;
  }

  return base;
};
