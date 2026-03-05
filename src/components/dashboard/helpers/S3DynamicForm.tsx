import React, {
  startTransition,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Box,
  Button,
  Checkbox,
  Dialog,
  Field,
  Flex,
  Input,
  Portal,
  Select,
  Text,
  Textarea,
  VStack,
  createListCollection,
} from "@chakra-ui/react";

import { IoMdArrowBack } from "react-icons/io";
import { MdDelete, MdOutlineSave } from "react-icons/md";

import MultipleMapping from "@/components/dashboard/components/Connectors/components/NewConnector/components/SingleMapping/MultipleMapping";
import SingleMapping, {
  Mapping,
} from "@/components/dashboard/components/Connectors/components/NewConnector/components/SingleMapping/SingleMapping";
import { PasswordInput } from "@/components/ui/password-input";
import { toaster } from "@/components/ui/toaster";

export interface S3FieldSchema {
  name: string;
  label: string;
  type: "CharField" | "ChoiceField" | "TextField" | "IntegerField";
  required: boolean;
  widget?: "PasswordInput" | "Checkbox" | null;
  is_visible?: boolean;
  choices?: Array<{
    value: string;
    display: string;
    description?: string;
  }>;
  depend_on?: string | null;
  dependency_value?: string | null;
  description?: string;
  placeholder?: string;
  default_value?: string;
  read_only?: boolean;
}

interface S3DynamicFormProps {
  schema: S3FieldSchema[];
  onSubmit: (_values: Record<string, unknown>) => void;
  loading?: boolean;
  defaultValues?: Record<string, unknown>;
  handleBackButtonClick?: () => void;
  mode?: "create" | "edit";
  destinationName?: string;
  sourceName?: string;
  hideSubmitButton?: boolean;
  leftButtons?: React.ReactNode;
  rightButtons?: React.ReactNode;
  onValuesChange?: (_values: Record<string, unknown>) => void;
  connectionId?: number;
}

// Fields that should always be hidden - these will NEVER be shown
const HIDDEN_FIELDS = [
  "custom_primary",
  "custom_primary_key",
  "single_file_table_mapping",
  "table_to_files_mapping",
  "multi_files_table_name",
  "multi_files_prefix",
];

const SCHEMA_VALIDATION_MESSAGE =
  "Invalid schema name. Schema name shouldn't be empty, should contain only letters, numbers, or underscores, and cannot begin with a number.";

const validateSchemaName = (value: string): string => {
  const trimmed = value.trim();
  const schemaRegex = /^[A-Za-z_][A-Za-z0-9_]*$/;
  return schemaRegex.test(trimmed) ? "" : SCHEMA_VALIDATION_MESSAGE;
};

