import React from "react";

import { Box, Button, Field, Flex, Text, Textarea } from "@chakra-ui/react";

import { type KeyPair, copyToClipboard } from "./helpers";

interface KeyPairGeneratorProps {
  passphrase: string;
  keyMode: "generate" | "manual";
  generatedKeys: KeyPair | null;
  isGenerating: boolean;
  onModeChange: (_mode: "generate" | "manual") => void;
  onGenerate: () => void;
  showModeToggleOnly?: boolean;
  showKeyDisplay?: boolean;
}

const KeyPairGenerator: React.FC<KeyPairGeneratorProps> = ({
  passphrase,
  keyMode,
  generatedKeys,
  isGenerating,
  onModeChange,
  onGenerate,
  showModeToggleOnly = false,
  showKeyDisplay = false,
}) => {
  const handleModeChange = (newMode: "generate" | "manual") => {
    onModeChange(newMode);
    if (newMode === "generate") {
      onGenerate();
    }
  };

  if (showModeToggleOnly) {
    return (
      <Flex gap={2} mt={4} mb={4}>
        <Button
          variant={keyMode === "generate" ? "solid" : "outline"}
          colorPalette={keyMode === "generate" ? "brand" : "gray"}
          onClick={() => handleModeChange("generate")}
          flex={1}
          loading={isGenerating && keyMode === "generate"}
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
    );
  }

  if (!showKeyDisplay) {
    return null;
  }

  return (
    <>
      {keyMode === "generate" && (
        <Box mt={4}>
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

          {generatedKeys && (
            <Flex gap={4} direction={{ base: "column", md: "row" }} mt={4}>
              <Box flex={1}>
                <Field.Root>
                  <Field.Label>Public Key (PEM Format)</Field.Label>
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

              <Box flex={1}>
                <Field.Root>
                  <Field.Label>Private Key (PEM Format)</Field.Label>
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
            </Flex>
          )}
        </Box>
      )}

      {keyMode === "manual" && !passphrase?.trim() && (
        <Text fontSize="sm" color="orange.500" mt={2}>
          Enter a passphrase above to enable key generation
        </Text>
      )}
    </>
  );
};

export default KeyPairGenerator;
