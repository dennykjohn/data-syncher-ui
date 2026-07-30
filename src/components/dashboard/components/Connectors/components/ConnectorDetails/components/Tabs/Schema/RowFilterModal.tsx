import {
  type CSSProperties,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Box,
  Button,
  CloseButton,
  Dialog,
  Flex,
  IconButton,
  Input,
  NativeSelect,
  Portal,
  Skeleton,
  Text,
} from "@chakra-ui/react";

import { IoMdAdd, IoMdTrash } from "react-icons/io";

import useFetchTableFields from "@/queryOptions/connector/schema/useFetchTableFields";
import {
  type FilterCondition,
  type RowFilterConfig,
  type TableFieldInfo,
} from "@/types/connectors";

interface RowFilterModalProps {
  open: boolean;
  onClose: () => void;
  tableName: string;
  connectionId: number;
  initialRowFilter?: RowFilterConfig | null;
  onSave: (_config: RowFilterConfig | null) => Promise<void>;
  isSaving?: boolean;
  isInitialSyncDone?: boolean;
}

const FILTER_TYPE_BY_EDM_TYPE: Record<string, string | null> = {
  "Edm.String": "string",
  "Edm.Guid": "string",
  "Edm.Boolean": "boolean",
  "Edm.Decimal": "numeric",
  "Edm.Double": "numeric",
  "Edm.Single": "numeric",
  "Edm.Int16": "numeric",
  "Edm.Int32": "numeric",
  "Edm.Int64": "numeric",
  "Edm.Byte": "numeric",
  "Edm.SByte": "numeric",
  "Edm.DateTime": "datetime",
  "Edm.DateTimeOffset": "datetime",
  "Edm.Time": "time",
  "Edm.Binary": null,
};

const toCamelCase = (str: string): string => {
  if (!str) return "";
  const clean = str.startsWith("Edm.") ? str.slice(4) : str;
  return clean.charAt(0).toLowerCase() + clean.slice(1);
};

const getFieldType = (
  info: TableFieldInfo | string | null | undefined,
): "boolean" | "numeric" | "datetime" | "time" | "string" => {
  if (!info) return "string";
  if (typeof info === "object" && info.filter_type) return info.filter_type;
  const edmType = typeof info === "string" ? "" : info.edm_type || "";
  const mapped = FILTER_TYPE_BY_EDM_TYPE[edmType ?? ""];
  if (mapped !== undefined) {
    return (mapped || "string") as
      | "boolean"
      | "numeric"
      | "datetime"
      | "time"
      | "string";
  }

  // Fallback to old regex matching on data_type if edm_type is missing
  const typeStr = typeof info === "string" ? info : info.data_type || "string";
  const norm = typeStr.toLowerCase();
  if (norm.includes("boolean")) return "boolean";
  if (
    norm.includes("int") ||
    norm.includes("decimal") ||
    norm.includes("double") ||
    norm.includes("float") ||
    norm.includes("short") ||
    norm.includes("long") ||
    norm.includes("byte") ||
    norm.includes("number")
  ) {
    return "numeric";
  }
  if (
    norm.includes("date") ||
    norm.includes("time") ||
    norm.includes("instant")
  )
    return "datetime";
  return "string";
};

const getFieldDataType = (
  info: TableFieldInfo | string | null | undefined,
): string => {
  if (!info) return "unknown";
  if (typeof info === "object" && info.edm_type) {
    return toCamelCase(info.edm_type);
  }
  return typeof info === "string" ? info : info.data_type || "unknown";
};
const normalizeOperator = (op: string): string => {
  if (!op) return "eq";
  const norm = op.toLowerCase().trim();
  if (norm === "=") return "eq";
  if (norm === "!=") return "ne";
  if (norm === ">") return "gt";
  if (norm === "<") return "lt";
  if (norm === ">=") return "ge";
  if (norm === "<=") return "le";
  return norm;
};