const S3DynamicForm: React.FC<S3DynamicFormProps> = ({
  schema,
  onSubmit,
  defaultValues,
  loading,
  handleBackButtonClick,
  mode,
  destinationName: _destinationName,
  sourceName: _sourceName,
  hideSubmitButton = false,
  leftButtons,
  rightButtons,
  onValuesChange,
  connectionId,
}) => {
  // Initialize form values from schema and defaultValues
  const initialValues = useMemo(() => {
    const initial = schema.reduce(
      (acc, field) => {
        const val = defaultValues?.[field.name];
        let finalizedValue = "";

        if (val !== undefined && val !== null) {
          finalizedValue =
            typeof val === "object" ? JSON.stringify(val) : String(val);
        } else {
          finalizedValue = field.default_value ?? "";
        }

        return {
          ...acc,
          [field.name]: finalizedValue,
        };
      },
      {} as Record<string, string>,
    );

    // Also include hidden fields from defaultValues
    HIDDEN_FIELDS.forEach((fieldName) => {
      const val = defaultValues?.[fieldName];
      if (val !== undefined && val !== null) {
        initial[fieldName] =
          typeof val === "object" ? JSON.stringify(val) : String(val);
      }
    });

    return initial;
  }, [schema, defaultValues]);

  const [values, setValues] = useState<Record<string, string>>(
    () => initialValues,
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isMappingModalOpen, setIsMappingModalOpen] = useState(false);

  const valuesRef = useRef(values);
  const defaultValuesSerializedRef = useRef<string | null>(
    defaultValues ? JSON.stringify(defaultValues) : null,
  );
  const isDirtyRef = useRef(false);

  useEffect(() => {
    valuesRef.current = values;
    onValuesChange?.(values);
  }, [values, onValuesChange]);

  useEffect(() => {
    if (!defaultValues) return;

    const incoming = JSON.stringify(defaultValues);
    if (incoming === defaultValuesSerializedRef.current) return;
    defaultValuesSerializedRef.current = incoming;

    if (isDirtyRef.current) return;

    startTransition(() => {
      setValues((prev) => {
        const updated = { ...prev };
        schema.forEach((field) => {
          const val = defaultValues[field.name];
          // Priority: defaultValues > existing value > default_value from schema
          if (val !== undefined && val !== null) {
            updated[field.name] =
              typeof val === "object" ? JSON.stringify(val) : String(val);
          } else if (updated[field.name] === undefined) {
            updated[field.name] = field.default_value ?? "";
          }
        });
        HIDDEN_FIELDS.forEach((fieldName) => {
          const val = defaultValues[fieldName];
          if (val !== undefined && val !== null) {
            updated[fieldName] =
              typeof val === "object" ? JSON.stringify(val) : String(val);
          }
        });
        return updated;
      });
    });
  }, [defaultValues, schema]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;

    // Check if field is read-only
    const fieldSchema = schema.find((f) => f.name === name);
    if (mode === "edit" && fieldSchema?.read_only === true) {
      console.warn(`Attempted to change read-only field: ${name}`);
      return;
    }

    // Mark the form as dirty so the defaultValues effect doesn't overwrite
    // the user's in-progress edits during a background refetch.
    isDirtyRef.current = true;

    const currentVals = valuesRef.current;

    // Check if a mapping actually has data (ignore empty stringified JSON from backend)
    const hasAnyMapping = (vals: Record<string, string>) => {
      const isPresent = (v?: string) => v && v !== "[]" && v !== "{}";
      return (
        isPresent(vals.single_file_table_mapping) ||
        isPresent(vals.table_to_files_mapping)
      );
    };

    const mappingsExist = hasAnyMapping(currentVals);

    let clearedReason:
      | "base_folder_path"
      | "include_subfolders"
      | "file_type"
      | "s3_bucket"
      | null = null;

    if (
      name === "base_folder_path" &&
      value !== currentVals.base_folder_path &&
      mappingsExist
    ) {
      clearedReason = "base_folder_path";
    } else if (
      name === "include_subfolders" &&
      value !== currentVals.include_subfolders &&
      mappingsExist
    ) {
      clearedReason = "include_subfolders";
    } else if (
      name === "file_type" &&
      value !== currentVals.file_type &&
      mappingsExist
    ) {
      clearedReason = "file_type";
    } else if (
      name === "s3_bucket" &&
      value !== currentVals.s3_bucket &&
      mappingsExist
    ) {
      clearedReason = "s3_bucket";
    }

    setValues((prev) => {
      let newValues = { ...prev, [name]: value };
      if (clearedReason === "base_folder_path") {
        newValues = {
          ...newValues,
          mapping_config: "",
          mapping_id: "",
          mappings: "",
          single_file_table_mapping: "",
          table_to_files_mapping: "",
          multi_files_table_name: "",
          multi_files_prefix: "",
        };
      }

      if (clearedReason === "include_subfolders") {
        newValues = {
          ...newValues,
          mapping_config: "",
          mapping_id: "",
          mappings: "",
          single_file_table_mapping: "",
          table_to_files_mapping: "",
          multi_files_table_name: "",
          multi_files_prefix: "",
        };
      }

      if (clearedReason === "file_type") {
        newValues = {
          ...newValues,
          mapping_config: "",
          mapping_id: "",
          mappings: "",
          single_file_table_mapping: "",
          table_to_files_mapping: "",
          multi_files_table_name: "",
          multi_files_prefix: "",
        };
      }

      if (clearedReason === "s3_bucket") {
        newValues = {
          ...newValues,
          mapping_config: "",
          mapping_id: "",
          mappings: "",
          single_file_table_mapping: "",
          table_to_files_mapping: "",
          multi_files_table_name: "",
          multi_files_prefix: "",
        };
      }

      valuesRef.current = newValues;
      return newValues;
    });
    if (clearedReason) {
      const descriptions: Record<typeof clearedReason, string> = {
        base_folder_path:
          "Base folder path changed. Please configure the mapping again.",
        include_subfolders:
          "Include Subfolders changed. Please configure the mapping again.",
        file_type: "File type changed. Please configure the mapping again.",
        s3_bucket: "S3 bucket changed. Please configure the mapping again.",
      };
      toaster.warning({
        title: "Mapping cleared",
        description: descriptions[clearedReason],
      });
    }

    setErrors((prev) => {
      if (name === "destination_schema") {
        return { ...prev, [name]: validateSchemaName(value) };
      }
      return { ...prev, [name]: "" };
    });
  };

  // Filter visible fields based on dependencies and visibility
  const visibleFields = useMemo(() => {
    const filtered = schema.filter((field) => {
      if (HIDDEN_FIELDS.includes(field.name)) return false;

      const hasDependency =
        field.depend_on &&
        field.dependency_value !== null &&
        field.dependency_value !== undefined;

      if (hasDependency && field.depend_on) {
        const dependentValue = String(values[field.depend_on] || "").trim();
        const requiredValue = String(field.dependency_value).trim();
        if (dependentValue !== requiredValue) return false;
      }

      if (field.is_visible === false && !hasDependency) return false;

      return true;
    });

    return filtered;
  }, [schema, values]);

  const handleSubmit = () => {
    const newErrors: Record<string, string> = {};

    visibleFields.forEach((field) => {
      if (field.required && !values[field.name]?.trim()) {
        newErrors[field.name] = `${field.label} is required`;
      }
      if (field.name === "destination_schema") {
        const schemaError = validateSchemaName(values[field.name] || "");
        if (schemaError) {
          newErrors[field.name] = schemaError;
        }
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Filter values to only include visible fields and always-included hidden fields
    const visibleFieldNames = new Set(visibleFields.map((f) => f.name));
    const filteredValues: Record<string, string> = {};
    const excludedFields: string[] = [];

    Object.keys(values).forEach((key) => {
      const isVisible = visibleFieldNames.has(key);
      const isHiddenField = HIDDEN_FIELDS.includes(key);
      const value = values[key];
      const hasValue =
        value && (typeof value === "string" ? value.trim() !== "" : true);

      if (
        (isVisible && hasValue) ||
        isHiddenField ||
        key === "include_subfolders"
      ) {
        filteredValues[key] = values[key];
      } else {
        excludedFields.push(key);
      }
    });

    // Convert numeric strings to actual numbers
    const numericFields = [
      "skipheaderlines",
      "skip_footer_lines",
      "tsv_skipheaderlines",
      "tsv_skip_footer_lines",
    ];
    const normalizedValues: Record<string, unknown> = {};

    Object.keys(filteredValues).forEach((key) => {
      const value = filteredValues[key];
      if (numericFields.includes(key) && typeof value === "string") {
        // Convert to number if it's a numeric string
        const numValue = parseInt(value, 10);
        normalizedValues[key] = isNaN(numValue) ? value : numValue;
      } else {
        normalizedValues[key] = value;
      }
    });

    // Normalize base_folder_path: remove leading slash, add trailing slash if not empty
    if (normalizedValues.base_folder_path) {
      let basePath = String(normalizedValues.base_folder_path).trim();
      if (basePath) {
        if (basePath.startsWith("/")) {
          basePath = basePath.substring(1);
        }
        if (!basePath.endsWith("/")) {
          basePath += "/";
        }
        normalizedValues.base_folder_path = basePath;
      }
    }

    // Reset dirty flag so the next defaultValues update (fresh server data)
    // is allowed to sync into the form after the successful save.
    isDirtyRef.current = false;

    onSubmit(normalizedValues as Record<string, unknown>);
  };

  const isReadOnly = (field: S3FieldSchema) => field.read_only === true;

  // Detect which mapping method is selected
  const mappingMethodValue = values.file_mapping_method || "";
  const isSingleTablePerFile = mappingMethodValue === "single_table_per_file";
  const isMultiFilesSingleTable =
    mappingMethodValue === "multi_files_single_table";

  // Open modal when mapping method is selected

  const handleFileMappingSave = (mappings: Mapping[]) => {
    // Convert array of mappings to object format: {"file.csv": "TABLE_NAME"}
    const mappingsObject = mappings.reduce(
      (acc, mapping) => {
        acc[mapping.fileName] = mapping.tableName;
        return acc;
      },
      {} as Record<string, string>,
    );

    // Update form values without submitting
    setValues((prev) => ({
      ...prev,
      single_file_table_mapping: JSON.stringify(mappingsObject),
    }));

    // Close the modal
    setIsMappingModalOpen(false);
  };

  const handleFileMappingCancel = () => {
    // Close the modal without clearing settings
    setIsMappingModalOpen(false);
  };

  const currentMappings = useMemo(() => {
    const mappingData = values.single_file_table_mapping;
    if (!mappingData || mappingData === "[]" || mappingData === "{}") return [];

    try {
      let parsed: unknown = mappingData;
      if (typeof mappingData === "string") {
        parsed = JSON.parse(mappingData);
      }
      if (!parsed) return [];

      if (Array.isArray(parsed)) {
        return (parsed as Record<string, unknown>[]).map((m) => ({
          ...m,
          fileName: m.fileName as string,
          tableName: m.tableName as string,
          isSelected: (m.isSelected ?? true) as boolean,
        }));
      }

      if (typeof parsed === "object") {
        const entries = Object.entries(parsed as Record<string, string>);
        if (entries.length === 0) return [];

        // Object format comes from the backend — these are already saved mappings
        return entries.map(([fileName, tableName]) => ({
          fileName,
          tableName: tableName as string,
          isSelected: true,
        }));
      }

      return [];
    } catch {
      return [];
    }
  }, [values.single_file_table_mapping]);

  const currentMultipleFiles = useMemo(() => {
    const mappingData = values.table_to_files_mapping;
    if (!mappingData || mappingData === "[]" || mappingData === "{}") return [];

    try {
      let parsed: unknown = mappingData;
      if (typeof mappingData === "string") {
        parsed = JSON.parse(mappingData);
      }
      if (!parsed) return [];

      if (typeof parsed === "object" && !Array.isArray(parsed)) {
        const objectValues = Object.values(parsed as Record<string, string[]>);
        if (objectValues.length === 0) return [];

        const firstTableFiles = objectValues[0];
        if (Array.isArray(firstTableFiles)) {
          return firstTableFiles as string[];
        }
      }

      if (Array.isArray(parsed)) {
        return parsed as string[];
      }

      return [];
    } catch {
      return [];
    }
  }, [values.table_to_files_mapping]);

  const hasMappings = useMemo(() => {
    return currentMappings.length > 0 || currentMultipleFiles.length > 0;
  }, [currentMappings, currentMultipleFiles]);

  const handleClearMapping = () => {
    defaultValuesSerializedRef.current = null;

    // Keep file_mapping_method so the user's chosen method stays selected;
    // only wipe the actual mapping payload.
    setValues((prev) => ({
      ...prev,
      mapping_config: "",
      mapping_id: "",
      mappings: "",
      single_file_table_mapping: "",
      table_to_files_mapping: "",
      multi_files_table_name: "",
      multi_files_prefix: "",
    }));
  };

  const renderField = (field: S3FieldSchema) => {
    const fieldReadOnly = isReadOnly(field);
    const fieldValue = values[field.name] || "";

    if (field.widget === "Checkbox" || field.name === "include_subfolders") {
      const checkboxElement = (
        <Checkbox.Root
          id={field.name}
          checked={fieldValue === "true"}
          onCheckedChange={(e) => {
            const syntheticEvent = {
              target: {
                name: field.name,
                value: e.checked ? "true" : "false",
              },
            } as React.ChangeEvent<HTMLInputElement>;
            handleChange(syntheticEvent);
          }}
          disabled={fieldReadOnly}
          colorPalette="brand"
          size="sm"
        >
          <Checkbox.HiddenInput />
          <Checkbox.Control
            cursor={fieldReadOnly ? "not-allowed" : "pointer"}
          />
          <Checkbox.Label
            fontSize="sm"
            mt="1"
            cursor={fieldReadOnly ? "not-allowed" : "pointer"}
          >
            {field.label}
          </Checkbox.Label>
        </Checkbox.Root>
      );

      return (
        <Field.Root
          key={field.name}
          required={field.required}
          invalid={!!errors[field.name]}
        >
          <Flex align="center" gap={2}>
            {checkboxElement}
          </Flex>
          {field.description && (
            <Field.HelperText
              className="checkbox"
              fontSize="xs"
              color="gray.600"
            >
              {field.description}
            </Field.HelperText>
          )}
          {errors[field.name] && (
            <Field.ErrorText>{errors[field.name]}</Field.ErrorText>
          )}
        </Field.Root>
      );
    }

    if (field.type === "ChoiceField") {
      const choiceItems =
        field.choices?.map((choice) => ({
          label: choice.display,
          value: choice.value,
          description: choice.description,
        })) ?? [];

      const collection = createListCollection({ items: choiceItems });

      const handleSelectChange = (e: { value: string[] }) => {
        const newValue = e.value[0] || "";
        const syntheticEvent = {
          target: { name: field.name, value: newValue },
        } as React.ChangeEvent<HTMLSelectElement>;
        handleChange(syntheticEvent);

        // Open modal if this is the mapping method field and a value is selected
        if (field.name === "file_mapping_method" && newValue) {
          setIsMappingModalOpen(true);
        }
      };

      return (
        <Field.Root
          key={field.name}
          required={field.required}
          invalid={!!errors[field.name]}
        >
          <Field.Label htmlFor={field.name}>{field.label}</Field.Label>
          <Select.Root
            key={`${field.name}-${values.file_type}-${values.file_mapping_method}`}
            collection={collection}
            size="sm"
            disabled={fieldReadOnly}
            value={fieldValue ? [fieldValue] : []}
            onValueChange={handleSelectChange}
            bg={fieldReadOnly ? "gray.200 !important" : "white"}
          >
            <Select.HiddenSelect id={field.name} name={field.name} />

            <Select.Control>
              <Select.Trigger
                bg={fieldReadOnly ? "gray.200 !important" : "white"}
                color={fieldReadOnly ? "black !important" : undefined}
                borderColor={fieldReadOnly ? "gray.300 !important" : undefined}
                opacity={fieldReadOnly ? "1 !important" : undefined}
              >
                <Select.ValueText
                  placeholder={
                    !field.depend_on
                      ? field.placeholder || "Select option"
                      : undefined
                  }
                />
              </Select.Trigger>
              <Select.IndicatorGroup>
                <Select.Indicator />
              </Select.IndicatorGroup>
            </Select.Control>
            <Portal>
              <Select.Positioner>
                <Select.Content>
                  {collection.items.map((item) => {
                    const choice = field.choices?.find(
                      (c) => c.value === item.value,
                    );
                    return (
                      <Select.Item item={item} key={item.value}>
                        <Flex direction="column" align="flex-start" gap={1}>
                          <Text fontWeight="medium">{item.label}</Text>
                          {choice?.description && (
                            <Text fontSize="xs" color="gray.600">
                              {choice.description}
                            </Text>
                          )}
                        </Flex>
                        <Select.ItemIndicator />
                      </Select.Item>
                    );
                  })}
                </Select.Content>
              </Select.Positioner>
            </Portal>
          </Select.Root>
          {field.description && (
            <Field.HelperText fontSize="xs" color="gray.600">
              {field.description}
            </Field.HelperText>
          )}
          {errors[field.name] && (
            <Field.ErrorText>{errors[field.name]}</Field.ErrorText>
          )}

          {/* Show Configure Mapping button in both create and edit modes */}
          {field.name === "file_mapping_method" && fieldValue && (
            <Flex gap={2} mt={2}>
              {hasMappings && (
                <Button
                  size="xs"
                  variant="ghost"
                  colorPalette="red"
                  onClick={handleClearMapping}
                  disabled={fieldReadOnly}
                >
                  <MdDelete />
                  Clear Mapping
                </Button>
              )}
              {/* Always allow configuring the mapping, even in edit mode */}
              <Button
                size="xs"
                variant="outline"
                onClick={() => setIsMappingModalOpen(true)}
                disabled={false}
              >
                Configure Mapping
              </Button>
            </Flex>
          )}
        </Field.Root>
      );
    }

    if (field.type === "TextField") {
      return (
        <Field.Root
          key={field.name}
          required={field.required}
          invalid={!!errors[field.name]}
        >
          <Field.Label htmlFor={field.name}>{field.label}</Field.Label>
          <Textarea
            id={field.name}
            name={field.name}
            value={fieldValue}
            onChange={handleChange}
            autoComplete="off"
            placeholder={
              !field.depend_on
                ? field.placeholder || `Enter ${field.label.toLowerCase()}`
                : undefined
            }
            rows={8}
            fontFamily="monospace"
            fontSize="xs"
            resize="vertical"
            readOnly={fieldReadOnly}
            bg={fieldReadOnly ? "gray.200 !important" : undefined}
            color={fieldReadOnly ? "black !important" : undefined}
            borderColor={fieldReadOnly ? "gray.300 !important" : undefined}
            opacity={fieldReadOnly ? "1 !important" : undefined}
          />
          {field.description && (
            <Field.HelperText fontSize="xs" color="gray.600">
              {field.description}
            </Field.HelperText>
          )}
          {errors[field.name] && (
            <Field.ErrorText>{errors[field.name]}</Field.ErrorText>
          )}
        </Field.Root>
      );
    }

    if (field.type === "IntegerField") {
      return (
        <Field.Root
          key={field.name}
          required={field.required}
          invalid={!!errors[field.name]}
        >
          <Field.Label htmlFor={field.name}>{field.label}</Field.Label>
          <Input
            id={field.name}
            name={field.name}
            type="number"
            size="sm"
            value={fieldValue}
            onChange={handleChange}
            autoComplete="off"
            placeholder={
              !field.depend_on
                ? field.placeholder || `Enter ${field.label.toLowerCase()}`
                : undefined
            }
            readOnly={fieldReadOnly}
            bg={fieldReadOnly ? "gray.200 !important" : undefined}
            color={fieldReadOnly ? "black !important" : undefined}
            borderColor={fieldReadOnly ? "gray.300 !important" : undefined}
            opacity={fieldReadOnly ? "1 !important" : undefined}
          />
          {field.description && (
            <Field.HelperText fontSize="xs" color="gray.600">
              {field.description}
            </Field.HelperText>
          )}
          {errors[field.name] && (
            <Field.ErrorText>{errors[field.name]}</Field.ErrorText>
          )}
        </Field.Root>
      );
    }

    if (field.type === "CharField" && field.widget === "PasswordInput") {
      return (
        <Field.Root
          key={field.name}
          required={field.required}
          invalid={!!errors[field.name]}
        >
          <Field.Label htmlFor={field.name}>{field.label}</Field.Label>
          <PasswordInput
            id={field.name}
            name={field.name}
            size="sm"
            value={fieldValue}
            onChange={handleChange}
            autoComplete="new-password"
            placeholder={
              !field.depend_on
                ? field.placeholder || `Enter ${field.label.toLowerCase()}`
                : undefined
            }
            readOnly={fieldReadOnly}
            bg={fieldReadOnly ? "gray.200 !important" : undefined}
            color={fieldReadOnly ? "black !important" : undefined}
            borderColor={fieldReadOnly ? "gray.300 !important" : undefined}
            opacity={fieldReadOnly ? "1 !important" : undefined}
          />
          {field.description && (
            <Field.HelperText fontSize="xs" color="gray.600">
              {field.description}
            </Field.HelperText>
          )}
          {errors[field.name] && (
            <Field.ErrorText>{errors[field.name]}</Field.ErrorText>
          )}
        </Field.Root>
      );
    }

    return (
      <Field.Root
        key={field.name}
        required={field.required}
        invalid={!!errors[field.name]}
      >
        <Field.Label htmlFor={field.name}>{field.label}</Field.Label>
        <Input
          id={field.name}
          name={field.name}
          type="text"
          size="sm"
          value={fieldValue}
          onChange={handleChange}
          autoComplete="off"
          placeholder={
            !field.depend_on
              ? field.placeholder || `Enter ${field.label.toLowerCase()}`
              : undefined
          }
          readOnly={fieldReadOnly}
          bg={fieldReadOnly ? "gray.200 !important" : undefined}
          color={fieldReadOnly ? "black !important" : undefined}
          borderColor={fieldReadOnly ? "gray.300 !important" : undefined}
          opacity={fieldReadOnly ? "1 !important" : undefined}
        />
        {field.description && (
          <Field.HelperText fontSize="xs" color="gray.600">
            {field.description}
          </Field.HelperText>
        )}
        {errors[field.name] && (
          <Field.ErrorText>{errors[field.name]}</Field.ErrorText>
        )}
      </Field.Root>
    );
  };

  // ---------- NEW: Render fields with dependent fields inside a box ----------
  const renderedParents = new Set<string>();

  const renderFieldsWithDependencies = () => {
    return visibleFields.map((field) => {
      if (field.depend_on && renderedParents.has(field.depend_on)) return null;

      const parentFieldElement = renderField(field);

      const dependentFields = visibleFields.filter(
        (f) =>
          f.depend_on === field.name &&
          f.dependency_value?.toLowerCase() ===
            (values[field.name] || "").toLowerCase(),
      );

      renderedParents.add(field.name);

      if (dependentFields.length === 0) return parentFieldElement;

      return (
        <Box key={`parent-${field.name}`}>
          {parentFieldElement}
          <Box
            border="1px solid"
            borderColor="gray.200"
            p={3}
            borderRadius="md"
            mt={2}
            bg="white"
          >
            <VStack gap={3} align="stretch">
              {dependentFields.map((dep) => renderField(dep))}
            </VStack>
          </Box>
        </Box>
      );
    });
  };

  return (
    <>
      <form autoComplete="off" style={{ display: "contents" }}>
        <VStack
          gap={3}
          align="stretch"
          as="div"
          maxW="lg"
          opacity={isMappingModalOpen ? 0.5 : 1}
          pointerEvents={isMappingModalOpen ? "none" : "auto"}
          transition="opacity 0.2s"
        >
          {renderFieldsWithDependencies()}
          <Flex justifyContent="space-between">
            <Flex gap={4}>
              {handleBackButtonClick && (
                <Button variant="outline" onClick={handleBackButtonClick}>
                  <IoMdArrowBack />
                  Back
                </Button>
              )}
              {leftButtons}
            </Flex>
            <Flex gap={4}>
              {rightButtons}
              {!hideSubmitButton && (
                <Button
                  colorPalette="brand"
                  onClick={handleSubmit}
                  loading={loading}
                  disabled={loading}
                >
                  <MdOutlineSave />
                  {mode === "create" ? "Create" : "Save"}
                </Button>
              )}
            </Flex>
          </Flex>
        </VStack>
      </form>

      {isMappingModalOpen && (
        <Dialog.Root open={isMappingModalOpen} closeOnInteractOutside={false}>
          <Portal>
            <Dialog.Backdrop />
            <Dialog.Positioner>
              <Dialog.Content
                maxW="1330px"
                w="90vw"
                maxH="90vh"
                overflow="auto"
              >
                {isSingleTablePerFile ? (
                  <SingleMapping
                    formValues={values}
                    mappings={currentMappings}
                    connectionId={connectionId}
                    onCancel={handleFileMappingCancel}
                    onSaveMappings={handleFileMappingSave}
                    loading={loading}
                    readOnly={false}
                  />
                ) : isMultiFilesSingleTable ? (
                  <MultipleMapping
                    formValues={values}
                    tableName={values.multi_files_table_name || ""}
                    selectedFiles={currentMultipleFiles}
                    connectionId={connectionId}
                    onSave={(data) => {
                      // Format table_to_files_mapping as object: { "TABLE_NAME": ["file1", "file2"] }
                      const tableToFilesMapping = {
                        [data.tableName]: data.selectedFiles,
                      };

                      // Update form values without submitting
                      setValues((prev) => ({
                        ...prev,
                        multi_files_table_name: data.tableName,
                        multi_files_prefix: data.prefix,
                        table_to_files_mapping:
                          JSON.stringify(tableToFilesMapping),
                      }));

                      // Close the modal
                      setIsMappingModalOpen(false);
                    }}
                    onCancel={handleFileMappingCancel}
                    loading={loading}
                    readOnly={
                      schema.find((f) => f.name === "file_mapping_method")
                        ?.read_only === true
                    }
                  />
                ) : null}
              </Dialog.Content>
            </Dialog.Positioner>
          </Portal>
        </Dialog.Root>
      )}
    </>
  );
};

export default S3DynamicForm;
