import React, {
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { Box, Button, Field, Flex, Text, Textarea } from "@chakra-ui/react";

import { toaster } from "@/components/ui/toaster";
import type { KeyPair } from "@/types/form";

import { checkKeysForUser, copyToClipboard, generateKeyPair } from "./helpers";

interface KeyPairGeneratorProps {
  formValues: Record<string, string>;
  mode?: "create" | "edit";
  destinationName?: string;
  sourceName?: string;
  hasPassphraseField?: boolean;
  onKeysGenerated?: (_keys: KeyPair) => void;
  onClearKeys?: () => void;
  onModeChange?: (_mode: "generate" | "manual") => void;
}

const KeyPairGenerator: React.FC<KeyPairGeneratorProps> = ({
  formValues,
  mode = "create",
  destinationName,
  sourceName,
  hasPassphraseField = false,
  onKeysGenerated,
  onClearKeys,
  onModeChange: externalOnModeChange,
}) => {
  const getFieldValue = (names: string[]): string =>
    names.map((name) => formValues?.[name]).find(Boolean) || "";

  const passphrase = formValues?.["passphrase"] || "";
  const authenticationType = formValues?.["authentication_type"] || "";

  // Compute existingKeys from form values for edit mode
  const existingKeys = useMemo(() => {
    if (mode === "edit" && formValues.public_key && formValues.private_key) {
      return {
        publicKey: formValues.public_key,
        privateKey: formValues.private_key,
        passphrase: formValues.passphrase || "",
      };
    }
    return null;
  }, [
    mode,
    formValues.public_key,
    formValues.private_key,
    formValues.passphrase,
  ]);

  const username = getFieldValue(["username", "user_name", "user"]) || "";
  const accountName =
    getFieldValue([
      "account_name",
      "account",
      "accountName",
      "account_identifier",
    ]) || "";
  const entityType = sourceName ? "source" : "destination";

  const shouldShow =
    (destinationName?.toLowerCase() === "snowflake" ||
      sourceName?.toLowerCase() === "snowflake") &&
    (authenticationType === "key_pair" ||
      authenticationType?.toLowerCase().includes("key")) &&
    hasPassphraseField;

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedKeys, setGeneratedKeys] = useState<KeyPair | null>(null);
  const [canGenerate, setCanGenerate] = useState(true);
  const [keyMode, setKeyMode] = useState<"generate" | "manual">("generate");
  const [isNewlyGenerated, setIsNewlyGenerated] = useState(false);

  const passphraseRef = useRef(passphrase);
  const hasGeneratedKeysRef = useRef(false);
  const hasCheckedExistingKeysRef = useRef(false);
  const lastAuthTypeRef = useRef("");
  const lastUsernameRef = useRef("");
  const lastAccountRef = useRef("");
  const prevIsKeyPairAuthRef = useRef(false);

  const handleGenerateKeyPair = useCallback(async () => {
    if (keyMode !== "generate" || !passphrase?.trim()) {
      setIsGenerating(false);
      return;
    }

    setIsGenerating(true);
    try {
      const keys = await generateKeyPair(passphrase);
      if (keys && keyMode === "generate") {
        setGeneratedKeys(keys);
        hasGeneratedKeysRef.current = true;
        setIsNewlyGenerated(true); // Mark as newly generated
        onKeysGenerated?.(keys);

        // Show success message
        toaster.success({
          title: "Keys generated successfully",
          description:
            mode === "edit"
              ? "New keys have been generated. Click 'Save' to update them in the database."
              : "New RSA key pair has been generated.",
        });
      }
    } catch {
      // Error handled by generateKeyPair
    } finally {
      setIsGenerating(false);
    }
  }, [keyMode, passphrase, onKeysGenerated, mode]);

  useEffect(() => {
    const isKeyPairAuth =
      authenticationType === "key_pair" ||
      authenticationType?.toLowerCase().includes("key");

    if (!isKeyPairAuth || keyMode === "manual") {
      if (!isKeyPairAuth) {
        lastAuthTypeRef.current = "";
        lastUsernameRef.current = "";
        lastAccountRef.current = "";
        hasCheckedExistingKeysRef.current = false;
        hasGeneratedKeysRef.current = false;
      }
      return;
    }
    if (mode === "edit") {
      return;
    }

    const hasChanged =
      lastAuthTypeRef.current !== authenticationType ||
      lastUsernameRef.current !== username ||
      lastAccountRef.current !== accountName;

    if (
      username?.trim() &&
      accountName?.trim() &&
      (hasChanged || !hasCheckedExistingKeysRef.current)
    ) {
      lastAuthTypeRef.current = authenticationType;
      lastUsernameRef.current = username;
      lastAccountRef.current = accountName;
      hasCheckedExistingKeysRef.current = true;

      checkKeysForUser(username, accountName, authenticationType, entityType)
        .then((keys) => {
          if (keys) {
            hasGeneratedKeysRef.current = true;
            hasCheckedExistingKeysRef.current = true;

            setGeneratedKeys(keys);

            setCanGenerate(false);
            setIsNewlyGenerated(false);
            onKeysGenerated?.(keys);
          } else {
            setGeneratedKeys(null);
            hasGeneratedKeysRef.current = false;
            hasCheckedExistingKeysRef.current = true;
            setCanGenerate(true);
          }
        })
        .catch(() => {
          setGeneratedKeys(null);
          hasGeneratedKeysRef.current = false;
          hasCheckedExistingKeysRef.current = true; // Mark as checked even on error
          setCanGenerate(true);
        });
    }
  }, [
    authenticationType,
    username,
    accountName,
    keyMode,
    onKeysGenerated,
    entityType,
    mode,
  ]);

  useEffect(() => {
    const isKeyPairAuth =
      authenticationType === "key_pair" ||
      authenticationType?.toLowerCase().includes("key");

    if (prevIsKeyPairAuthRef.current && !isKeyPairAuth) {
      startTransition(() => {
        setGeneratedKeys(null);
        setCanGenerate(true);
      });
    }
    prevIsKeyPairAuthRef.current = isKeyPairAuth;
  }, [authenticationType]);

  useEffect(() => {
    if (keyMode === "manual") {
      hasGeneratedKeysRef.current = false;
      startTransition(() => setGeneratedKeys(null));
      return;
    }

    if (
      keyMode === "generate" &&
      existingKeys &&
      !hasGeneratedKeysRef.current
    ) {
      hasGeneratedKeysRef.current = true;
      setIsNewlyGenerated(false); // Mark as existing keys, not newly generated
      startTransition(() => {
        // In edit mode, always allow regeneration
        setCanGenerate(mode === "edit");
        setGeneratedKeys(existingKeys);
        onKeysGenerated?.(existingKeys);
      });
    }
  }, [existingKeys, onKeysGenerated, keyMode, mode]);

  const handleModeChange = useCallback(
    (newMode: "generate" | "manual") => {
      if (newMode === "manual") {
        setGeneratedKeys(null);
        hasGeneratedKeysRef.current = false;
        hasCheckedExistingKeysRef.current = false;
        setIsGenerating(false);
        setCanGenerate(true);
        setIsNewlyGenerated(false); // Reset flag
        onClearKeys?.();
      }
      setKeyMode(newMode);
      externalOnModeChange?.(newMode);
    },
    [onClearKeys, externalOnModeChange],
  );

  useEffect(() => {
    if (
      keyMode === "generate" &&
      passphrase &&
      passphraseRef.current !== passphrase &&
      !hasGeneratedKeysRef.current &&
      !hasCheckedExistingKeysRef.current
    ) {
      startTransition(() => setGeneratedKeys(null));
    }
    passphraseRef.current = passphrase;
  }, [passphrase, keyMode]);

  if (!shouldShow) return null;

  return (
    <Box mt={4}>
      <Flex gap={2} mb={4}>
        <Button
          variant={keyMode === "generate" ? "solid" : "outline"}
          colorPalette={keyMode === "generate" ? "brand" : "gray"}
          onClick={() => {
            if (keyMode !== "generate") {
              handleModeChange("generate");
            } else {
              // Check for passphrase before generating
              if (!passphrase?.trim()) {
                toaster.error({
                  title: "Passphrase required",
                  description:
                    "Please enter a passphrase before generating keys.",
                });
                return;
              }
              handleGenerateKeyPair();
            }
          }}
          flex={1}
          loading={isGenerating && keyMode === "generate"}
          disabled={keyMode === "generate" && !canGenerate}
        >
          Generate Keys
        </Button>
        <Button
          variant={keyMode === "manual" ? "solid" : "outline"}
          colorPalette={keyMode === "manual" ? "brand" : "gray"}
          onClick={() => handleModeChange("manual")}
          flex={1}
        >
          Enter Keys Manually
        </Button>
      </Flex>

      {keyMode === "generate" && (
        <>
          {!passphrase?.trim() && (
            <Text fontSize="sm" color="orange.500" mb={2}>
              Enter a passphrase above to enable key generation
            </Text>
          )}

          {isGenerating && (
            <Text fontSize="sm" color="blue.500" mb={2}>
              Generating keys...
            </Text>
          )}

          {/* Message for newly generated keys */}
          {isNewlyGenerated && generatedKeys && (
            <Text fontSize="sm" color="orange.500" mb={2}>
              New keys have been generated. Make sure to update them in your
              Snowflake account.
            </Text>
          )}

          {/* Message for existing keys from API (create mode) */}
          {!isNewlyGenerated &&
            generatedKeys &&
            mode === "create" &&
            hasGeneratedKeysRef.current && (
              <Text fontSize="sm" color="green.500" mb={2}>
                Existing keys found for this user and account.
              </Text>
            )}

          {generatedKeys && (
            <Flex gap={4} direction={{ base: "column", md: "row" }} mt={4}>
              <Box flex={1}>
                <Field.Root>
                  <Field.Label>Private Key (PEM format)</Field.Label>
                  <Textarea
                    value={generatedKeys.privateKey}
                    readOnly
                    rows={10}
                    fontFamily="monospace"
                    fontSize="xs"
                    resize="none"
                  />
                  <Button
                    size="xs"
                    variant="outline"
                    mt={2}
                    onClick={() =>
                      copyToClipboard(generatedKeys.privateKey, "Private")
                    }
                  >
                    Copy Private Key
                  </Button>
                </Field.Root>
              </Box>

              <Box flex={1}>
                <Field.Root>
                  <Field.Label>Public Key (PEM format)</Field.Label>
                  <Textarea
                    value={generatedKeys.publicKey}
                    readOnly
                    rows={10}
                    fontFamily="monospace"
                    fontSize="xs"
                    resize="none"
                  />
                  <Button
                    size="xs"
                    variant="outline"
                    mt={2}
                    onClick={() =>
                      copyToClipboard(generatedKeys.publicKey, "Public")
                    }
                  >
                    Copy Public Key
                  </Button>
                </Field.Root>
              </Box>
            </Flex>
          )}
        </>
      )}

      {keyMode === "manual" && (
        <Text fontSize="sm" color="orange.500" mt={2}>
          Enter your keys manually in the form fields above.
        </Text>
      )}
    </Box>
  );
};

export default KeyPairGenerator;
