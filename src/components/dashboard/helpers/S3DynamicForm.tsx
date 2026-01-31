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

export interface S3FieldSchema {
  name: string;
  label: string;
  type: "CharField" | "ChoiceField" | "TextField" | "IntegerField";
  required: boolean;
  widget?: "PasswordInput" | null;
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
  defaultValues?: Record<string, string>;
  handleBackButtonClick?: () => void;
  mode?: "create" | "edit";
  destinationName?: string;
  sourceName?: string;
  hideSubmitButton?: boolean;
  leftButtons?: React.ReactNode;
  rightButtons?: React.ReactNode;
  onValuesChange?: (_values: Record<string, unknown>) => void;
}

// Fields that should always be hidden - these will NEVER be shown
const HIDDEN_FIELDS = [
  "custom_primary_key",
  "single_file_table_mapping",
  "table_to_files_mapping",
  "multi_files_table_name",
  "multi_files_prefix",
];

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
}) => {
  // Initialize form values from schema and defaultValues
  const initialValues = useMemo(() => {
    const initial = schema.reduce(
      (acc, field) => ({
        ...acc,
        // Priority: defaultValues (from API) > default_value (from schema) > empty string
        [field.name]: defaultValues?.[field.name] ?? field.default_value ?? "",
      }),
      {} as Record<string, string>,
    );

    // Also include hidden fields from defaultValues
    HIDDEN_FIELDS.forEach((fieldName) => {
      if (defaultValues?.[fieldName] !== undefined) {
        initial[fieldName] = defaultValues[fieldName];
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
  const defaultValuesRef = useRef(defaultValues);

  useEffect(() => {
    valuesRef.current = values;
    onValuesChange?.(values);
  }, [values, onValuesChange]);

  useEffect(() => {
    if (defaultValues && defaultValuesRef.current !== defaultValues) {
      defaultValuesRef.current = defaultValues;
      startTransition(() => {
        setValues((prev) => {
          const updated = { ...prev };
          schema.forEach((field) => {
            if (defaultValues[field.name] !== undefined) {
              updated[field.name] = defaultValues[field.name];
            }
          });
          // Also update hidden fields
          HIDDEN_FIELDS.forEach((fieldName) => {
            if (defaultValues[fieldName] !== undefined) {
              updated[fieldName] = defaultValues[fieldName];
            }
          });
          return updated;
        });
      });
    }
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

    setValues((prev) => {
      const newValues = { ...prev, [name]: value };
      valuesRef.current = newValues;
      return newValues;
    });
    setErrors((prev) => ({ ...prev, [name]: "" }));
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

      // Include if:
      // 1. Field is visible AND has a value, OR
      // 2. Field is in HIDDEN_FIELDS (always sent even if empty)
      if ((isVisible && hasValue) || isHiddenField) {
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
    defaultValuesRef.current = {};

    setValues((prev) => ({
      ...prev,

      file_type: "",
      file_mapping_method: "",

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
            bg="white"
          >
            <Select.HiddenSelect id={field.name} name={field.name} />

            <Select.Control>
              <Select.Trigger
                _disabled={{
                  bg: fieldReadOnly
                    ? "gray.200 !important"
                    : "white !important",
                  cursor: "not-allowed",
                  color: fieldReadOnly ? "gray.400" : undefined,
                  borderColor: fieldReadOnly ? "gray.300" : undefined,
                }}
                _readOnly={{
                  bg: fieldReadOnly
                    ? "gray.200 !important"
                    : "white !important",
                  color: fieldReadOnly ? "gray.400" : undefined,
                  borderColor: fieldReadOnly ? "gray.300" : undefined,
                }}
                bg={fieldReadOnly ? "gray.200 !important" : "white !important"}
                color={fieldReadOnly ? "gray.400" : undefined}
                borderColor={fieldReadOnly ? "gray.300" : undefined}
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
              {/* Enable button even if read-only, to allow viewing mapping */}
              <Button
                size="xs"
                variant="outline"
                onClick={() => setIsMappingModalOpen(true)}
                disabled={false}
              >
                {fieldReadOnly ? "View Mapping" : "Configure Mapping"}
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
            bg={fieldReadOnly ? "gray.200" : undefined}
            color={fieldReadOnly ? "gray.400" : undefined}
            borderColor={fieldReadOnly ? "gray.300" : undefined}
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
            placeholder={
              !field.depend_on
                ? field.placeholder || `Enter ${field.label.toLowerCase()}`
                : undefined
            }
            readOnly={fieldReadOnly}
            bg={fieldReadOnly ? "gray.200" : undefined}
            color={fieldReadOnly ? "gray.400" : undefined}
            borderColor={fieldReadOnly ? "gray.300" : undefined}
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
            placeholder={
              !field.depend_on
                ? field.placeholder || `Enter ${field.label.toLowerCase()}`
                : undefined
            }
            readOnly={fieldReadOnly}
            bg={fieldReadOnly ? "gray.200" : undefined}
            color={fieldReadOnly ? "gray.400" : undefined}
            borderColor={fieldReadOnly ? "gray.300" : undefined}
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
          placeholder={
            !field.depend_on
              ? field.placeholder || `Enter ${field.label.toLowerCase()}`
              : undefined
          }
          readOnly={fieldReadOnly}
          bg={fieldReadOnly ? "gray.200" : undefined}
          color={fieldReadOnly ? "gray.400" : undefined}
          borderColor={fieldReadOnly ? "gray.300" : undefined}
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
      <VStack
        gap={3}
        align="stretch"
        as="form"
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
                    onCancel={handleFileMappingCancel}
                    onSaveMappings={handleFileMappingSave}
                    loading={loading}
                    readOnly={mode === "edit"}
                  />
                ) : isMultiFilesSingleTable ? (
                  <MultipleMapping
                    formValues={values}
                    tableName={values.multi_files_table_name || ""}
                    selectedFiles={currentMultipleFiles}
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
                    readOnly={mode === "edit"}
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
