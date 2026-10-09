import {
  Badge,
  Box,
  Button,
  Flex,
  IconButton,
  Input,
  Link,
  Text,
} from "@chakra-ui/react";

import { FiEdit2 } from "react-icons/fi";

import { Tooltip } from "@/components/ui/tooltip";
import { type DestinationNameSource } from "@/utils/snowflakeDestinationTableName";

type DestinationTableFieldProps = {
  destinationTableName: string;
  jsonTableName: string | null;
  source: DestinationNameSource;
  defaultDisplayName: string;
  isEditing: boolean;
  editValue: string;
  error: string | null;
  warnings: string[];
  existingSnowflakeTable: boolean;
  confirmUseExisting: boolean;
  renamePrompt: {
    previous: string;
    next: string;
  } | null;
  onUseDefault: () => void;
  onStartEdit: () => void;
  onEditChange: (_value: string) => void;
  onCommitEdit: () => void;
  onCancelEdit: () => void;
  onConfirmUseExisting: () => void;
  onChooseAnotherName: () => void;
  onRenameChoice: (_mode: "create_new" | "rename_existing") => void;
};

const tagLabel = (source: DestinationNameSource) => {
  if (source === "JSON") return "From JSON";
  if (source === "MANUAL") return "Edited";
  return "Default";
};

const DestinationTableField = ({
  destinationTableName,
  jsonTableName,
  source,
  defaultDisplayName,
  isEditing,
  editValue,
  error,
  warnings,
  existingSnowflakeTable,
  confirmUseExisting,
  renamePrompt,
  onUseDefault,
  onStartEdit,
  onEditChange,
  onCommitEdit,
  onCancelEdit,
  onConfirmUseExisting,
  onChooseAnotherName,
  onRenameChoice,
}: DestinationTableFieldProps) => {
  const changedFromDefault =
    source !== "DEFAULT" &&
    Boolean(destinationTableName) &&
    Boolean(defaultDisplayName) &&
    destinationTableName.toUpperCase() !== defaultDisplayName.toUpperCase();

  return (
    <Box>
      <Text fontSize="sm" fontWeight="semibold" mb={1}>
        Destination table (Snowflake)
      </Text>
      <Flex gap={2} align="center" flexWrap="wrap">
        {isEditing ? (
          <>
            <Input
              size="sm"
              value={editValue}
              onChange={(e) => onEditChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") onCommitEdit();
                if (e.key === "Escape") onCancelEdit();
              }}
              autoFocus
              maxW="280px"
              fontFamily="mono"
            />
            <Button size="xs" colorPalette="brand" onClick={onCommitEdit}>
              Apply
            </Button>
            <Button size="xs" variant="ghost" onClick={onCancelEdit}>
              Cancel
            </Button>
          </>
        ) : (
          <>
            <Text fontSize="sm" fontFamily="mono" fontWeight="medium">
              {destinationTableName || "—"}
            </Text>
            <Tooltip
              content={
                jsonTableName
                  ? `Raw value in JSON: ${jsonTableName}`
                  : source === "DEFAULT"
                    ? "Default Snowflake table name for this entity"
                    : "Manually edited destination table"
              }
            >
              <Badge size="sm" variant="subtle" colorPalette="brand">
                {tagLabel(source)}
              </Badge>
            </Tooltip>
            {source === "JSON" && (
              <Link fontSize="xs" onClick={onUseDefault}>
                Use default name
              </Link>
            )}
            <Tooltip content="Edit destination table name">
              <IconButton
                size="xs"
                variant="ghost"
                aria-label="Edit destination table name"
                onClick={onStartEdit}
              >
                <FiEdit2 />
              </IconButton>
            </Tooltip>
          </>
        )}
      </Flex>
      {changedFromDefault && (
        <Text fontSize="xs" color="blue.700" mt={1}>
          Table will be created as {destinationTableName} (default was{" "}
          {defaultDisplayName})
        </Text>
      )}
      {warnings.map((w) => (
        <Text key={w} fontSize="xs" color="orange.600" mt={1}>
          {w}
        </Text>
      ))}
      {error && (
        <Text fontSize="xs" color="red.600" mt={1}>
          {error}
        </Text>
      )}
      {existingSnowflakeTable && !confirmUseExisting && (
        <Box mt={2} p={2} borderWidth={1} borderRadius="md" borderColor="orange.200">
          <Text fontSize="xs" mb={2}>
            A Snowflake table named {destinationTableName} already exists and was
            not created by this mapping. Use the existing table or choose
            another name.
          </Text>
          <Flex gap={2}>
            <Button size="xs" colorPalette="brand" onClick={onConfirmUseExisting}>
              Use existing table
            </Button>
            <Button size="xs" variant="outline" onClick={onChooseAnotherName}>
              Choose another name
            </Button>
          </Flex>
        </Box>
      )}
      {renamePrompt && (
        <Box mt={2} p={2} borderWidth={1} borderRadius="md" borderColor="gray.200">
          <Text fontSize="xs" mb={2}>
            Data was already loaded into {renamePrompt.previous}. Destination is
            now {renamePrompt.next}. Choose how to proceed.
          </Text>
          <Flex gap={2} wrap="wrap">
            <Button
              size="xs"
              colorPalette="brand"
              onClick={() => onRenameChoice("create_new")}
            >
              Create new table and full reload
            </Button>
            <Button
              size="xs"
              variant="outline"
              onClick={() => onRenameChoice("rename_existing")}
            >
              Rename existing table
            </Button>
          </Flex>
        </Box>
      )}
    </Box>
  );
};

export default DestinationTableField;
