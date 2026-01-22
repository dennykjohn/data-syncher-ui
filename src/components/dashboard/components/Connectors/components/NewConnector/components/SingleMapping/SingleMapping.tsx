import React, { useMemo, useState } from "react";

import {
  Box,
  Button,
  Checkbox,
  Flex,
  Input,
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react";

import { FiInbox, FiSearch } from "react-icons/fi";
import { MdOutlineSave } from "react-icons/md";

import useFetchS3Files, {
  type S3ListFilesRequest,
} from "@/queryOptions/connector/useFetchS3Files";

type Mapping = {
  fileName: string;
  tableName: string;
  isSelected?: boolean;
};

interface SingleMappingProps {
  formValues: Record<string, string>;
  mappings: Mapping[];
  onCancel: () => void;
  onSaveMappings: (_mappings: Mapping[]) => void;
  loading?: boolean;
}

const extractTableName = (fileName: string) =>
  fileName.replace(/\.[^/.]+$/, "").toLowerCase();

const SingleMapping: React.FC<SingleMappingProps> = ({
  formValues,
  mappings,
  onCancel,
  onSaveMappings,
  loading,
}) => {
  const [searchFiles, setSearchFiles] = useState("");
  const [searchMappings, setSearchMappings] = useState("");
  const [localMappings, setLocalMappings] = useState<Mapping[]>(
    mappings.map((m) => ({ ...m, isSelected: m.isSelected ?? true })),
  );
  const [_selectedFileName, setSelectedFileName] = useState<string | null>(
    mappings.length > 0 ? mappings[0].fileName : null,
  );

  const hasRequiredCreds = useMemo(
    () =>
      !!formValues?.s3_bucket &&
      !!formValues?.aws_access_key_id &&
      !!formValues?.aws_secret_access_key,
    [formValues],
  );

  const s3Params = useMemo(() => {
    if (!hasRequiredCreds) return null;
    return {
      s3_bucket: (formValues.s3_bucket || "").trim(),
      aws_access_key_id: (formValues.aws_access_key_id || "").trim(),
      aws_secret_access_key: (formValues.aws_secret_access_key || "").trim(),
      base_folder_path: formValues.base_folder_path || undefined,
      file_type: formValues.file_type || undefined,
    } as S3ListFilesRequest;
  }, [hasRequiredCreds, formValues]);

  const { data: s3Files, isPending: isS3Loading } = useFetchS3Files(
    s3Params ?? ({} as S3ListFilesRequest),
    !!s3Params && hasRequiredCreds,
  );

  // Sync state with props during render to avoid useEffect cascading renders
  const [prevPropsMappings, setPrevPropsMappings] = useState(mappings);
  if (prevPropsMappings !== mappings) {
    setPrevPropsMappings(mappings);
    setLocalMappings(
      mappings.map((m) => ({ ...m, isSelected: m.isSelected ?? true })),
    );
    setSelectedFileName(mappings.length > 0 ? mappings[0].fileName : null);
  }

  // Sync state with S3 files during render to avoid useEffect cascading renders
  const [lastS3Files, setLastS3Files] = useState(s3Files);
  if (lastS3Files !== s3Files) {
    setLastS3Files(s3Files);

    if (s3Files?.tables && s3Files.tables.length > 0) {
      setLocalMappings((prev) => {
        const existing = new Set(prev.map((m) => m.fileName));
        const additions = s3Files.tables
          .filter((t) => {
            const name = t.file_key || t.table;
            return name && !existing.has(name);
          })
          .map((t) => ({
            fileName: (t.file_key || t.table) as string,
            tableName:
              t.table || extractTableName((t.file_key || t.table) as string),
            isSelected: false,
          }));

        if (additions.length === 0) return prev;
        return [...prev, ...additions];
      });

      setSelectedFileName((prevFileName) => {
        if (prevFileName) return prevFileName;
        const firstName = s3Files.tables.find(
          (t) => t.file_key || t.table,
        )?.file_key;
        return (firstName as string) || null;
      });
    }
  }

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
      <Flex direction="column" align="center" gap={1} mt={8}>
        <Text fontSize="lg" fontWeight="semibold" textAlign="center">
          Map Files to Tables
        </Text>
      </Flex>

      {/* Grid Layout - Both panels same width and height */}
      <Flex gap={4} h="480px" maxW="1000px" mx="auto" w="100%" mt={8}>
        {/* LEFT PANEL - Source Files */}
        <Flex direction="column" flex="1" gap={3}>
          {/* Search for Source Files */}
          <Flex
            align="center"
            gap={2}
            borderWidth={1}
            borderRadius="md"
            px={3}
            h="40px"
            bg="white"
            borderColor="gray.300"
          >
            <FiSearch color="gray.500" size={16} />
            <Input
              size="sm"
              border="none"
              _focusVisible={{ boxShadow: "none" }}
              placeholder="Search source files..."
              value={searchFiles}
              onChange={(e) => setSearchFiles(e.target.value)}
            />
          </Flex>

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
              h="64px"
              borderBottomWidth={1}
              borderBottomColor="gray.200"
              bg="gray.50"
            >
              <Text fontWeight="semibold" fontSize="sm">
                Source Files
              </Text>
              <Text
                fontWeight="semibold"
                fontSize="sm"
                textAlign="center"
                minW="60px"
              >
                Select
              </Text>
            </Flex>

            <Box overflowY="auto" h="calc(100% - 64px)">
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
                filteredFiles.map((m, index) => {
                  return (
                    <Flex
                      key={m.fileName}
                      align="center"
                      justify="space-between"
                      h="52px"
                      px={4}
                      cursor="pointer"
                      bg={index % 2 === 0 ? "white" : "gray.50"}
                      borderBottomWidth={1}
                      borderBottomColor="gray.100"
                      _hover={{ bg: "gray.100" }}
                      onClick={() => setSelectedFileName(m.fileName)}
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
                          onCheckedChange={({ checked }) =>
                            toggleFileSelection(m.fileName, checked === true)
                          }
                        >
                          <Checkbox.HiddenInput />
                          <Checkbox.Control cursor="pointer" />
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
          <Flex
            align="center"
            gap={2}
            borderWidth={1}
            borderRadius="md"
            px={3}
            h="40px"
            bg="white"
            borderColor="gray.300"
          >
            <FiSearch color="gray.500" size={16} />
            <Input
              size="sm"
              border="none"
              _focusVisible={{ boxShadow: "none" }}
              placeholder="Search mapped tables..."
              value={searchMappings}
              onChange={(e) => setSearchMappings(e.target.value)}
            />
          </Flex>

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
              h="64px"
              borderBottomWidth={1}
              borderBottomColor="gray.200"
              bg="gray.50"
            >
              <Text fontWeight="semibold" fontSize="sm">
                Table Mapping
              </Text>
            </Flex>

            <Box overflowY="auto" h="calc(100% - 64px)">
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
                filteredMappings.map((mapping, idx) => (
                  <Flex
                    key={mapping.fileName}
                    align="center"
                    justify="space-between"
                    h="52px"
                    px={4}
                    bg={idx % 2 === 0 ? "white" : "gray.50"}
                    borderBottomWidth={1}
                    borderBottomColor="gray.100"
                  >
                    <Text
                      fontSize="sm"
                      fontWeight="medium"
                      truncate
                      flex="1"
                      mr={3}
                      title={mapping.fileName}
                    >
                      {mapping.fileName}
                    </Text>

                    <Input
                      size="sm"
                      placeholder="Enter table name"
                      value={mapping.tableName}
                      onChange={(e) =>
                        updateTableName(mapping.fileName, e.target.value)
                      }
                      disabled={false}
                      w="200px"
                      h="36px"
                    />
                  </Flex>
                ))
              )}
            </Box>
          </Box>
        </Flex>
      </Flex>

      {/* Save/Cancel Buttons - Below both panels */}
      <Flex justify="flex-end" gap={3} maxW="1000px" mx="auto" w="100%">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          colorPalette="brand"
          onClick={handleSave}
          loading={loading}
          disabled={isSaveDisabled}
        >
          <MdOutlineSave />
          Save Mapping
        </Button>
      </Flex>
    </VStack>
  );
};

export default SingleMapping;
