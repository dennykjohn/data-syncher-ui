import { useEffect, useRef, useState } from "react";

import {
  Box,
  Button,
  Checkbox,
  Flex,
  HStack,
  IconButton,
  Input,
  NativeSelect,
  Text,
  VStack,
} from "@chakra-ui/react";

import { IoMdAdd, IoMdClose } from "react-icons/io";
import {
  MdFilterList,
  MdKeyboardArrowDown,
  MdKeyboardArrowUp,
  MdSearch,
} from "react-icons/md";

import { type ExcelConditionItem } from "@/types/connectors";

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

export const getColumnLetter = (index: number): string => {
  let letter = "";
  let temp = index;
  while (temp >= 0) {
    letter = String.fromCharCode((temp % 26) + 65) + letter;
    temp = Math.floor(temp / 26) - 1;
  }
  return letter;
};

interface MultipleConditionsRuleProps {
  conditions: ExcelConditionItem[] | undefined;
  targetColumns: string[] | undefined;
  highlightScope?:
    | "cell"
    | "entire_row"
    | "entire_column"
    | "selected_columns"
    | string;
  colNames: string[];
  tableFields?: Record<string, string>;
  onUpdateConditions: (_newConditions: ExcelConditionItem[]) => void;
  onUpdateTargetColumns: (_columns: string[]) => void;
  onUpdateHighlightScope: (
    _scope:
      | "cell"
      | "entire_row"
      | "entire_column"
      | "selected_columns"
      | string,
  ) => void;
}

export const MULTIPLE_CONDITION_OPERATORS = [
  { value: "equal", label: "= Equal to" },
  { value: "notEqual", label: "!= Not equal to" },
  { value: "greaterThan", label: "> Greater than" },
  { value: "lessThan", label: "< Less than" },
  { value: "greaterThanOrEqual", label: ">= Greater or equal" },
  { value: "lessThanOrEqual", label: "<= Less or equal" },
  { value: "contains", label: "Contains text" },
  { value: "notContains", label: "Does not contain" },
  { value: "beginsWith", label: "Begins with" },
  { value: "notBeginsWith", label: "Does not begin with" },
  { value: "endsWith", label: "Ends with" },
  { value: "notEndsWith", label: "Does not end with" },
  { value: "between", label: "Between" },
  { value: "notBetween", label: "Not between" },
  { value: "isEmpty", label: "Is empty" },
  { value: "isNotEmpty", label: "Is not empty" },
];

export const BOOLEAN_OPERATORS = [
  { value: "equal", label: "= Equal to" },
  { value: "notEqual", label: "!= Not equal to" },
  { value: "isEmpty", label: "Is empty" },
  { value: "isNotEmpty", label: "Is not empty" },
];

export const TEXT_OPERATORS = [
  { value: "equal", label: "= Equal to" },
  { value: "notEqual", label: "!= Not equal to" },
  { value: "contains", label: "Contains text" },
  { value: "notContains", label: "Does not contain" },
  { value: "beginsWith", label: "Begins with" },
  { value: "notBeginsWith", label: "Does not begin with" },
  { value: "endsWith", label: "Ends with" },
  { value: "notEndsWith", label: "Does not end with" },
  { value: "isEmpty", label: "Is empty" },
  { value: "isNotEmpty", label: "Is not empty" },
];

export const NUMERIC_OPERATORS = [
  { value: "equal", label: "= Equal to" },
  { value: "notEqual", label: "!= Not equal to" },
  { value: "greaterThan", label: "> Greater than" },
  { value: "lessThan", label: "< Less than" },
  { value: "greaterThanOrEqual", label: ">= Greater or equal" },
  { value: "lessThanOrEqual", label: "<= Less or equal" },
  { value: "between", label: "Between" },
  { value: "notBetween", label: "Not between" },
  { value: "isEmpty", label: "Is empty" },
  { value: "isNotEmpty", label: "Is not empty" },
];

export const DATETIME_OPERATORS = [
  { value: "equal", label: "= Equal to" },
  { value: "notEqual", label: "!= Not equal to" },
  { value: "greaterThan", label: "> After" },
  { value: "lessThan", label: "< Before" },
  { value: "greaterThanOrEqual", label: ">= On or after" },
  { value: "lessThanOrEqual", label: "<= On or before" },
  { value: "between", label: "Between" },
  { value: "notBetween", label: "Not between" },
  { value: "isEmpty", label: "Is empty" },
  { value: "isNotEmpty", label: "Is not empty" },
];