const getOperatorsForType = (
  type: "boolean" | "numeric" | "datetime" | "time" | "string",
) => {
  switch (type) {
    case "boolean":
      return [
        { label: "Equal to (EQ)", value: "eq" },
        { label: "Not equal to (NE)", value: "ne" },
      ];
    case "numeric":
      return [
        { label: "Equal to (EQ)", value: "eq" },
        { label: "Not equal to (NE)", value: "ne" },
        { label: "In (IN)", value: "in" },
        { label: "Greater than (GT)", value: "gt" },
        { label: "Greater than or equal to (GE)", value: "ge" },
        { label: "Less than (LT)", value: "lt" },
        { label: "Less than or equal to (LE)", value: "le" },
      ];
    case "datetime":
    case "time":
      return [
        { label: "Equal to (EQ)", value: "eq" },
        { label: "Not equal to (NE)", value: "ne" },
        { label: "In (IN)", value: "in" },
        { label: "Greater than (GT)", value: "gt" },
        { label: "Greater than or equal to (GE)", value: "ge" },
        { label: "Less than (LT)", value: "lt" },
        { label: "Less than or equal to (LE)", value: "le" },
      ];
    case "string":
    default:
      return [
        { label: "Equal to (EQ)", value: "eq" },
        { label: "Not equal to (NE)", value: "ne" },
        { label: "In (IN)", value: "in" },
        { label: "Substring of (Substringof)", value: "substringof" },
        { label: "Starts with (Startswith)", value: "startswith" },
        { label: "Ends with (Endswith)", value: "endswith" },
      ];
  }
};
const ColumnSelect = ({
  value,
  onChange,
  fieldsList,
  disabled,
}: {
  value: string;
  onChange: (_val: string) => void;
  fieldsList: string[];
  disabled: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  const [dropdownStyle, setDropdownStyle] = useState<CSSProperties>({});

  useEffect(() => {
    setSearch(value);
  }, [value]);

  const updateDropdownPosition = () => {
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setDropdownStyle({
        position: "fixed",
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
        zIndex: 9999,
      });
    }
  };

  // Standard dropdown pattern: close on blur but allow onMouseDown to fire first (150ms delay)
  const handleBlur = () => {
    setTimeout(() => {
      setIsOpen(false);
      setSearch(value);
    }, 150);
  };

  const handleFocus = () => {
    updateDropdownPosition();
    setIsOpen(true);
  };

  // If the user hasn't typed a new search (search is just the current value), show all options
  const isSearchActive = search && search !== value;
  const filteredFields = fieldsList.filter(
    (col) =>
      !isSearchActive || col.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <Box position="relative" w="100%">
      <Input
        ref={inputRef}
        size="xs"
        placeholder="Select or search column..."
        value={search}
        disabled={disabled}
        onChange={(e) => {
          setSearch(e.target.value);
          updateDropdownPosition();
          setIsOpen(true);
        }}
        onFocus={handleFocus}
        onBlur={handleBlur}
      />
      {isOpen && !disabled && (
        <Box
          style={dropdownStyle}
          maxH="200px"
          overflowY="auto"
          bg="white"
          boxShadow="lg"
          borderWidth="1px"
          borderColor="gray.200"
          borderRadius="md"
        >
          {filteredFields.length > 0 ? (
            filteredFields.map((col) => {
              return (
                <Box
                  key={col}
                  px={3}
                  py={2}
                  fontSize="xs"
                  cursor="pointer"
                  userSelect="none"
                  _hover={{ bg: "brand.50" }}
                  // onMouseDown fires before onBlur, so selection happens before blur closes the dropdown
                  onMouseDown={() => {
                    onChange(col);
                    setSearch(col);
                    setIsOpen(false);
                  }}
                >
                  {col}
                </Box>
              );
            })
          ) : (
            <Box px={3} py={2} fontSize="xs" color="gray.500">
              No columns found
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};

const MultipleValueChips = ({
  values,
  onChange,
  disabled,
  type = "text",
  placeholder,
}: {
  values: string[];
  onChange: (_vals: string[]) => void;
  disabled: boolean;
  type?: string;
  placeholder?: string;
}) => {
  const [inputValue, setInputValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const handleAdd = (val: string) => {
    const trimmed = val.trim();
    if (trimmed && !values.includes(trimmed)) {
      onChange([...values, trimmed]);
    }
  };

  const handleRemove = (valToRemove: string) => {
    onChange(values.filter((v) => v !== valToRemove));
  };

  const isDateOrTimeType = ["date", "month", "datetime-local", "time"].includes(
    type,
  );
  const currentInputType = isDateOrTimeType
    ? inputValue || isFocused
      ? type
      : "text"
    : type;

  return (
    <Flex
      wrap="wrap"
      gap={1.5}
      align="center"
      borderWidth="1px"
      borderColor={disabled ? "gray.200" : "gray.200"}
      borderRadius="md"
      px={2}
      py={1}
      minH="32px"
      w="100%"
      bg={disabled ? "gray.50" : "white"}
      _focusWithin={{
        borderColor: "brand.500",
        boxShadow: "0 0 0 1px var(--chakra-colors-brand-500)",
      }}
    >
      {values.map((val) => (
        <Flex
          key={val}
          align="center"
          gap={1}
          bg={disabled ? "gray.200" : "brand.50"}
          color={disabled ? "gray.600" : "brand.800"}
          px={2.5}
          py={0.5}
          borderRadius="full"
          borderWidth="1px"
          borderColor={disabled ? "gray.300" : "brand.200"}
          fontSize="xs"
        >
          <Text fontSize="xs" fontWeight="semibold">
            {val}
          </Text>
          {!disabled && (
            <Text
              fontSize="xs"
              fontWeight="bold"
              cursor="pointer"
              onClick={(e) => {
                e.stopPropagation();
                handleRemove(val);
              }}
              _hover={{ color: "red.600" }}
              ml={1}
            >
              &times;
            </Text>
          )}
        </Flex>
      ))}
      {!disabled && (
        <Input
          variant="flushed"
          border="none"
          _focus={{ outline: "none", boxShadow: "none" }}
          size="xs"
          flex="1"
          minW="110px"
          type={currentInputType}
          disabled={disabled}
          placeholder={
            values.length === 0
              ? placeholder || "Type value and press Enter"
              : "Add value..."
          }
          value={inputValue}
          onChange={(e) => {
            const val = e.target.value;
            setInputValue(val);
            if (isDateOrTimeType && val) {
              handleAdd(val);
              setInputValue("");
            }
          }}
          onFocus={(e) => {
            setIsFocused(true);
            if (isDateOrTimeType) {
              try {
                e.target.showPicker();
              } catch {
                /* ignore */
              }
            }
          }}
          onBlur={() => {
            setIsFocused(false);
            if (inputValue.trim()) {
              handleAdd(inputValue);
              setInputValue("");
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (inputValue.trim()) {
                handleAdd(inputValue);
                setInputValue("");
              }
            } else if (
              e.key === "Backspace" &&
              inputValue === "" &&
              values.length > 0
            ) {
              handleRemove(values[values.length - 1]);
            }
          }}
          px={1}
          h="24px"
        />
      )}
    </Flex>
  );
};

const FlexibleDateTimePicker = ({
  disabled,
  filterRestriction,
  fieldInfo,
  mode,
  value,
  onChange,
  fromValue,
  toValue,
  onRangeChange,
  multipleValues,
  onMultipleChange,
  granularity,
  onGranularityChange,
}: {
  disabled: boolean;
  filterRestriction?: string | null;
  fieldInfo?: TableFieldInfo | null;
  mode: "exact" | "range" | "multiple";
  value: string;
  onChange: (_val: string) => void;
  fromValue: string;
  toValue: string;
  onRangeChange: (_from: string, _to: string) => void;
  multipleValues: string[];
  onMultipleChange: (_vals: string[]) => void;
  granularity: "year" | "month" | "date" | "datetime-local";
  onGranularityChange: (
    _g: "year" | "month" | "date" | "datetime-local",
  ) => void;
}) => {
  const dropYearGranularity =
    filterRestriction === "single-value" || filterRestriction === "multi-value";

  const isDateFormatWithZeroPrecision =
    fieldInfo &&
    typeof fieldInfo === "object" &&
    ((fieldInfo.display_format as string)?.toLowerCase() === "date" ||
      (fieldInfo.displayFormat as string)?.toLowerCase() === "date") &&
    (String(fieldInfo.precision) === "0" || fieldInfo.precision === 0);

  // Force Date/DateTime when single-value or multi-value (drop year / year & month range granularities)
  useEffect(() => {
    if (
      dropYearGranularity &&
      (granularity === "year" || granularity === "month")
    ) {
      onGranularityChange("date");
    }
  }, [dropYearGranularity, granularity, onGranularityChange]);

  useEffect(() => {
    if (isDateFormatWithZeroPrecision && granularity === "datetime-local") {
      onGranularityChange("date");
    }
  }, [isDateFormatWithZeroPrecision, granularity, onGranularityChange]);

  const DateInput = ({
    val,
    onValChange,
    placeholder,
  }: {
    val: string;
    onValChange: (_v: string) => void;
    placeholder: string;
  }) => {
    const [isFocused, setIsFocused] = useState(false);
    const currentType =
      granularity === "year"
        ? "number"
        : val || isFocused
          ? granularity
          : "text";

    return (
      <Input
        size="xs"
        type={currentType}
        placeholder={placeholder}
        min={granularity === "year" ? "1900" : undefined}
        max={granularity === "year" ? "2100" : undefined}
        value={val}
        disabled={disabled}
        onChange={(e) => onValChange(e.target.value)}
        onFocus={(e) => {
          setIsFocused(true);
          if (granularity !== "year") {
            if (e.target.type === "text") {
              e.target.type = granularity;
            }
            try {
              e.target.showPicker();
            } catch {
              /* ignore */
            }
          }
        }}
        onBlur={() => setIsFocused(false)}
        onClick={(e) => {
          if (granularity !== "year") {
            const el = e.currentTarget as HTMLInputElement;
            if (el.type === "text") {
              el.type = granularity;
            }
            try {
              el.showPicker();
            } catch {
              /* ignore */
            }
          }
        }}
        flex="1"
        cursor={granularity !== "year" ? "pointer" : "text"}
      />
    );
  };

  const getPlaceholder = (prefix = "Select") => {
    switch (granularity) {
      case "year":
        return "Enter year (YYYY)";
      case "month":
        return `${prefix} month & year`;
      case "date":
        return `${prefix} date`;
      case "datetime-local":
        return `${prefix} date & time`;
      default:
        return "";
    }
  };
  return (
    <Flex gap={2} w="100%" align="flex-start" wrap="wrap">
      {/* Precision Dropdown */}
      <Box minW="130px">
        <Text fontSize="2xs" fontWeight="bold" color="gray.500" mb={0}>
          PRECISION
        </Text>
        <NativeSelect.Root size="xs" disabled={disabled}>
          <NativeSelect.Field
            value={granularity}
            onChange={(e) => {
              onGranularityChange(
                e.target.value as "year" | "month" | "date" | "datetime-local",
              );
            }}
          >
            {!dropYearGranularity && <option value="year">Year Only</option>}
            {!dropYearGranularity && (
              <option value="month">Year & Month</option>
            )}
            <option value="date">Date</option>
            {!isDateFormatWithZeroPrecision && (
              <option value="datetime-local">Date & Time</option>
            )}
          </NativeSelect.Field>
          <NativeSelect.Indicator />
        </NativeSelect.Root>
      </Box>

      {/* Input controls based on Mode */}
      <Box flex="1" minW="200px">
        <Text fontSize="2xs" fontWeight="bold" color="gray.500" mb={0}>
          {mode === "range"
            ? "DATE RANGE"
            : mode === "multiple"
              ? "DATE VALUES"
              : "DATE VALUE"}
        </Text>
        {mode === "exact" && (
          <DateInput
            val={value}
            onValChange={onChange}
            placeholder={getPlaceholder()}
          />
        )}

        {mode === "range" && (
          <Flex gap={2} w="100%" align="center">
            <DateInput
              val={fromValue}
              onValChange={(v) => onRangeChange(v, toValue)}
              placeholder="From"
            />
            <Text fontSize="xs" color="gray.400" flexShrink={0}>
              to
            </Text>
            <DateInput
              val={toValue}
              onValChange={(v) => onRangeChange(fromValue, v)}
              placeholder="To"
            />
          </Flex>
        )}

        {mode === "multiple" && (
          <MultipleValueChips
            type={granularity === "year" ? "number" : granularity}
            values={multipleValues}
            onChange={onMultipleChange}
            disabled={disabled}
            placeholder={getPlaceholder("Add")}
          />
        )}
      </Box>
    </Flex>
  );
};

interface UICondition {
  id: string;
  column: string;
  mode: "exact" | "range" | "multiple";
  operator: string;
  value: string;
  fromValue: string;
  toValue: string;
  multipleValues: string[];
  granularity: "year" | "month" | "date" | "datetime-local";
  edm_type: string;
}

const FilterConditionEditor = ({
  condition,
  fieldsList,
  tableFields,
  onChange,
  isFieldsLoading,
  disabled = false,
}: {
  condition: UICondition;
  fieldsList: string[];
  tableFields: Record<string, TableFieldInfo | string>;
  onChange: (_updated: Partial<UICondition>) => void;
  isFieldsLoading: boolean;
  disabled?: boolean;
}) => {
  const fieldInfo = tableFields[condition.column];
  const restriction =
    typeof fieldInfo === "object" && fieldInfo !== null
      ? fieldInfo.filter_restriction
      : null;
  const columnType = isFieldsLoading
    ? "string"
    : getFieldType(fieldInfo || "string");
  const operators = getOperatorsForType(columnType);
  // Mode toggle only for numeric range (interval restriction)
  const showModeToggle = columnType === "numeric" && !restriction;
  const isComponentDisabled = disabled || isFieldsLoading;

  const handleColumnChange = (column: string) => {
    const info = tableFields[column];
    const edm_type =
      typeof info === "string"
        ? "Edm.String"
        : (info?.edm_type ?? "Edm.String");
    const colType = getFieldType(info || "string");
    const newRestriction =
      typeof info === "object" && info !== null
        ? info.filter_restriction
        : null;
    const defaultOp = getOperatorsForType(colType)[0].value;

    let defaultMode: "exact" | "range" | "multiple" = "exact";
    if (
      newRestriction === "interval-boundaries" ||
      newRestriction === "interval"
    ) {
      defaultMode = "range";
    } else if (newRestriction === "multi-value") {
      defaultMode = "multiple";
    }

    onChange({
      column,
      mode: defaultMode,
      operator:
        defaultMode === "exact"
          ? defaultOp
          : defaultMode === "range"
            ? "ge_le"
            : "in",
      value: "",
      fromValue: "",
      toValue: "",
      multipleValues: [],
      granularity: "date",
      edm_type,
    });
  };

  const handleModeChange = (mode: "exact" | "range" | "multiple") => {
    const colType = getFieldType(fieldInfo || "string");
    const defaultOp = getOperatorsForType(colType)[0].value;
    onChange({
      mode,
      operator:
        mode === "exact" ? defaultOp : mode === "range" ? "ge_le" : "in",
      value: "",
      fromValue: "",
      toValue: "",
      multipleValues: [],
    });
  };

  return (
    <Flex direction="column" gap={2} w="100%">
      {/* Row 1: Column + Operator */}
      <Flex gap={2} w="100%" wrap="wrap">
        <Box flex="2" minW="200px">
          <Text fontSize="2xs" fontWeight="bold" color="gray.500" mb={0}>
            COLUMN
          </Text>
          <ColumnSelect
            value={condition.column}
            onChange={handleColumnChange}
            fieldsList={fieldsList}
            disabled={isComponentDisabled}
          />
        </Box>
        <Box flex="1" minW="130px">
          <Text fontSize="2xs" fontWeight="bold" color="gray.500" mb={0}>
            OPERATOR
          </Text>
          {restriction !== "single-value" &&
          restriction !== "multi-value" &&
          condition.mode !== "range" ? (
            <NativeSelect.Root size="xs" disabled={isComponentDisabled}>
              <NativeSelect.Field
                value={condition.operator}
                onChange={(e) => {
                  const op = e.target.value;
                  if (op === "in") {
                    onChange({
                      operator: "in",
                      mode: "multiple",
                      value: "",
                      multipleValues: [],
                    });
                  } else {
                    onChange({
                      operator: op,
                      mode: "exact",
                      value: "",
                      multipleValues: [],
                    });
                  }
                }}
              >
                {condition.column === "" && (
                  <option value="">Select operator</option>
                )}
                {operators.map((op) => (
                  <option key={op.value} value={op.value}>
                    {op.label}
                  </option>
                ))}
              </NativeSelect.Field>
              <NativeSelect.Indicator />
            </NativeSelect.Root>
          ) : (
            <Input
              size="xs"
              disabled
              value={
                condition.mode === "range"
                  ? "Range (ge & le)"
                  : condition.mode === "multiple" ||
                      restriction === "multi-value"
                    ? "In (in)"
                    : restriction === "single-value"
                      ? "Equal to (eq)"
                      : ""
              }
            />
          )}
        </Box>
      </Flex>

      {/* Mode Selector (only if datetime and restriction not set) */}
      {showModeToggle && (
        <Box>
          <Text fontSize="2xs" fontWeight="bold" color="gray.500" mb={0}>
            FILTER MODE
          </Text>
          <Flex
            display="inline-flex"
            bg="gray.100"
            p={0.5}
            borderRadius="md"
            borderWidth="1px"
            borderColor="gray.200"
          >
            <Button
              disabled={isComponentDisabled}
              size="2xs"
              variant={condition.mode === "exact" ? "solid" : "ghost"}
              onClick={() => handleModeChange("exact")}
              borderRadius="sm"
              fontSize="2xs"
              h="22px"
              px={2.5}
              bg={condition.mode === "exact" ? "white" : "transparent"}
              color={condition.mode === "exact" ? "brand.800" : "gray.600"}
              boxShadow={condition.mode === "exact" ? "sm" : "none"}
              _hover={{ bg: condition.mode === "exact" ? "white" : "gray.200" }}
            >
              Exact Match
            </Button>
            <Button
              disabled={isComponentDisabled}
              size="2xs"
              variant={condition.mode === "range" ? "solid" : "ghost"}
              onClick={() => handleModeChange("range")}
              borderRadius="sm"
              fontSize="2xs"
              h="22px"
              px={2.5}
              bg={condition.mode === "range" ? "white" : "transparent"}
              color={condition.mode === "range" ? "brand.800" : "gray.600"}
              boxShadow={condition.mode === "range" ? "sm" : "none"}
              _hover={{ bg: condition.mode === "range" ? "white" : "gray.200" }}
            >
              Range
            </Button>
            <Button
              disabled={isComponentDisabled}
              size="2xs"
              variant={condition.mode === "multiple" ? "solid" : "ghost"}
              onClick={() => handleModeChange("multiple")}
              borderRadius="sm"
              fontSize="2xs"
              h="22px"
              px={2.5}
              bg={condition.mode === "multiple" ? "white" : "transparent"}
              color={condition.mode === "multiple" ? "brand.800" : "gray.600"}
              boxShadow={condition.mode === "multiple" ? "sm" : "none"}
              _hover={{
                bg: condition.mode === "multiple" ? "white" : "gray.200",
              }}
            >
              Multiple Values
            </Button>
          </Flex>
        </Box>
      )}

      {/* Row 3: Values Inputs */}
      {condition.operator !== "isnull" &&
        condition.operator !== "isnotnull" && (
          <Box w="100%">
            {columnType === "boolean" ? (
              <Box maxW="200px">
                <Text fontSize="2xs" fontWeight="bold" color="gray.500" mb={0}>
                  BOOLEAN VALUE
                </Text>
                <NativeSelect.Root size="xs" disabled={isComponentDisabled}>
                  <NativeSelect.Field
                    value={condition.value}
                    onChange={(e) => onChange({ value: e.target.value })}
                  >
                    <option value="">Select boolean value</option>
                    <option value="true">True</option>
                    <option value="false">False</option>
                  </NativeSelect.Field>
                  <NativeSelect.Indicator />
                </NativeSelect.Root>
              </Box>
            ) : columnType === "numeric" ? (
              condition.mode === "range" ? (
                <Box>
                  <Text
                    fontSize="2xs"
                    fontWeight="bold"
                    color="gray.500"
                    mb={0}
                  >
                    NUMERIC RANGE
                  </Text>
                  <Flex gap={2} w="100%" align="center">
                    <Input
                      flex="1"
                      size="xs"
                      type="number"
                      step="any"
                      placeholder="From"
                      value={condition.fromValue}
                      onChange={(e) => onChange({ fromValue: e.target.value })}
                      disabled={isComponentDisabled}
                    />
                    <Text fontSize="xs" color="gray.400" flexShrink={0}>
                      to
                    </Text>
                    <Input
                      flex="1"
                      size="xs"
                      type="number"
                      step="any"
                      placeholder="To"
                      value={condition.toValue}
                      onChange={(e) => onChange({ toValue: e.target.value })}
                      disabled={isComponentDisabled}
                    />
                  </Flex>
                </Box>
              ) : condition.mode === "multiple" ? (
                <Box>
                  <Text
                    fontSize="2xs"
                    fontWeight="bold"
                    color="gray.500"
                    mb={0}
                  >
                    NUMERIC VALUES
                  </Text>
                  <MultipleValueChips
                    type="number"
                    values={condition.multipleValues}
                    onChange={(vals) => onChange({ multipleValues: vals })}
                    disabled={isComponentDisabled}
                  />
                </Box>
              ) : (
                <Box>
                  <Text
                    fontSize="2xs"
                    fontWeight="bold"
                    color="gray.500"
                    mb={0}
                  >
                    NUMERIC VALUE
                  </Text>
                  <Input
                    size="xs"
                    type="number"
                    step="any"
                    disabled={isComponentDisabled}
                    placeholder="Define the number you want to filter by."
                    value={condition.value}
                    onChange={(e) => onChange({ value: e.target.value })}
                  />
                </Box>
              )
            ) : columnType === "datetime" ? (
              <FlexibleDateTimePicker
                disabled={isComponentDisabled}
                filterRestriction={restriction}
                fieldInfo={typeof fieldInfo === "object" ? fieldInfo : null}
                mode={condition.mode}
                value={condition.value}
                onChange={(val) => onChange({ value: val })}
                fromValue={condition.fromValue}
                toValue={condition.toValue}
                onRangeChange={(from, to) =>
                  onChange({ fromValue: from, toValue: to })
                }
                multipleValues={condition.multipleValues}
                onMultipleChange={(vals) => onChange({ multipleValues: vals })}
                granularity={condition.granularity || "date"}
                onGranularityChange={(g) => onChange({ granularity: g })}
              />
            ) : columnType === "time" ? (
              condition.operator === "in" ? (
                <Box>
                  <Text
                    fontSize="2xs"
                    fontWeight="bold"
                    color="gray.500"
                    mb={0}
                  >
                    TIME VALUES
                  </Text>
                  <MultipleValueChips
                    type="time"
                    values={condition.multipleValues}
                    onChange={(vals) => onChange({ multipleValues: vals })}
                    disabled={isComponentDisabled}
                  />
                </Box>
              ) : (
                <Box>
                  <Text
                    fontSize="2xs"
                    fontWeight="bold"
                    color="gray.500"
                    mb={0}
                  >
                    TIME VALUE
                  </Text>
                  <Input
                    size="xs"
                    type="time"
                    disabled={isComponentDisabled}
                    placeholder="Select time"
                    value={condition.value}
                    onChange={(e) => onChange({ value: e.target.value })}
                  />
                </Box>
              )
            ) : condition.mode === "multiple" ? (
              <Box>
                <Text fontSize="2xs" fontWeight="bold" color="gray.500" mb={0}>
                  STRING VALUES
                </Text>
                <MultipleValueChips
                  type="text"
                  values={condition.multipleValues}
                  onChange={(vals) => onChange({ multipleValues: vals })}
                  disabled={isComponentDisabled}
                />
              </Box>
            ) : (
              <Box>
                <Text fontSize="2xs" fontWeight="bold" color="gray.500" mb={0}>
                  STRING VALUE
                </Text>
                <Input
                  size="xs"
                  type="text"
                  disabled={isComponentDisabled}
                  placeholder={
                    condition.operator === "IN"
                      ? "value1, value2, ..."
                      : "Define the string to filter by"
                  }
                  value={condition.value}
                  onChange={(e) => onChange({ value: e.target.value })}
                />
              </Box>
            )}
          </Box>
        )}
    </Flex>
  );
};
const parseBackendToUI = (
  backendConds: FilterCondition[],
  tableFields: Record<string, TableFieldInfo | string>,
): UICondition[] => {
  const uiConds: UICondition[] = [];
  let i = 0;
  while (i < backendConds.length) {
    const current = backendConds[i];
    const col = current.column;
    const info = (tableFields as Record<string, Record<string, unknown>>)[col];
    const restriction =
      typeof info === "object" && info !== null
        ? (info.filter_restriction as string)
        : null;
    const colType = getFieldType(info || "string");

    const detectGranularity = (
      val: string,
    ): "year" | "month" | "date" | "datetime-local" => {
      if (!val) return "date";
      if (val.length === 4) return "year";
      if (val.length === 7 && val.includes("-")) return "month";
      if (val.length === 10 && val.includes("-")) return "date";
      if (val.includes("T")) return "datetime-local";
      return "date";
    };

    // Check for interval-boundaries (range)
    if (
      (restriction === "interval-boundaries" ||
        restriction === "interval" ||
        colType === "datetime" ||
        colType === "numeric") &&
      i + 1 < backendConds.length &&
      backendConds[i + 1].column === col &&
      (current.operator === "ge" || current.operator === "gt") &&
      (backendConds[i + 1].operator === "le" ||
        backendConds[i + 1].operator === "lt")
    ) {
      const next = backendConds[i + 1];
      uiConds.push({
        id: Math.random().toString(36).substring(2, 9),
        column: col,
        mode: "range",
        operator: "ge_le",
        value: "",
        fromValue: current.value as string,
        toValue: next.value as string,
        multipleValues: [],
        granularity: detectGranularity(current.value as string),
        edm_type: current.edm_type || "",
      });
      i += 2;
      continue;
    }

    // Check for multi-value grouping
    if (current.operator === "eq") {
      const group: string[] = [current.value as string];
      let j = i + 1;
      while (
        j < backendConds.length &&
        backendConds[j].column === col &&
        backendConds[j].operator === "eq"
      ) {
        group.push(backendConds[j].value as string);
        j++;
      }
      if (restriction === "multi-value" || group.length > 1) {
        uiConds.push({
          id: Math.random().toString(36).substring(2, 9),
          column: col,
          mode: "multiple",
          operator: "in",
          value: "",
          fromValue: "",
          toValue: "",
          multipleValues: group,
          granularity: detectGranularity(current.value as string),
          edm_type: current.edm_type || "",
        });
        i = j;
        continue;
      }
    }

    // Check for "in" operator
    if (current.operator === "in") {
      const valuesList = Array.isArray(current.value)
        ? current.value.map((s) => String(s).trim()).filter(Boolean)
        : current.value
          ? String(current.value)
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : [];
      uiConds.push({
        id: Math.random().toString(36).substring(2, 9),
        column: col,
        mode: "multiple",
        operator: "in",
        value: "",
        fromValue: "",
        toValue: "",
        multipleValues: valuesList,
        granularity: detectGranularity(valuesList[0] || ""),
        edm_type: current.edm_type || "",
      });
      i++;
      continue;
    }
    // Default to exact single value
    const isIntervalBoundaries =
      restriction === "interval-boundaries" || restriction === "interval";
    const isMultiValue = restriction === "multi-value";
    uiConds.push({
      id: Math.random().toString(36).substring(2, 9),
      column: col,
      mode: isIntervalBoundaries
        ? "range"
        : isMultiValue
          ? "multiple"
          : "exact",
      operator: normalizeOperator(current.operator),
      value: current.value as string,
      fromValue: isIntervalBoundaries ? (current.value as string) : "",
      toValue: "",
      multipleValues: isMultiValue ? [current.value as string] : [],
      granularity: detectGranularity(current.value as string),
      edm_type: current.edm_type || "",
    });
    i++;
  }
  return uiConds;
};

const serializeUIToBackend = (
  uiConds: UICondition[],
  tableFields: Record<string, TableFieldInfo | string>,
): FilterCondition[] => {
  const backendConds: FilterCondition[] = [];
  for (const c of uiConds) {
    if (!c.column) continue;
    const fieldInfo = tableFields[c.column];
    const edm_type =
      c.edm_type ||
      (typeof fieldInfo === "string"
        ? "Edm.String"
        : (fieldInfo?.edm_type ?? "Edm.String"));

    if (c.mode === "exact") {
      backendConds.push({
        column: c.column,
        operator: normalizeOperator(c.operator),
        value:
          c.operator === "isnull" || c.operator === "isnotnull"
            ? ""
            : String(c.value),
        edm_type,
      });
    } else if (c.mode === "range") {
      backendConds.push({
        column: c.column,
        operator: "ge",
        value: String(c.fromValue),
        edm_type,
      });
      backendConds.push({
        column: c.column,
        operator: "le",
        value: String(c.toValue),
        edm_type,
      });
    } else if (c.mode === "multiple") {
      backendConds.push({
        column: c.column,
        operator: "in",
        value: c.multipleValues,
        edm_type,
      });
    }
  }
  return backendConds;
};

const RowFilterModal = ({
  open,
  onClose,
  tableName,
  connectionId,
  initialRowFilter,
  onSave,
  isSaving = false,
  isInitialSyncDone = false,
}: RowFilterModalProps) => {
  const { data: fieldsData, isLoading: isFieldsLoading } = useFetchTableFields(
    connectionId,
    tableName,
    open,
  );

  const tableFields = useMemo(
    () =>
      fieldsData?.table_fields ??
      ({} as Record<string, TableFieldInfo | string>),
    [fieldsData?.table_fields],
  );

  const [activeSyncTable, setActiveSyncTable] = useState<string | null>(null);

  const [conditions, setConditions] = useState<UICondition[]>([]);

  const [expandedIndices, setExpandedIndices] = useState<
    Record<number, boolean>
  >({});

  if (open && !isFieldsLoading && activeSyncTable !== tableName) {
    setActiveSyncTable(tableName);

    const fieldsDataAny = fieldsData as Record<string, unknown> | undefined;
    const activeFilter =
      initialRowFilter !== undefined
        ? initialRowFilter
        : (fieldsDataAny?.row_filter_config as RowFilterConfig | undefined) ||
          (fieldsDataAny?.row_filter as RowFilterConfig | undefined);
    if (activeFilter?.conditions) {
      const loaded = parseBackendToUI(activeFilter.conditions, tableFields);
      setConditions(loaded);

      const initialExpanded: Record<number, boolean> = {};
      loaded.forEach((_, idx: number) => {
        initialExpanded[idx] = false; // Collapsed by default
      });
      setExpandedIndices(initialExpanded);
    } else {
      setConditions([]);
      setExpandedIndices({});
    }
  } else if (!open && activeSyncTable !== null) {
    setActiveSyncTable(null);
  }

  const handleAddCondition = () => {
    const newIdx = conditions.length;
    setConditions((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).substring(2, 9),
        column: "",
        mode: "exact",
        operator: "",
        value: "",
        fromValue: "",
        toValue: "",
        multipleValues: [],
        granularity: "date",
        edm_type: "",
      },
    ]);
    setExpandedIndices((prev) => ({ ...prev, [newIdx]: true })); // Expand newly added condition
  };

  const handleRemoveCondition = (index: number) => {
    setConditions((prev) => prev.filter((_, i) => i !== index));
    setExpandedIndices((prev) => {
      const next = { ...prev };
      delete next[index];
      // Shift indices after the deleted one
      const shifted: Record<number, boolean> = {};
      Object.entries(next).forEach(([key, val]) => {
        const k = Number(key);
        if (k > index) {
          shifted[k - 1] = val;
        } else {
          shifted[k] = val;
        }
      });
      return shifted;
    });
  };

  const handleUpdateCondition = (
    index: number,
    updated: Partial<UICondition>,
  ) => {
    setConditions((prev) =>
      prev.map((cond, i) => (i === index ? { ...cond, ...updated } : cond)),
    );
  };

  const toggleExpand = (index: number) => {
    setExpandedIndices((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const handleClearAll = () => {
    setConditions([]);
    setExpandedIndices({});
    onSave(null);
  };

  const handleSave = () => {
    // Validate: filter out empty conditions only if column/operator is missing
    const validConditions = conditions.filter((c) => {
      if (!c.column) return false;
      if (c.mode === "exact") {
        return !!c.operator;
      }
      return true;
    });

    if (validConditions.length === 0) {
      onSave(null);
    } else {
      const serialized = serializeUIToBackend(validConditions, tableFields);
      onSave({ conditions: serialized });
    }
  };

  const isSaveDisabled = conditions.some((c) => {
    if (!c.column) return true;
    if (c.mode === "exact") {
      if (c.operator === "isnull" || c.operator === "isnotnull") return false;
      return !c.value;
    }
    if (c.mode === "range") {
      return !c.fromValue || !c.toValue;
    }
    if (c.mode === "multiple") {
      return c.multipleValues.length === 0;
    }
    return false;
  });

  const fieldsList = Object.keys(tableFields)
    .filter((col) => {
      const info = tableFields[col];
      const isFilterable =
        typeof info === "object" &&
        info !== null &&
        info.filterable !== undefined
          ? info.filterable
          : true;
      if (!isFilterable) {
        return false;
      }
      const edmType = typeof info === "string" ? null : (info.edm_type ?? null);
      if (edmType && FILTER_TYPE_BY_EDM_TYPE[edmType] === null) {
        return false;
      }
      return true;
    })
    .sort();

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
                <Box>
                  <Dialog.Title
                    color="brand.800"
                    fontWeight="bold"
                    fontSize="lg"
                  >
                    Edit filter
                  </Dialog.Title>
                  {isInitialSyncDone ? (
                    <Text fontSize="xs" color="orange.600" fontWeight="medium">
                      Initial sync completed. Filter configuration is locked and
                      cannot be modified.
                    </Text>
                  ) : (
                    <Text fontSize="xs" color="gray.500">
                      Define filter expressions to identify which rows are
                      included in your sync.
                    </Text>
                  )}
                </Box>
                <CloseButton onClick={onClose} size="sm" />
              </Flex>
            </Dialog.Header>

            <Dialog.Body
              p={2.5}
              overflowY="auto"
              display="flex"
              flexDirection="column"
              gap={1.5}
            >
              {conditions.map((condition, index) => {
                const isExpanded = expandedIndices[index] ?? false;
                const fieldInfo = tableFields[condition.column];
                const columnType = isFieldsLoading
                  ? "string"
                  : getFieldType(fieldInfo || "string");
                const operators = getOperatorsForType(columnType);

                return (
                  <Box key={condition.id || index} width="100%">
                    {index > 0 && (
                      <Flex justify="center" my={1}>
                        <Box
                          px={2}
                          py={0.5}
                          bg="gray.100"
                          borderRadius="md"
                          borderWidth="1px"
                          borderColor="gray.200"
                        >
                          <Text
                            fontSize="xs"
                            fontWeight="bold"
                            color="gray.600"
                          >
                            AND
                          </Text>
                        </Box>
                      </Flex>
                    )}

                    <Box
                      borderWidth="1px"
                      borderColor={isExpanded ? "brand.200" : "gray.200"}
                      borderRadius="lg"
                      bg={isExpanded ? "brand.50/10" : "gray.50/50"}
                      p={2}
                      transition="all 0.2s"
                    >
                      <Flex
                        justify="space-between"
                        align="center"
                        mb={isExpanded ? 1.5 : 0}
                      >
                        <Text fontSize="sm" fontWeight="bold" color="gray.700">
                          Condition {index + 1}
                        </Text>
                        <Flex gap={1} align="center">
                          {isExpanded ? (
                            <CloseButton
                              size="xs"
                              onClick={() => toggleExpand(index)}
                              disabled={isFieldsLoading}
                            />
                          ) : (
                            <Button
                              size="xs"
                              variant="ghost"
                              onClick={() => toggleExpand(index)}
                              color="brand.600"
                              _hover={{ bg: "brand.50" }}
                            >
                              Show details
                            </Button>
                          )}
                          <IconButton
                            size="xs"
                            variant="ghost"
                            colorPalette="red"
                            aria-label="Delete condition"
                            onClick={() => handleRemoveCondition(index)}
                            disabled={isInitialSyncDone}
                          >
                            <IoMdTrash size={14} />
                          </IconButton>
                        </Flex>
                      </Flex>

                      {!isExpanded ? (
                        <Flex gap={1.5} mt={1} wrap="wrap" align="center">
                          <Box
                            bg="gray.100"
                            px={2}
                            py={0.5}
                            borderRadius="md"
                            borderWidth="1px"
                            borderColor="gray.200"
                          >
                            <Text
                              fontSize="xs"
                              color="gray.700"
                              fontWeight="medium"
                            >
                              Column:{" "}
                              <strong>
                                {condition.column || "none"} (
                                {isFieldsLoading
                                  ? condition.edm_type
                                    ? toCamelCase(condition.edm_type)
                                    : "loading..."
                                  : getFieldDataType(
                                      tableFields[condition.column],
                                    )}
                                )
                              </strong>
                            </Text>
                          </Box>
                          <Box
                            bg="gray.100"
                            px={2}
                            py={0.5}
                            borderRadius="md"
                            borderWidth="1px"
                            borderColor="gray.200"
                          >
                            <Text
                              fontSize="xs"
                              color="gray.700"
                              fontWeight="medium"
                            >
                              {condition.mode === "range"
                                ? "Range"
                                : condition.mode === "multiple"
                                  ? "In"
                                  : operators.find(
                                      (op) => op.value === condition.operator,
                                    )?.label ||
                                    condition.operator ||
                                    "none"}
                            </Text>
                          </Box>
                          {condition.operator !== "isnull" &&
                            condition.operator !== "isnotnull" && (
                              <Box
                                bg="gray.100"
                                px={2}
                                py={0.5}
                                borderRadius="md"
                                borderWidth="1px"
                                borderColor="gray.200"
                              >
                                <Text
                                  fontSize="xs"
                                  color="gray.700"
                                  fontWeight="semibold"
                                >
                                  {condition.mode === "range"
                                    ? `"${condition.fromValue || ""}" to "${condition.toValue || ""}"`
                                    : condition.mode === "multiple"
                                      ? `[${condition.multipleValues.join(", ")}]`
                                      : `"${condition.value}"`}
                                </Text>
                              </Box>
                            )}
                        </Flex>
                      ) : (
                        <FilterConditionEditor
                          condition={condition}
                          fieldsList={fieldsList}
                          tableFields={tableFields}
                          onChange={(updated) =>
                            handleUpdateCondition(index, updated)
                          }
                          isFieldsLoading={isFieldsLoading}
                          disabled={isInitialSyncDone}
                        />
                      )}
                    </Box>
                  </Box>
                );
              })}

              {isFieldsLoading && conditions.length === 0 ? (
                <Flex direction="column" gap={2} py={3}>
                  <Skeleton height="28px" borderRadius="md" />
                  <Skeleton height="60px" borderRadius="md" />
                </Flex>
              ) : (
                <>
                  {!isFieldsLoading &&
                    fieldsList.length === 0 &&
                    conditions.length === 0 && (
                      <Text fontSize="xs" color="orange.500" mb={2}>
                        No filterable columns found. You may not be able to
                        create a valid filter.
                      </Text>
                    )}
                  <Button
                    size="xs"
                    variant="outline"
                    colorPalette="brand"
                    onClick={handleAddCondition}
                    mt={1}
                    alignSelf="flex-start"
                    gap={1}
                    disabled={isFieldsLoading || isInitialSyncDone}
                  >
                    <IoMdAdd /> Add condition
                  </Button>
                </>
              )}
            </Dialog.Body>

            <Dialog.Footer
              bg="gray.50"
              borderTopWidth="1px"
              borderColor="gray.200"
              p={2}
              display="flex"
              justifyContent="space-between"
              alignItems="center"
            >
              <Button
                size="xs"
                variant="ghost"
                colorPalette="red"
                onClick={handleClearAll}
                disabled={conditions.length === 0 || isInitialSyncDone}
              >
                Delete filter
              </Button>
              <Flex gap={2}>
                <Button size="xs" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  size="xs"
                  colorPalette="brand"
                  onClick={handleSave}
                  loading={isSaving}
                  disabled={isSaveDisabled || isInitialSyncDone}
                >
                  Save
                </Button>
              </Flex>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
};

export default RowFilterModal;
