import React, {
  startTransition,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { Box, Button, Field, Flex, Text, Textarea } from "@chakra-ui/react";

import { MdContentCopy } from "react-icons/md";

import { toaster } from "@/components/ui/toaster";
import { Tooltip } from "@/components/ui/tooltip";
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
  existingKeys?: KeyPair | null;
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
  existingKeys,
}) => {
  const getFieldValue = (names: string[]): string =>
    names.map((name) => formValues?.[name]).find(Boolean) || "";

  const passphrase = formValues?.["passphrase"] || "";
  const authenticationType = formValues?.["authentication_type"] || "";

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
    if (keyMode !== "generate") {
      setIsGenerating(false);
      return;
    }

    setIsGenerating(true);
    try {
      const keys = await generateKeyPair(passphrase?.trim() || undefined);
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

            // Allow generation in create mode even when existing keys are found
            setCanGenerate(mode === "create");
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
          hasCheckedExistingKeysRef.current = true;
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
        // Allow generation in both create and edit modes
        setCanGenerate(true);
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
            <Flex gap={4} direction="column" mt={4}>
              <Box flex={1}>
                <Field.Root>
                  <Flex
                    justifyContent="space-between"
                    alignItems="center"
                    mb={2}
                  >
                    <Field.Label>Private Key (PEM format)</Field.Label>
                    <Tooltip content="Copy private key">
                      <Button
                        size="xs"
                        variant="ghost"
                        onClick={() =>
                          copyToClipboard(generatedKeys.privateKey, "Private")
                        }
                      >
                        <MdContentCopy size={14} />
                      </Button>
                    </Tooltip>
                  </Flex>
                  <Textarea
                    value={generatedKeys.privateKey}
                    readOnly
                    rows={10}
                    fontFamily="monospace"
                    fontSize="xs"
                    resize="none"
                  />
                </Field.Root>
              </Box>

              <Box flex={1}>
                <Field.Root>
                  <Flex
                    justifyContent="space-between"
                    alignItems="center"
                    mb={2}
                  >
                    <Field.Label>Public Key (PEM format)</Field.Label>
                    <Tooltip content="Copy public key">
                      <Button
                        size="xs"
                        variant="ghost"
                        onClick={() =>
                          copyToClipboard(generatedKeys.publicKey, "Public")
                        }
                      >
                        <MdContentCopy size={14} />
                      </Button>
                    </Tooltip>
                  </Flex>
                  <Textarea
                    value={generatedKeys.publicKey}
                    readOnly
                    rows={10}
                    fontFamily="monospace"
                    fontSize="xs"
                    resize="none"
                  />
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