export const getOperatorsForColumn = (
  rawType: string | undefined,
): Array<{ value: string; label: string }> => {
  if (!rawType) return MULTIPLE_CONDITION_OPERATORS;
  const dataType = getColumnDataType(rawType);
  switch (dataType) {
    case "boolean":
      return BOOLEAN_OPERATORS;
    case "text":
      return TEXT_OPERATORS;
    case "numeric":
      return NUMERIC_OPERATORS;
    case "datetime":
      return DATETIME_OPERATORS;
    default:
      return MULTIPLE_CONDITION_OPERATORS;
  }
};

export const LOGIC_OPTIONS: Array<{
  value: "and" | "or";
  label: string;
}> = [
  { value: "and", label: "AND" },
  { value: "or", label: "OR" },
];

// Helper to format a single Excel formula clause
const formatExcelClause = (
  c: ExcelConditionItem,
  colNames?: string[],
  tableFields?: Record<string, string>,
): string => {
  let colId = c.column;
  if (colNames && colNames.length > 0) {
    const idx = colNames.indexOf(c.column);
    if (idx !== -1) {
      colId = getColumnLetter(idx);
    }
  }
  const colRef = `$${colId}2`;
  const val = (c.value ?? "").trim();
  const rawType = c.column ? tableFields?.[c.column] : undefined;
  const dataType = getColumnDataType(rawType);
  const isBool =
    dataType === "boolean" ||
    val.toUpperCase() === "TRUE" ||
    val.toUpperCase() === "FALSE";
  const isNum =
    dataType === "numeric"
      ? !isNaN(Number(val)) && val !== ""
      : !isNaN(Number(val)) && val !== "" && !val.includes(" ");

  const formattedVal = isBool
    ? val.toUpperCase()
    : isNum
      ? val
      : `"${val.replace(/"/g, '""')}"`;

  let clause = "";
  switch (c.operator) {
    case "notEqual":
      clause = `${colRef}<>${formattedVal}`;
      break;
    case "greaterThan":
      clause = `${colRef}>${formattedVal}`;
      break;
    case "lessThan":
      clause = `${colRef}<${formattedVal}`;
      break;
    case "greaterThanOrEqual":
      clause = `${colRef}>=${formattedVal}`;
      break;
    case "lessThanOrEqual":
      clause = `${colRef}<=${formattedVal}`;
      break;
    case "contains":
      clause = `ISNUMBER(SEARCH(${formattedVal},${colRef}))`;
      break;
    case "notContains":
      clause = `ISERROR(SEARCH(${formattedVal},${colRef}))`;
      break;
    case "beginsWith":
      clause = `LEFT(${colRef},LEN(${formattedVal}))=${formattedVal}`;
      break;
    case "notBeginsWith":
      clause = `LEFT(${colRef},LEN(${formattedVal}))<>${formattedVal}`;
      break;
    case "endsWith":
      clause = `RIGHT(${colRef},LEN(${formattedVal}))=${formattedVal}`;
      break;
    case "notEndsWith":
      clause = `RIGHT(${colRef},LEN(${formattedVal}))<>${formattedVal}`;
      break;
    case "isEmpty":
      clause = `ISBLANK(${colRef})`;
      break;
    case "isNotEmpty":
      clause = `NOT(ISBLANK(${colRef}))`;
      break;
    case "between": {
      const val2 = (c.value2 ?? "").trim();
      const isNum2 = !isNaN(Number(val2)) && val2 !== "";
      const formattedVal2 = isNum2 ? val2 : `"${val2.replace(/"/g, '""')}"`;
      clause = `AND(${colRef}>=${formattedVal},${colRef}<=${formattedVal2})`;
      break;
    }
    case "notBetween": {
      const val2 = (c.value2 ?? "").trim();
      const isNum2 = !isNaN(Number(val2)) && val2 !== "";
      const formattedVal2 = isNum2 ? val2 : `"${val2.replace(/"/g, '""')}"`;
      clause = `OR(${colRef}<${formattedVal},${colRef}>${formattedVal2})`;
      break;
    }
    case "equal":
    default:
      clause = `${colRef}=${formattedVal}`;
      break;
  }

  if (c.logic === "and_not" || c.logic === "or_not") {
    return `NOT(${clause})`;
  }
  return clause;
};

