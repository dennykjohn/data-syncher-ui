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
import { type FieldConfig, type KeyPair } from "@/types/form";

import KeyPairGenerator from "./KeyPairGenerator";

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
  hideSubmitButton?: boolean;
  leftButtons?: React.ReactNode;
  rightButtons?: React.ReactNode;
  onValuesChange?: (_values: Record<string, string>) => void;
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
  hideSubmitButton = false,
  leftButtons,
  rightButtons,
  onValuesChange,
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

  useEffect(() => {
    valuesRef.current = values;
    onValuesChange?.(values);
  }, [values, onValuesChange]);
  // 👇 when defaultValues changes (edit mode), update state
  useEffect(() => {
    if (defaultValues && defaultValuesRef.current !== defaultValues) {
      defaultValuesRef.current = defaultValues;
      startTransition(() => {
        setValues((prev) => ({ ...prev, ...defaultValues }));
      });
    }
  }, [defaultValues]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
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

  // Filter out passphrase from sorted fields - it will be rendered separately below KeyPairGenerator
  // Note: sortedFields is kept for potential future use but currently not used
  const _sortedFields = useMemo(() => {
    return config.fields.filter((f) => f.name !== "passphrase");
  }, [config.fields]);

  // Get passphrase field separately
  const passphraseField = useMemo(() => {
    return config.fields.find((f) => f.name === "passphrase");
  }, [config.fields]);

  // Extract existing keys from defaultValues for edit mode
  // Handle both snake_case (public_key) and camelCase (publicKey) naming
  const existingKeys = useMemo(() => {
    if (mode !== "edit" || !defaultValues) return null;

    const publicKey =
      defaultValues.public_key ||
      defaultValues.publicKey ||
      values.public_key ||
      values.publicKey;
    const privateKey =
      defaultValues.private_key ||
      defaultValues.privateKey ||
      values.private_key ||
      values.privateKey;

    if (publicKey && privateKey) {
      return {
        publicKey,
        privateKey,
        passphrase: defaultValues.passphrase || values.passphrase || "",
      };
    }
    return null;
  }, [
    mode,
    defaultValues,
    values.public_key,
    values.private_key,
    values.publicKey,
    values.privateKey,
    values.passphrase,
  ]);

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
    // hide password field and passphrase (passphrase will be rendered separately)
    if (
      field.name === "password" &&
      values["authentication_type"] === "key_pair"
    ) {
      return null;
    }
    // Hide passphrase in normal rendering when key_pair is selected (it's rendered separately)
    if (
      field.name === "passphrase" &&
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

    if (
      (field.name === "private_key" || field.name === "public_key") &&
      (values["authentication_type"] === "key_pair" ||
        values["authentication_type"]?.toLowerCase().includes("key"))
    ) {
      if (keyMode === "manual") {
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
      return null; // Hide in generate mode
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
            {(field.name === "authentication_type" ||
              field.name === "authenticationType") && (
              <>
                {passphraseField &&
                  values.authentication_type === "key_pair" && (
                    <Field.Root
                      key={passphraseField.name}
                      required={passphraseField.required}
                      invalid={!!errors[passphraseField.name]}
                    >
                      <Field.Label htmlFor={passphraseField.name}>
                        {passphraseField.label}
                      </Field.Label>
                      {passphraseField.type === "PasswordInput" ? (
                        <PasswordInput
                          id={passphraseField.name}
                          name={passphraseField.name}
                          value={values[passphraseField.name] || ""}
                          onChange={handleChange}
                          placeholder={`Enter ${passphraseField.label.toLowerCase()}`}
                        />
                      ) : (
                        <Input
                          id={passphraseField.name}
                          name={passphraseField.name}
                          type="text"
                          value={values[passphraseField.name] || ""}
                          onChange={handleChange}
                          placeholder={`Enter ${passphraseField.label.toLowerCase()}`}
                        />
                      )}
                      {errors[passphraseField.name] && (
                        <Field.ErrorText>
                          {errors[passphraseField.name]}
                        </Field.ErrorText>
                      )}
                    </Field.Root>
                  )}
                <KeyPairGenerator
                  formValues={values}
                  mode={mode}
                  destinationName={destinationName}
                  sourceName={sourceName}
                  hasPassphraseField={config.fields.some(
                    (f) => f.name === "passphrase",
                  )}
                  existingKeys={existingKeys}
                  onKeysGenerated={(keys: KeyPair) =>
                    setValues((prev) => ({
                      ...prev,
                      public_key: keys.publicKey,
                      private_key: keys.privateKey,
                      ...(keys.passphrase && { passphrase: keys.passphrase }),
                    }))
                  }
                  onClearKeys={() =>
                    setValues((prev) => ({
                      ...prev,
                      public_key: "",
                      private_key: "",
                    }))
                  }
                  onModeChange={setKeyMode}
                />
              </>
            )}
          </Box>
        );
      })}
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
  );
};

export default DynamicForm;
