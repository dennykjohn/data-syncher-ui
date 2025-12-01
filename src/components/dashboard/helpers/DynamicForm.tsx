import React, { useEffect, useRef, useState } from "react";

import {
  Box,
  Button,
  Field,
  Flex,
  Input,
  NativeSelect,
  Textarea,
  VStack,
} from "@chakra-ui/react";

import { IoMdArrowBack } from "react-icons/io";
import { MdOutlineSave } from "react-icons/md";

import { PasswordInput } from "@/components/ui/password-input";
import { type FieldConfig } from "@/types/form";

import KeyPairGenerator from "./KeyPairGenerator";
import { type KeyPair } from "./helpers";

type FormConfig = {
  fields: FieldConfig[];
};

interface DynamicFormProps {
  config: FormConfig;
  onSubmit: (_values: Record<string, string>) => void;
  loading?: boolean;
  defaultValues?: Record<string, string>;
  handleBackButtonClick?: () => void;
  mode?: "create" | "edit";
  destinationName?: string;
  sourceName?: string;
}

const DynamicForm: React.FC<DynamicFormProps> = ({
  config,
  onSubmit,
  defaultValues,
  loading,
  handleBackButtonClick,
  mode,
  destinationName,
  sourceName,
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
  const [keyMode, setKeyMode] = useState<"generate" | "manual">("generate");

  const valuesRef = useRef(values);
  const defaultValuesRef = useRef(defaultValues);

  // 👇 when defaultValues changes (edit mode), update state
  useEffect(() => {
    valuesRef.current = values;
  }, [values]);

  useEffect(() => {
    if (defaultValues && defaultValuesRef.current !== defaultValues) {
      defaultValuesRef.current = defaultValues;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setValues((prev) => ({
        ...prev,
        ...defaultValues,
      }));
    }
  }, [defaultValues]);

  // Simple callback to receive generated keys from KeyPairGenerator
  const handleKeysGenerated = (keys: KeyPair) => {
    setValues((prev) => {
      const updatedValues: Record<string, string> = {
        ...prev,
        public_key: keys.publicKey,
        private_key: keys.privateKey,
      };

      if (keys.passphrase) {
        updatedValues.passphrase = keys.passphrase;
      }

      return updatedValues;
    });
  };

  // Simple callback to receive mode change from KeyPairGenerator
  const handleModeChange = (newMode: "generate" | "manual") => {
    setKeyMode(newMode);
  };

  // Simple callback to clear keys when switching to manual mode
  const handleClearKeys = () => {
    setValues((prev) => ({
      ...prev,
      public_key: "",
      private_key: "",
    }));
  };

  const shouldShowKeyGenerator =
    mode === "create" &&
    (destinationName?.toLowerCase() === "snowflake" ||
      sourceName?.toLowerCase() === "snowflake") &&
    (values["authentication_type"] === "key_pair" ||
      values["authentication_type"]?.toLowerCase().includes("key")) &&
    config.fields.some((field) => field.name === "passphrase");

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target as
      | HTMLInputElement
      | HTMLSelectElement
      | HTMLTextAreaElement;

    setValues((prev) => {
      const newValues = { ...prev, [name]: value };
      valuesRef.current = newValues;
      return newValues;
    });

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
    const inputType = "text";
    // If the value of authentication_type field is "password",
    // hide private_key, public_key & passphrase fields
    if (
      (field.name === "private_key" ||
        field.name === "public_key" ||
        field.name === "passphrase") &&
      values["authentication_type"] === "password"
    ) {
      return null;
    }
    // If the value of authentication_type field is "keypair",
    // hide password field

    if (
      field.name === "password" &&
      values["authentication_type"] === "key_pair"
    ) {
      return null;
    }
    // If the value of authentication_type field is not selected,
    // hide private_key, public_key, passphrase & password fields

    if (
      (field.name === "private_key" ||
        field.name === "public_key" ||
        field.name === "password" ||
        field.name === "passphrase") &&
      !values["authentication_type"]
    ) {
      return null;
    }
    // Support `ChoiceField` type with `options` on the FieldConfig

    // Hide key fields when in generate mode (keys are shown in KeyPairGenerator)
    if (
      shouldShowKeyGenerator &&
      keyMode === "generate" &&
      (field.name === "private_key" || field.name === "public_key")
    ) {
      return null;
    }

    // Show key fields when in manual mode
    if (
      shouldShowKeyGenerator &&
      keyMode === "manual" &&
      (field.name === "private_key" || field.name === "public_key")
    ) {
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
            value={values[field.name] || ""}
            onChange={handleChange}
            placeholder={`Enter ${field.label.toLowerCase()}`}
            rows={10}
            fontFamily="monospace"
            fontSize="xs"
            resize="none"
          />
          {errors[field.name] && (
            <Field.ErrorText>{errors[field.name]}</Field.ErrorText>
          )}
        </Field.Root>
      );
    }

    if (field.type === "ChoiceField") {
      return (
        <Field.Root
          key={field.name}
          required={field.required}
          invalid={!!errors[field.name]}
        >
          <Field.Label htmlFor={field.name}>{field.label}</Field.Label>
          <NativeSelect.Root size="sm">
            <NativeSelect.Field
              id={field.name}
              name={field.name}
              placeholder="Select option"
              onChange={handleChange}
              value={values[field.name]}
            >
              {(field.choices ?? []).map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.display}
                </option>
              ))}
            </NativeSelect.Field>
            <NativeSelect.Indicator />
          </NativeSelect.Root>
          {errors[field.name] && (
            <Field.ErrorText>{errors[field.name]}</Field.ErrorText>
          )}
        </Field.Root>
      );
    } else if (field.type === "PasswordInput") {
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
            value={values[field.name]}
            onChange={handleChange}
            placeholder={`Enter ${field.label.toLowerCase()}`}
          />
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
      {config.fields.map((field) => {
        const input = renderInput(field);
        if (!input) return null;

        return (
          <Box key={field.name}>
            {input}

            {field.name === "passphrase" && shouldShowKeyGenerator && (
              <KeyPairGenerator
                passphrase={values["passphrase"] || ""}
                keyMode={keyMode}
                authenticationType={values["authentication_type"] || ""}
                username={
                  values["username"] ||
                  values["user_name"] ||
                  values["user"] ||
                  ""
                }
                accountName={
                  values["account_name"] ||
                  values["account"] ||
                  values["accountName"] ||
                  values["account_identifier"] ||
                  ""
                }
                entityType={sourceName ? "source" : "destination"}
                onKeysGenerated={handleKeysGenerated}
                onModeChange={handleModeChange}
                onClearKeys={handleClearKeys}
              />
            )}
          </Box>
        );
      })}
      <Flex justifyContent="space-between">
        {handleBackButtonClick && (
          <Button variant="outline" onClick={handleBackButtonClick}>
            <IoMdArrowBack />
            Back
          </Button>
        )}
        <Button
          colorPalette="brand"
          onClick={handleSubmit}
          alignSelf="flex-end"
          loading={loading}
          disabled={loading}
          marginLeft="auto"
        >
          <MdOutlineSave />
          {mode === "create" ? "Create" : "Save"}
        </Button>
      </Flex>
    </VStack>
  );
};

export default DynamicForm;