// Generates valid Excel OpenXML Formula
export const generateMultipleConditionsFormula = (
  conditions: ExcelConditionItem[],
  colNames?: string[],
  tableFields?: Record<string, string>,
): string => {
  if (!conditions || conditions.length === 0) return "";
  const valid = conditions.filter((c) => c.column);
  if (valid.length === 0) return "";
  if (valid.length === 1)
    return `=${formatExcelClause(valid[0], colNames, tableFields)}`;

  // Group by OR segments: a series of ANDs forms a group, and OR separates groups
  const orGroups: string[][] = [];
  let currentAndGroup: string[] = [
    formatExcelClause(valid[0], colNames, tableFields),
  ];

  for (let i = 1; i < valid.length; i++) {
    const item = valid[i];
    const clause = formatExcelClause(item, colNames, tableFields);
    if (item.logic === "or" || item.logic === "or_not") {
      orGroups.push(currentAndGroup);
      currentAndGroup = [clause];
    } else {
      currentAndGroup.push(clause);
    }
  }
  orGroups.push(currentAndGroup);

  if (orGroups.length === 1) {
    const ands = orGroups[0];
    return ands.length === 1 ? `=${ands[0]}` : `=AND(${ands.join(",")})`;
  }

  const orParts = orGroups.map((group) => {
    return group.length === 1 ? group[0] : `AND(${group.join(",")})`;
  });

  return `=OR(${orParts.join(",")})`;
};

// Generates human-friendly preview
export const formatHumanSummary = (
  conditions: ExcelConditionItem[],
  targetColumns: string[],
  highlightScope?: string,
  tableFields?: Record<string, string>,
): string => {
  const valid = (conditions || []).filter((c) => c.column);
  if (valid.length === 0) return "";

  const condText = valid
    .map((c, idx) => {
      let prefix = "";
      if (idx > 0) {
        if (c.logic === "or") prefix = " OR ";
        else if (c.logic === "and_not") prefix = " AND NOT ";
        else if (c.logic === "or_not") prefix = " OR NOT ";
        else prefix = " AND ";
      }

      const rawType = c.column ? tableFields?.[c.column] : undefined;
      const dataType = getColumnDataType(rawType);
      const isDatetime = dataType === "datetime";

      if (c.operator === "isEmpty") return `${prefix}${c.column} is empty`;
      if (c.operator === "isNotEmpty")
        return `${prefix}${c.column} is not empty`;
      if (c.operator === "between")
        return `${prefix}${c.column} between ${c.value || "?"} and ${c.value2 || "?"}`;
      if (c.operator === "notBetween")
        return `${prefix}${c.column} not between ${c.value || "?"} and ${c.value2 || "?"}`;

      let op = "=";
      if (c.operator === "notEqual") op = "!=";
      if (c.operator === "greaterThan") op = isDatetime ? "is after" : ">";
      if (c.operator === "lessThan") op = isDatetime ? "is before" : "<";
      if (c.operator === "greaterThanOrEqual")
        op = isDatetime ? "is on or after" : ">=";
      if (c.operator === "lessThanOrEqual")
        op = isDatetime ? "is on or before" : "<=";
      if (c.operator === "contains") op = "contains";
      if (c.operator === "notContains") op = "does not contain";
      if (c.operator === "beginsWith") op = "starts with";
      if (c.operator === "notBeginsWith") op = "does not start with";
      if (c.operator === "endsWith") op = "ends with";
      if (c.operator === "notEndsWith") op = "does not end with";

      return `${prefix}${c.column} ${op} "${c.value || ""}"`;
    })
    .join("");

  const targetText =
    highlightScope === "selected_columns" &&
    targetColumns &&
    targetColumns.length > 0
      ? `[${targetColumns.join(", ")}]`
      : "Entire Row";

  return `If (${condText}) ➜ Highlight ${targetText}`;
};

