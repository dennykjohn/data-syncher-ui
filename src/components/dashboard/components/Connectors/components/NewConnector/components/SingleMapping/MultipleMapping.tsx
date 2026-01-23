import React, { useMemo, useState } from "react";

import {
  Box,
  Button,
  Field,
  Flex,
  Input,
  Text,
  VStack,
} from "@chakra-ui/react";

import { MdOutlineSave } from "react-icons/md";

import usePreviewPatternTables, {
  type PreviewPatternRequest,
} from "@/queryOptions/connector/usePreviewPatternTables";

interface MultipleMappingProps {
  formValues?: Record<string, unknown>;
  tableName?: string;
  selectedFiles?: string[];
  onSave: (_data: {
    tableName: string;
    prefix: string;
    selectedFiles: string[];
  }) => void;
  onCancel?: () => void;
  loading?: boolean;
}

const MultipleMapping: React.FC<MultipleMappingProps> = ({
  formValues,
  tableName: initialTableName = "",
  selectedFiles: initialSelectedFiles = [],
  onSave,
  onCancel,
  loading: saveLoading,
}) => {
  const [tableName, setTableName] = useState(initialTableName);
  const [prefix, setPrefix] = useState("");
  const [shouldFetchPreview, setShouldFetchPreview] = useState(false);

  const hasRequiredCreds =
    !!formValues?.s3_bucket &&
    !!formValues?.aws_access_key_id &&
    !!formValues?.aws_secret_access_key;

  // Preview pattern params for server-side filtering
  const previewParams = useMemo(() => {
    if (!hasRequiredCreds || !prefix.trim() || !shouldFetchPreview) return null;
    return {
      s3_bucket: String(formValues?.s3_bucket || "").trim(),
      aws_access_key_id: String(formValues?.aws_access_key_id || "").trim(),
      aws_secret_access_key: String(
        formValues?.aws_secret_access_key || "",
      ).trim(),
      base_folder_path: formValues?.base_folder_path as string | undefined,
      file_type: formValues?.file_type as string | undefined,
      multi_files_prefix: prefix.trim(),
    } as PreviewPatternRequest;
  }, [hasRequiredCreds, formValues, prefix, shouldFetchPreview]);

  // Fetch matching tables based on pattern (server-side filtering)
  const { data: previewData } = usePreviewPatternTables(
    previewParams ?? ({} as PreviewPatternRequest),
    !!previewParams &&
      hasRequiredCreds &&
      !!prefix.trim() &&
      shouldFetchPreview,
  );

  // Derived state for matched tables
  const matchedTables = useMemo(() => {
    if (prefix.trim() && previewData?.matched_tables) {
      return previewData.matched_tables
        .map((t) => t.file_key || t.file_name || t.table)
        .filter((name): name is string => !!name);
    } else if (prefix.trim() && previewData && !previewData.matched_tables) {
      return [];
    } else if (!prefix.trim()) {
      return initialSelectedFiles;
    }
    return initialSelectedFiles;
  }, [prefix, previewData, initialSelectedFiles]);

  const handleSave = () => {
    onSave({
      tableName,
      prefix,
      selectedFiles: matchedTables,
    });
  };

  return (
    <VStack align="stretch" gap={3} w="100%">
      {/* ---------- HEADER ---------- */}
      <Flex direction="column" align="center" gap={1} mt={8}>
        <Text fontSize="lg" fontWeight="semibold" textAlign="center">
          Map Multiple Files to Single Table
        </Text>
        <Text fontSize="sm" color="gray.600" textAlign="center">
          Configure table mapping for multiple files with matching structure
        </Text>
      </Flex>

      <Flex gap={6} align="stretch" h="450px" maxW="1300px" mx="auto" w="100%">
        {/* Left Panel - Configuration */}
        <Box
          flex="1"
          borderWidth={1}
          borderColor="gray.300"
          borderRadius="lg"
          bg="white"
          overflow="hidden"
          minW="300px"
          boxShadow="sm"
        >
          <Flex
            align="center"
            justify="space-between"
            px={4}
            h="52px"
            borderBottomWidth={1}
            borderBottomColor="gray.200"
            bg="gray.50"
          >
            <Text fontWeight="semibold" fontSize="sm">
              Table Configuration
            </Text>
          </Flex>

          <VStack align="stretch" gap={4} px={4} py={4}>
            {/* ---------- TABLE NAME ---------- */}
            <Field.Root required>
              <Field.Label htmlFor="tableName">
                Destination Table Name
              </Field.Label>
              <Input
                id="tableName"
                name="tableName"
                placeholder="Enter table name"
                value={tableName}
                onChange={(e) => setTableName(e.target.value)}
                size="sm"
              />
              <Field.HelperText>
                All selected files will be mapped to this table
              </Field.HelperText>
            </Field.Root>

            {/* ---------- PREFIX ---------- */}
            <Field.Root>
              <Field.Label htmlFor="prefix">File Prefix Filter</Field.Label>
              <Input
                id="prefix"
                name="prefix"
                value={prefix}
                onChange={(e) => {
                  setPrefix(e.target.value);
                  setShouldFetchPreview(false);
                }}
                size="sm"
              />
              <Field.HelperText>
                Filter files by prefix to preview matching tables
              </Field.HelperText>

              {/* Preview Button */}
              <Button
                size="sm"
                variant="outline"
                colorPalette="brand"
                mt={2}
                onClick={() => {
                  // Trigger the preview API call
                  if (tableName.trim() && prefix.trim()) {
                    setShouldFetchPreview(true);
                  }
                }}
                disabled={!tableName.trim() || !prefix.trim()}
                w="fit-content"
              >
                Preview
              </Button>
            </Field.Root>
          </VStack>
        </Box>

        {/* Right Panel - Matched Tables Preview */}
        <Box
          flex="1"
          borderWidth={1}
          borderColor="gray.300"
          borderRadius="lg"
          bg="white"
          overflow="hidden"
          minW="300px"
          boxShadow="sm"
          display="flex"
          flexDirection="column"
        >
          <Flex
            h="52px"
            px={5}
            borderBottomWidth={1}
            borderColor="gray.200"
            justify="space-between"
            align="center"
          >
            <Text fontWeight="semibold" fontSize="sm">
              Matching Files Preview
            </Text>
            {matchedTables.length > 0 && (
              <Text fontSize="sm" color="gray.600">
                {matchedTables.length} files found
              </Text>
            )}
          </Flex>

          <Box overflowY="auto" flex="1">
            {!hasRequiredCreds && matchedTables.length === 0 ? (
              <VStack gap={2} align="center" py={6} color="gray.500">
                <Text fontSize="sm" fontWeight="medium">
                  No files configured
                </Text>
                <Text fontSize="xs" textAlign="center">
                  S3 credentials are not available in edit mode for security.
                  The saved file list is shown below.
                </Text>
              </VStack>
            ) : !hasRequiredCreds && matchedTables.length > 0 ? (
              // Edit mode: Show saved files without preview
              <>
                <VStack
                  gap={2}
                  align="center"
                  py={2}
                  bg="blue.50"
                  borderRadius="md"
                  mb={2}
                >
                  <Text fontSize="xs" color="blue.700" textAlign="center">
                    📝 Edit Mode: Showing saved files. Preview not available
                    without S3 credentials.
                  </Text>
                </VStack>
                {matchedTables.map((table, index) => (
                  <Flex
                    key={index}
                    h="52px"
                    px={4}
                    borderBottomWidth={1}
                    borderColor="gray.100"
                    align="center"
                    gap={2}
                    bg={index % 2 === 0 ? "white" : "gray.50"}
                    _hover={{ bg: "gray.100" }}
                  >
                    <Text fontSize="sm" color="gray.700" flex="1">
                      {table}
                    </Text>
                  </Flex>
                ))}
              </>
            ) : !prefix && matchedTables.length === 0 ? (
              <VStack gap={2} align="center" py={6} color="gray.500">
                <Text fontSize="sm" fontWeight="medium">
                  Enter a prefix to preview files
                </Text>
                <Text fontSize="xs" textAlign="center">
                  Files matching the prefix will be displayed here
                </Text>
              </VStack>
            ) : matchedTables.length > 0 ? (
              matchedTables.map((table, index) => (
                <Flex
                  key={index}
                  h="52px"
                  px={4}
                  borderBottomWidth={1}
                  borderColor="gray.100"
                  align="center"
                  gap={2}
                  bg={index % 2 === 0 ? "white" : "gray.50"}
                  _hover={{ bg: "gray.100" }}
                >
                  <Text fontSize="sm" color="gray.700" flex="1">
                    {table}
                  </Text>
                </Flex>
              ))
            ) : (
              <VStack gap={2} align="center" py={6} color="gray.500">
                <Text fontSize="sm" fontWeight="medium">
                  No files found
                </Text>
                <Text fontSize="xs">No files match the prefix "{prefix}"</Text>
              </VStack>
            )}
          </Box>
        </Box>
      </Flex>

      {/* ---------- ACTIONS BELOW PANELS ---------- */}
      <Flex justify="flex-end" gap={3} maxW="1300px" mx="auto" w="100%" pb={4}>
        {onCancel && (
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button
          colorPalette="brand"
          onClick={handleSave}
          disabled={!tableName.trim() || matchedTables.length === 0}
          loading={saveLoading}
        >
          <MdOutlineSave />
          Save Mapping
        </Button>
      </Flex>
    </VStack>
  );
};

export default MultipleMapping;
