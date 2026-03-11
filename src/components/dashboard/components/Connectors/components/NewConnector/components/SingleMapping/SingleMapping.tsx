import React, { useMemo, useState } from "react";

import {
  Box,
  Button,
  Checkbox,
  Flex,
  Input,
  InputGroup,
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react";

import { FiInbox, FiSearch } from "react-icons/fi";
import { MdOutlineSave } from "react-icons/md";

import useFetchS3Files, {
  type S3ListFilesRequest,
} from "@/queryOptions/connector/useFetchS3Files";

export type Mapping = {
  fileName: string;
  tableName: string;
  isSelected?: boolean;
  /** True when the backend indicates this mapping is already active and should be locked. */
  alreadyMapped?: boolean;
};

interface SingleMappingProps {
  formValues: Record<string, string>;
  mappings: Mapping[];
  onCancel: () => void;
  onSaveMappings: (_mappings: Mapping[]) => void;
  loading?: boolean;
  readOnly?: boolean;
  connectionId?: number;
}

const extractTableName = (fileName: string) =>
  fileName.replace(/\.[^/.]+$/, "").toLowerCase();

const SingleMapping: React.FC<SingleMappingProps> = ({
  formValues,
  mappings,
  onCancel,
  onSaveMappings,
  loading,
  readOnly = false,
  connectionId,
}) => {
  const [localMappings, setLocalMappings] = useState<Mapping[]>(() => {
    // Initialize with props; scan will reconcile this later
    return mappings.map((m) => ({
      ...m,
      isSelected: m.isSelected ?? true,
    }));
  });
  const [_selectedFileName, setSelectedFileName] = useState<string | null>(
    null,
  );

  const hasRequiredCreds = useMemo(() => {
    if (connectionId) return true;
    return (
      !!formValues?.s3_bucket &&
      !!formValues?.aws_access_key_id &&
      !!formValues?.aws_secret_access_key
    );
  }, [formValues, connectionId]);

  const s3Params = useMemo(() => {
    if (!hasRequiredCreds) return null;
    return {
      s3_bucket: (formValues.s3_bucket || "").trim(),
      aws_access_key_id: (formValues.aws_access_key_id || "").trim(),
      aws_secret_access_key: (formValues.aws_secret_access_key || "").trim(),
      base_folder_path: formValues.base_folder_path || undefined,
      file_type: formValues.file_type || undefined,
      include_subfolders: formValues.include_subfolders || "false",
      file_mapping_method: formValues.file_mapping_method || undefined,
      connection_id: connectionId,
    } as S3ListFilesRequest;
  }, [
    hasRequiredCreds,
    formValues.s3_bucket,
    formValues.aws_access_key_id,
    formValues.aws_secret_access_key,
    formValues.base_folder_path,
    formValues.file_type,
    formValues.include_subfolders,
    formValues.file_mapping_method,
    connectionId,
  ]);

  const { data: s3Files, isPending: isS3Loading } = useFetchS3Files(
    s3Params ?? ({} as S3ListFilesRequest),
    !!s3Params && hasRequiredCreds,
  );

  // Helper to extract tables from S3 response
  const s3TableList = useMemo(() => {
    if (!s3Files) return [];
    if (Array.isArray(s3Files)) return s3Files;
    if (s3Files.tables && Array.isArray(s3Files.tables)) return s3Files.tables;
    return [];
  }, [s3Files]);

  const [searchFiles, setSearchFiles] = useState("");
  const [searchMappings, setSearchMappings] = useState("");

  // 1. Initial selection
  React.useEffect(() => {
    if (mappings.length > 0 && !_selectedFileName) {
      setSelectedFileName(mappings[0].fileName);
    }
  }, [mappings, _selectedFileName]);

  // 2. Reconcile state with S3 Scan results: Strictly only show files found in S3
  React.useEffect(() => {
    if (s3TableList.length > 0) {
      setLocalMappings(() => {
        // Build the current list strictly based on what S3 API returned
        return s3TableList.map((t) => {
          const fileName = (t.file_key || t.table) as string;
          const suggestedTableName = t.table || extractTableName(fileName);

          // Check if this file was in the initial mappings (saved configuration)
          const savedMapping = mappings.find((m) => m.fileName === fileName);

          const isLocked = !!t.already_mapped || !!t.table_name_locked;
          return {
            fileName,

            tableName:
              isLocked && t.mapped_table ? t.mapped_table : suggestedTableName,

            isSelected: !!savedMapping || isLocked,
            alreadyMapped: isLocked,
          };
        });
      });

      setSelectedFileName((prev) => {
        if (prev) return prev;
        const firstName = s3TableList.find(
          (t) => t.file_key || t.table,
        )?.file_key;
        return (firstName as string) || null;
      });
    }
  }, [s3TableList, mappings]);

  const filteredFiles = useMemo(() => {
    if (!searchFiles.trim()) return localMappings;
    return localMappings.filter((m) =>
      m.fileName.toLowerCase().includes(searchFiles.toLowerCase()),
    );
  }, [localMappings, searchFiles]);

  const filteredMappings = useMemo(() => {
    const selected = localMappings.filter((m) => m.isSelected);
    if (!searchMappings.trim()) return selected;
    return selected.filter(
      (m) =>
        m.fileName.toLowerCase().includes(searchMappings.toLowerCase()) ||
        m.tableName.toLowerCase().includes(searchMappings.toLowerCase()),
    );
  }, [localMappings, searchMappings]);

  const toggleFileSelection = (fileName: string, checked: boolean) => {
    if (readOnly) return;
    setLocalMappings((prev) =>
      prev.map((m) =>
        m.fileName === fileName ? { ...m, isSelected: checked } : m,
      ),
    );
  };

  const updateTableName = (fileName: string, tableName: string) => {
    setLocalMappings((prev) =>
      prev.map((m) => (m.fileName === fileName ? { ...m, tableName } : m)),
    );
  };

  const handleSave = () => {
    const selectedMappings = localMappings.filter((m) => m.isSelected);
    onSaveMappings(selectedMappings);
  };

  const isSaveDisabled =
    loading ||
    isS3Loading ||
    localMappings.length === 0 ||
    !localMappings.some((m) => m.isSelected && m.tableName.trim().length > 0);

  return (
    <VStack align="stretch" gap={4} p={4}>
      <Flex direction="column" align="center" gap={1} mt={2}>
        <Text fontSize="lg" fontWeight="semibold" textAlign="center">
          Map Files to Tables
        </Text>
      </Flex>

      {/* Grid Layout */}
      <Flex gap={4} h="450px" maxW="1300px" mx="auto" w="100%" mt={4}>
        {/* LEFT PANEL - Source Files */}
        <Flex direction="column" flex="1" gap={3}>
          {/* Search for Source Files */}
          <InputGroup startElement={<FiSearch color="gray.500" />} w="100%">
            <Input
              size="sm"
              placeholder="Search source files..."
              value={searchFiles}
              autoComplete="off"
              onChange={(e) => setSearchFiles(e.target.value)}
              bg="white"
            />
          </InputGroup>

          {/* Source Files List */}
          <Box
            flex="1"
            borderWidth={1}
            borderColor="gray.300"
            borderRadius="lg"
            bg="white"
            overflow="hidden"
            boxShadow="sm"
          >
            <Flex
              align="center"
              justify="space-between"
              px={4}
              h="44px"
              borderBottomWidth={1}
              borderBottomColor="gray.200"
              bg="gray.50"
            >
              <Text fontWeight="semibold" fontSize="sm">
                Source Files
              </Text>
              <Flex align="center" gap={2} minW="60px" justify="center" />
            </Flex>

            <Box overflowY="auto" h="calc(100% - 44px)">
              {isS3Loading ? (
                <VStack gap={2} align="center" py={6} color="gray.500">
                  <Spinner size="sm" />
                  <Text fontSize="sm">Loading files...</Text>
                </VStack>
              ) : !hasRequiredCreds ? (
                <VStack gap={2} align="center" py={6} color="gray.500">
                  <Text fontSize="sm" fontWeight="medium">
                    Provide S3 bucket and credentials to load files
                  </Text>
                </VStack>
              ) : filteredFiles.length === 0 ? (
                <VStack gap={2} align="center" py={6} color="gray.500">
                  <FiInbox size={20} />
                  <Text fontSize="sm" fontWeight="medium">
                    No files available
                  </Text>
                </VStack>
              ) : (
                filteredFiles.map((m) => {
                  return (
                    <Flex
                      key={m.fileName}
                      align="center"
                      justify="space-between"
                      h="44px"
                      px={4}
                      cursor={readOnly ? "default" : "pointer"}
                      bg="white"
                      borderBottomWidth={1}
                      borderBottomColor="gray.100"
                      _hover={!readOnly ? { bg: "gray.100" } : undefined}
                      onClick={() =>
                        !readOnly &&
                        toggleFileSelection(m.fileName, !m.isSelected)
                      }
                    >
                      <Text
                        fontSize="sm"
                        fontWeight="medium"
                        color="gray.900"
                        truncate
                        flex="1"
                      >
                        {m.fileName}
                      </Text>
                      <Box onClick={(e) => e.stopPropagation()}>
                        <Checkbox.Root
                          colorPalette="brand"
                          variant="solid"
                          checked={m.isSelected}
                          disabled={readOnly}
                          onCheckedChange={({ checked }) =>
                            !readOnly &&
                            toggleFileSelection(m.fileName, checked === true)
                          }
                        >
                          <Checkbox.HiddenInput />
                          <Checkbox.Control
                            cursor={readOnly ? "not-allowed" : "pointer"}
                          />
                        </Checkbox.Root>
                      </Box>
                    </Flex>
                  );
                })
              )}
            </Box>
          </Box>
        </Flex>

        {/* RIGHT PANEL - Table Mapping */}
        <Flex direction="column" flex="1" gap={3}>
          {/* Search for Mapped Tables */}
          <InputGroup startElement={<FiSearch color="gray.500" />} w="100%">
            <Input
              size="sm"
              placeholder="Search mapped tables..."
              value={searchMappings}
              autoComplete="off"
              onChange={(e) => setSearchMappings(e.target.value)}
              bg="white"
            />
          </InputGroup>

          {/* Table Mapping List */}
          <Box
            flex="1"
            borderWidth={1}
            borderColor="gray.300"
            borderRadius="lg"
            bg="white"
            overflow="hidden"
            boxShadow="sm"
          >
            <Flex
              align="center"
              justify="space-between"
              px={4}
              h="44px"
              borderBottomWidth={1}
              borderBottomColor="gray.200"
              bg="gray.50"
            >
              <Text fontWeight="semibold" fontSize="sm">
                Table Mapping
              </Text>
            </Flex>

            <Box overflowY="auto" h="calc(100% - 44px)">
              {isS3Loading ? (
                <VStack gap={2} align="center" py={6} color="gray.500">
                  <Spinner size="sm" />
                  <Text fontSize="sm">Loading files...</Text>
                </VStack>
              ) : !hasRequiredCreds ? (
                <VStack gap={2} align="center" py={6} color="gray.500">
                  <Text fontSize="sm" fontWeight="medium">
                    Provide S3 bucket and credentials to load files
                  </Text>
                </VStack>
              ) : filteredMappings.length === 0 ? (
                <VStack gap={2} align="center" py={6} color="gray.500">
                  <Text fontSize="sm" fontWeight="medium">
                    Select files from the left to configure table mapping
                  </Text>
                </VStack>
              ) : (
                filteredMappings.map((mapping) => {
                  const isLocked = !!mapping.alreadyMapped;
                  return (
                    <Flex
                      key={mapping.fileName}
                      align="center"
                      justify="space-between"
                      h="44px"
                      px={4}
                      bg={isLocked ? "gray.50" : "white"}
                      borderBottomWidth={1}
                      borderBottomColor="gray.100"
                    >
                      <Text
                        fontSize="sm"
                        fontWeight="medium"
                        truncate
                        w="100%"
                        color={isLocked ? "gray.500" : "gray.900"}
                        title={mapping.fileName}
                      >
                        {mapping.fileName}
                      </Text>

                      <Input
                        size="sm"
                        placeholder="Enter table name"
                        value={mapping.tableName}
                        autoComplete="off"
                        onChange={(e) =>
                          !isLocked &&
                          updateTableName(mapping.fileName, e.target.value)
                        }
                        readOnly={isLocked || readOnly}
                        disabled={isLocked || readOnly}
                        bg={isLocked || readOnly ? "gray.100" : undefined}
                        color={isLocked || readOnly ? "gray.500" : undefined}
                        cursor={
                          isLocked || readOnly ? "not-allowed" : undefined
                        }
                        borderColor={
                          isLocked || readOnly ? "gray.100" : undefined
                        }
                        w="280px"
                        h="32px"
                        fontSize="sm"
                      />
                    </Flex>
                  );
                })
              )}
            </Box>
          </Box>
        </Flex>
      </Flex>

      {/* Save/Cancel Buttons - Below both panels */}
      <Flex justify="flex-end" gap={3} maxW="1300px" mx="auto" w="100%">
        <Button variant="outline" onClick={onCancel}>
          {readOnly ? "Close" : "Cancel"}
        </Button>
        {!readOnly && (
          <Button
            colorPalette="brand"
            onClick={handleSave}
            loading={loading}
            disabled={isSaveDisabled}
          >
            <MdOutlineSave />
            Save Mapping
          </Button>
        )}
      </Flex>
    </VStack>
  );
};

export default SingleMapping;