// Searchable Field Selector Component
function SearchableFieldSelect({
  value,
  colNames = [],
  onChange,
}: {
  value: string;
  colNames: string[];
  onChange: (_col: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const filtered = (colNames || []).filter((c) =>
    c.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <Box position="relative" ref={popoverRef} flex="1.3" minWidth="135px">
      <Button
        type="button"
        size="xs"
        variant="outline"
        width="100%"
        justifyContent="space-between"
        onClick={() => setIsOpen(!isOpen)}
        bg="white"
        h="28px"
        px={2.5}
        fontSize="xs"
        fontWeight="normal"
        borderColor="gray.200"
        _hover={{ borderColor: "gray.300", bg: "gray.50" }}
      >
        <Text fontSize="xs" color={value ? "gray.800" : "gray.400"} truncate>
          {value || "-- Select Field --"}
        </Text>
        <Text fontSize="9px" color="gray.400" ml={1}>
          {isOpen ? "▲" : "▼"}
        </Text>
      </Button>

      {isOpen && (
        <Box
          position="absolute"
          bottom="calc(100% + 4px)"
          left="0"
          zIndex={1000}
          bg="white"
          shadow="xl"
          border="1px solid"
          borderColor="gray.200"
          borderRadius="md"
          p={2}
          w="100%"
          minW="210px"
          maxW="290px"
        >
          <HStack gap={1} mb={1.5}>
            <Box color="gray.400" fontSize="13px" pl={0.5}>
              <MdSearch />
            </Box>
            <Input
              size="xs"
              placeholder="Search fields..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              h="26px"
              fontSize="xs"
              autoFocus
            />
          </HStack>
          <Box
            display="flex"
            flexDirection="column"
            gap="2px"
            maxH="175px"
            overflowY="auto"
            pr={0.5}
          >
            <Box
              minH="29px"
              px={2.5}
              py={1}
              display="flex"
              alignItems="center"
              borderRadius="sm"
              cursor="pointer"
              _hover={{ bg: "gray.100" }}
              onMouseDown={(e) => {
                e.preventDefault();
                onChange("");
                setIsOpen(false);
                setSearch("");
              }}
              onClick={() => {
                onChange("");
                setIsOpen(false);
                setSearch("");
              }}
            >
              <Text
                as="span"
                m={0}
                p={0}
                fontSize="xs"
                color="gray.400"
                fontStyle="italic"
                lineHeight="normal"
              >
                -- Select Field --
              </Text>
            </Box>
            {filtered.map((c) => (
              <Box
                key={c}
                minH="29px"
                px={2.5}
                py={1}
                display="flex"
                alignItems="center"
                borderRadius="sm"
                cursor="pointer"
                bg={c === value ? "brand.50" : "transparent"}
                _hover={{ bg: c === value ? "brand.100" : "gray.50" }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  onChange(c);
                  setIsOpen(false);
                  setSearch("");
                }}
                onClick={() => {
                  onChange(c);
                  setIsOpen(false);
                  setSearch("");
                }}
              >
                <Text
                  as="span"
                  m={0}
                  p={0}
                  fontSize="xs"
                  fontWeight={c === value ? "semibold" : "normal"}
                  color={c === value ? "brand.700" : "gray.800"}
                  truncate
                  lineHeight="normal"
                >
                  {c}
                </Text>
              </Box>
            ))}
            {filtered.length === 0 && (
              <Box px={2} py={2.5} textAlign="center">
                <Text as="span" m={0} p={0} fontSize="2xs" color="gray.400">
                  {(colNames || []).length === 0
                    ? "No columns available"
                    : "No matching fields"}
                </Text>
              </Box>
            )}
          </Box>
        </Box>
      )}
    </Box>
  );
}

export default function MultipleConditionsRule({
  conditions = [],
  targetColumns = [],
  highlightScope = "entire_row",
  colNames,
  tableFields = {},
  onUpdateConditions,
  onUpdateTargetColumns,
  onUpdateHighlightScope,
}: MultipleConditionsRuleProps) {
  const [isColumnDropdownOpen, setIsColumnDropdownOpen] = useState(false);
  const [colSearchQuery, setColSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Click outside to close chosen columns dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsColumnDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Ensure there is at least one condition initialized without any default column selected
  const safeConditions: ExcelConditionItem[] =
    conditions && conditions.length > 0
      ? conditions
      : [
          {
            column: "",
            operator: "equal",
            value: "",
          },
        ];

  useEffect(() => {
    if (!conditions || conditions.length === 0) {
      onUpdateConditions([
        {
          column: "",
          operator: "equal",
          value: "",
        },
      ]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleConditionChange = (
    index: number,
    patch: Partial<ExcelConditionItem>,
  ) => {
    const next = [...safeConditions];
    next[index] = { ...next[index], ...patch };
    onUpdateConditions(next);
  };

  const handleAddCondition = () => {
    const next: ExcelConditionItem[] = [
      ...safeConditions,
      {
        logic: "and",
        column: "",
        operator: "equal",
        value: "",
      },
    ];
    onUpdateConditions(next);
  };

  const handleRemoveCondition = (index: number) => {
    if (safeConditions.length <= 1) {
      onUpdateConditions([
        {
          column: "",
          operator: "equal",
          value: "",
        },
      ]);
      return;
    }
    const next = safeConditions.filter((_, i) => i !== index);
    if (next.length > 0 && next[0]?.logic) {
      delete next[0].logic;
    }
    onUpdateConditions(next);
  };

  const handleMoveCondition = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= safeConditions.length) return;
    const next = [...safeConditions];
    const temp = next[index];
    next[index] = next[targetIndex];
    next[targetIndex] = temp;
    if (next[0]?.logic) delete next[0].logic;
    if (next[1] && !next[1].logic) next[1].logic = "and";
    onUpdateConditions(next);
  };

  const handleToggleColumn = (col: string) => {
    const current = new Set(targetColumns);
    if (current.has(col)) {
      current.delete(col);
    } else {
      current.add(col);
    }
    onUpdateTargetColumns(Array.from(current));
  };

  const handleSelectAllColumns = () => {
    onUpdateTargetColumns([...colNames]);
  };

  const handleClearColumns = () => {
    onUpdateTargetColumns([]);
  };

  const filteredCols = colNames.filter((col) =>
    col.toLowerCase().includes(colSearchQuery.toLowerCase()),
  );

  const summary = formatHumanSummary(
    safeConditions,
    targetColumns,
    highlightScope,
    tableFields,
  );

  const isScopeSelectedColumns = highlightScope === "selected_columns";

  return (
    <VStack align="stretch" gap={2.5} width="100%">
      {/* 1. Conditions Section (Choose Conditions First) */}
      <VStack align="stretch" gap={1.5}>
        <Flex justify="space-between" align="center">
          <HStack gap={1.5}>
            <Text fontSize="xs" fontWeight="bold" color="gray.700">
              Conditions
            </Text>
            <Box
              as="span"
              fontSize="10px"
              fontWeight="semibold"
              px={1.5}
              py={0.2}
              borderRadius="full"
              bg="gray.100"
              color="gray.600"
            >
              {safeConditions.length}
            </Box>
          </HStack>
          <HStack gap={1}>
            {safeConditions.length > 2 && (
              <Button
                type="button"
                size="2xs"
                variant="ghost"
                colorPalette="gray"
                onClick={() =>
                  onUpdateConditions([
                    {
                      column: "",
                      operator: "equal",
                      value: "",
                    },
                  ])
                }
                fontSize="xs"
                h="22px"
                px={2}
              >
                Clear All
              </Button>
            )}
            <Button
              type="button"
              size="2xs"
              variant="ghost"
              colorPalette="brand"
              onClick={handleAddCondition}
              fontSize="xs"
              h="22px"
              px={2}
            >
              <IoMdAdd /> Add Condition
            </Button>
          </HStack>
        </Flex>

        {/* List of conditions */}
        <Box display="flex" flexDirection="column" gap={1.5}>
          {safeConditions.map((cond, idx) => {
            const colRawType = cond.column
              ? tableFields?.[cond.column]
              : undefined;
            const colDataType = getColumnDataType(colRawType);
            const availableOperators = getOperatorsForColumn(colRawType);

            const isBetween =
              cond.operator === "between" || cond.operator === "notBetween";
            const isEmptyOrNot = ["isEmpty", "isNotEmpty"].includes(
              cond.operator,
            );
            const currentLogic = cond.logic || "and";

            return (
              <Flex
                key={idx}
                align="center"
                gap={1.5}
                p={1.5}
                bg="white"
                borderRadius="md"
                border="1px solid"
                borderColor="gray.200"
                _hover={{ borderColor: "gray.300" }}
              >
                {/* Logic Connector: Row 1 shows sequence badge #1; Row 2+ shows sleek AND / OR selector */}
                {idx === 0 ? (
                  <Flex
                    align="center"
                    justify="center"
                    w="64px"
                    minW="64px"
                    h="28px"
                    borderRadius="xs"
                    bg="gray.50"
                    border="1px solid"
                    borderColor="gray.200"
                    color="gray.600"
                    fontSize="xs"
                    fontWeight="bold"
                    flexShrink={0}
                  >
                    #1
                  </Flex>
                ) : (
                  <NativeSelect.Root
                    size="xs"
                    width="64px"
                    minWidth="64px"
                    flexShrink={0}
                  >
                    <NativeSelect.Field
                      bg="gray.50"
                      fontSize="xs"
                      fontWeight="bold"
                      color={currentLogic === "or" ? "purple.700" : "brand.700"}
                      h="28px"
                      px={1.5}
                      value={currentLogic === "or" ? "or" : "and"}
                      onChange={(e) =>
                        handleConditionChange(idx, {
                          logic: e.target.value as "and" | "or",
                        })
                      }
                    >
                      <option value="and">AND</option>
                      <option value="or">OR</option>
                    </NativeSelect.Field>
                    <NativeSelect.Indicator />
                  </NativeSelect.Root>
                )}

                {/* Searchable Field Selector (Only user-selected & ordered fields) */}
                <SearchableFieldSelect
                  value={cond.column}
                  colNames={colNames}
                  onChange={(selectedCol) => {
                    const nextRawType = selectedCol
                      ? tableFields?.[selectedCol]
                      : undefined;
                    const nextDataType = getColumnDataType(nextRawType);
                    const allowedOps = getOperatorsForColumn(nextRawType);
                    const isCurrentOpAllowed = allowedOps.some(
                      (op) => op.value === cond.operator,
                    );
                    const nextOp = isCurrentOpAllowed
                      ? cond.operator
                      : allowedOps[0]?.value || "equal";

                    let nextVal = cond.value;
                    if (
                      nextDataType === "boolean" &&
                      nextVal !== "TRUE" &&
                      nextVal !== "FALSE"
                    ) {
                      nextVal = "TRUE";
                    }

                    handleConditionChange(idx, {
                      column: selectedCol,
                      operator: nextOp,
                      value: nextVal,
                    });
                  }}
                />

                {/* Operator selector */}
                <NativeSelect.Root size="xs" width="135px" minWidth="120px">
                  <NativeSelect.Field
                    bg="white"
                    fontSize="xs"
                    h="28px"
                    value={cond.operator}
                    onChange={(e) =>
                      handleConditionChange(idx, {
                        operator: e.target.value,
                      })
                    }
                  >
                    {availableOperators.map((op) => (
                      <option key={op.value} value={op.value}>
                        {op.label}
                      </option>
                    ))}
                  </NativeSelect.Field>
                  <NativeSelect.Indicator />
                </NativeSelect.Root>

                {/* Value Input(s) */}
                {isEmptyOrNot ? (
                  <Box
                    flex="1"
                    minWidth="70px"
                    h="28px"
                    bg="gray.50"
                    borderRadius="xs"
                    display="flex"
                    alignItems="center"
                    px={2}
                  >
                    <Text fontSize="xs" color="gray.400" fontStyle="italic">
                      (no value)
                    </Text>
                  </Box>
                ) : colDataType === "boolean" ? (
                  <NativeSelect.Root size="xs" flex="1" minWidth="80px">
                    <NativeSelect.Field
                      bg="white"
                      fontSize="xs"
                      h="28px"
                      value={cond.value || "TRUE"}
                      onChange={(e) =>
                        handleConditionChange(idx, { value: e.target.value })
                      }
                    >
                      <option value="TRUE">True (TRUE)</option>
                      <option value="FALSE">False (FALSE)</option>
                    </NativeSelect.Field>
                    <NativeSelect.Indicator />
                  </NativeSelect.Root>
                ) : isBetween ? (
                  <HStack gap={1} flex="1" minWidth="90px">
                    <Input
                      size="xs"
                      h="28px"
                      fontSize="xs"
                      placeholder="Min"
                      type={colDataType === "numeric" ? "number" : "text"}
                      step={colDataType === "numeric" ? "any" : undefined}
                      value={cond.value ?? ""}
                      onChange={(e) =>
                        handleConditionChange(idx, {
                          value: e.target.value,
                        })
                      }
                    />
                    <Input
                      size="xs"
                      h="28px"
                      fontSize="xs"
                      placeholder="Max"
                      type={colDataType === "numeric" ? "number" : "text"}
                      step={colDataType === "numeric" ? "any" : undefined}
                      value={cond.value2 ?? ""}
                      onChange={(e) =>
                        handleConditionChange(idx, {
                          value2: e.target.value,
                        })
                      }
                    />
                  </HStack>
                ) : (
                  <Input
                    size="xs"
                    flex="1"
                    minWidth="70px"
                    h="28px"
                    fontSize="xs"
                    placeholder={
                      colDataType === "numeric"
                        ? "Number"
                        : colDataType === "datetime"
                          ? "YYYY-MM-DD"
                          : "Value"
                    }
                    type={colDataType === "numeric" ? "number" : "text"}
                    step={colDataType === "numeric" ? "any" : undefined}
                    value={cond.value ?? ""}
                    onChange={(e) =>
                      handleConditionChange(idx, { value: e.target.value })
                    }
                  />
                )}

                {/* Reorder Up / Down Buttons (Shown when 2 or more conditions exist) */}
                {safeConditions.length > 1 && (
                  <HStack gap={0.5} flexShrink={0}>
                    <IconButton
                      aria-label="Move condition up"
                      size="2xs"
                      variant="ghost"
                      colorPalette="gray"
                      disabled={idx === 0}
                      onClick={() => handleMoveCondition(idx, "up")}
                      h="22px"
                      w="18px"
                      minW="18px"
                      title="Move condition up"
                    >
                      <MdKeyboardArrowUp fontSize="14px" />
                    </IconButton>
                    <IconButton
                      aria-label="Move condition down"
                      size="2xs"
                      variant="ghost"
                      colorPalette="gray"
                      disabled={idx === safeConditions.length - 1}
                      onClick={() => handleMoveCondition(idx, "down")}
                      h="22px"
                      w="18px"
                      minW="18px"
                      title="Move condition down"
                    >
                      <MdKeyboardArrowDown fontSize="14px" />
                    </IconButton>
                  </HStack>
                )}

                {/* Delete condition button */}
                <IconButton
                  aria-label="Remove condition"
                  size="xs"
                  variant="ghost"
                  colorPalette="red"
                  onClick={() => handleRemoveCondition(idx)}
                  disabled={safeConditions.length <= 1}
                  h="22px"
                  w="22px"
                  minW="22px"
                  title="Remove condition"
                >
                  <IoMdClose fontSize="14px" />
                </IconButton>
              </Flex>
            );
          })}
        </Box>
      </VStack>

      {/* 2. Target Scope Selection Bar (In the end - Choose which columns to highlight) */}
      <Box
        p={2.5}
        bg="white"
        borderRadius="md"
        border="1px solid"
        borderColor="gray.200"
      >
        <Flex
          justify="space-between"
          align="center"
          mb={isScopeSelectedColumns ? 2 : 0}
        >
          <Text fontSize="xs" fontWeight="bold" color="gray.700">
            Apply Highlight To:
          </Text>
          <HStack gap={3}>
            {/* Entire Row Option (Default) */}
            <Flex
              align="center"
              gap={1.5}
              cursor="pointer"
              onClick={() => onUpdateHighlightScope("entire_row")}
            >
              <Box
                w="13px"
                h="13px"
                borderRadius="full"
                border="1.5px solid"
                borderColor={!isScopeSelectedColumns ? "brand.500" : "gray.300"}
                bg="white"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                {!isScopeSelectedColumns && (
                  <Box w="5px" h="5px" borderRadius="full" bg="brand.500" />
                )}
              </Box>
              <Text fontSize="xs" color="gray.700" fontWeight="medium">
                Entire Row
              </Text>
            </Flex>

            {/* Chosen Columns Option */}
            <Flex
              align="center"
              gap={1.5}
              cursor="pointer"
              onClick={() => onUpdateHighlightScope("selected_columns")}
            >
              <Box
                w="13px"
                h="13px"
                borderRadius="full"
                border="1.5px solid"
                borderColor={isScopeSelectedColumns ? "brand.500" : "gray.300"}
                bg="white"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                {isScopeSelectedColumns && (
                  <Box w="5px" h="5px" borderRadius="full" bg="brand.500" />
                )}
              </Box>
              <Text fontSize="xs" color="gray.700" fontWeight="medium">
                Chosen Columns
              </Text>
            </Flex>
          </HStack>
        </Flex>

        {/* Column Multi-Select Picker (Shown ONLY when Chosen Columns is selected) */}
        {isScopeSelectedColumns && (
          <Box position="relative" ref={dropdownRef} mt={1.5}>
            <Button
              size="xs"
              variant="outline"
              width="100%"
              justifyContent="space-between"
              onClick={() => setIsColumnDropdownOpen(!isColumnDropdownOpen)}
              bg="gray.50"
              fontSize="xs"
              fontWeight="normal"
              h="28px"
              px={2.5}
            >
              <HStack gap={1.5} overflow="hidden">
                <Box color="brand.600" fontSize="13px">
                  <MdFilterList />
                </Box>
                <Text
                  fontSize="xs"
                  color={targetColumns.length === 0 ? "gray.400" : "gray.800"}
                  truncate
                >
                  {targetColumns.length === 0
                    ? "Select columns to highlight..."
                    : `${targetColumns.length} Selected: ${targetColumns.join(", ")}`}
                </Text>
              </HStack>
              <Text fontSize="9px" color="gray.400">
                {isColumnDropdownOpen ? "▲" : "▼"}
              </Text>
            </Button>

            {/* Popover Checklist */}
            {isColumnDropdownOpen && (
              <Box
                position="absolute"
                bottom="calc(100% + 4px)"
                left="0"
                zIndex={1000}
                bg="white"
                shadow="xl"
                border="1px solid"
                borderColor="gray.200"
                borderRadius="md"
                p={2}
                w="100%"
                minW="220px"
              >
                {/* Search & Actions */}
                <HStack gap={1} mb={1.5}>
                  <Box color="gray.400" fontSize="13px" pl={0.5}>
                    <MdSearch />
                  </Box>
                  <Input
                    size="xs"
                    placeholder="Search columns..."
                    value={colSearchQuery}
                    onChange={(e) => setColSearchQuery(e.target.value)}
                    height="24px"
                    fontSize="xs"
                  />
                </HStack>
                <Flex justify="space-between" mb={1} px={0.5}>
                  <Text
                    fontSize="xs"
                    color="brand.600"
                    cursor="pointer"
                    fontWeight="semibold"
                    onClick={handleSelectAllColumns}
                  >
                    Select All
                  </Text>
                  <Text
                    fontSize="xs"
                    color="gray.500"
                    cursor="pointer"
                    fontWeight="semibold"
                    onClick={handleClearColumns}
                  >
                    Clear All
                  </Text>
                </Flex>

                {/* Column Checklist items */}
                <Box
                  display="flex"
                  flexDirection="column"
                  gap="2px"
                  maxH="150px"
                  overflowY="auto"
                  pr={0.5}
                >
                  {filteredCols.map((col) => {
                    const isChecked = targetColumns.includes(col);
                    return (
                      <Flex
                        key={col}
                        minH="29px"
                        align="center"
                        gap={2}
                        px={2}
                        py={1}
                        borderRadius="sm"
                        _hover={{ bg: "gray.50" }}
                        cursor="pointer"
                        onClick={() => handleToggleColumn(col)}
                      >
                        <Checkbox.Root
                          size="xs"
                          colorPalette="brand"
                          checked={isChecked}
                          pointerEvents="none"
                        >
                          <Checkbox.HiddenInput />
                          <Checkbox.Control />
                        </Checkbox.Root>
                        <Text
                          as="span"
                          m={0}
                          p={0}
                          fontSize="xs"
                          color="gray.700"
                          truncate
                          userSelect="none"
                          lineHeight="normal"
                        >
                          {col}
                        </Text>
                      </Flex>
                    );
                  })}
                  {filteredCols.length === 0 && (
                    <Box px={2} py={2.5} textAlign="center">
                      <Text
                        as="span"
                        m={0}
                        p={0}
                        fontSize="2xs"
                        color="gray.400"
                      >
                        No matching columns
                      </Text>
                    </Box>
                  )}
                </Box>
              </Box>
            )}
          </Box>
        )}
      </Box>

      {/* 3. Human Readable Summary (Only when valid conditions exist) */}
      {summary && (
        <Box
          p={2}
          bg="blue.50"
          border="1px solid"
          borderColor="blue.200"
          borderRadius="md"
        >
          <Text
            fontSize="xs"
            color="blue.800"
            fontWeight="medium"
            lineHeight="short"
          >
            {summary}
          </Text>
        </Box>
      )}
    </VStack>
  );
}
