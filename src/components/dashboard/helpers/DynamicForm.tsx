import React, { useEffect, useState } from "react";

import { Button, Field, Input, VStack } from "@chakra-ui/react";

import { MdOutlineSave } from "react-icons/md";

import { type FieldConfig } from "@/types/form";

type FormConfig = {
  fields: FieldConfig[];
};

interface DynamicFormProps {
  config: FormConfig;
  onSubmit: (_values: Record<string, string>) => void;
  loading?: boolean;
  defaultValues?: Record<string, string>;
}

const DynamicForm: React.FC<DynamicFormProps> = ({
  config,
  onSubmit,
  defaultValues,
  loading,
}) => {
  const initialValues = config.fields.reduce(
    (acc, field) => ({
      ...acc,
      [field.name]: defaultValues?.[field.name] ?? "",
    }),
    {},
  );

  const [values, setValues] = useState<Record<string, string>>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 👇 when defaultValues changes (edit mode), update state
  useEffect(() => {
    if (defaultValues) {
      setValues((prev) => ({
        ...prev,
        ...defaultValues,
      }));
    }
  }, [defaultValues]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSubmit = () => {
    const newErrors: Record<string, string> = {};
    config.fields.forEach((field) => {
      if (field.required && !values[field.name]) {
        newErrors[field.name] = `${field.label} is required`;
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit(values);
  };

  const renderInput = (field: FieldConfig) => {
    const inputType =
      field.type === "PasswordInput"
        ? "password"
        : field.type === "CharField"
          ? "text"
          : "text"; // extend for more types later

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
          type={inputType}
          value={values[field.name]}
          onChange={handleChange}
          placeholder={`Enter ${field.label.toLowerCase()}`}
        />
        {errors[field.name] && (
          <Field.ErrorText>{errors[field.name]}</Field.ErrorText>
        )}
      </Field.Root>
    );
  };

  return (
    <VStack gap={4} align="stretch" as="form" maxW="lg">
      {config.fields.map((field) => renderInput(field))}
      <Button
        colorPalette="brand"
        onClick={handleSubmit}
        alignSelf="flex-end"
        loading={loading}
        disabled={loading}
      >
        <MdOutlineSave />
        Submit
      </Button>
    </VStack>
  );
};

export default DynamicForm;
