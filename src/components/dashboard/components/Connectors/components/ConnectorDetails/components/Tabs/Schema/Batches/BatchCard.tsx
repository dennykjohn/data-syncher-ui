import { useState } from "react";

import {
  Box,
  Flex,
  IconButton,
  Input,
  Menu,
  Portal,
  Text,
} from "@chakra-ui/react";

import { FiEdit2, FiMoreVertical, FiTrash2 } from "react-icons/fi";
import { IoCaretDownSharp } from "react-icons/io5";
import { MdClose } from "react-icons/md";

import { toaster } from "@/components/ui/toaster";
import {
  useDeleteBatch,
  useRemoveTableFromBatch,
  useUpdateBatch,
} from "@/queryOptions/connector/schema/useBatches";
import { type MigrationBatch } from "@/types/connectors";

interface BatchCardProps {
  batch: MigrationBatch;
  connectionId: number;
}

const BatchCard = ({ batch, connectionId }: BatchCardProps) => {
  const [expanded, setExpanded] = useState(true);
  const [isRenaming, setIsRenaming] = useState(false);
  const [nameDraft, setNameDraft] = useState(batch.name);

  const { mutate: updateBatch } = useUpdateBatch(connectionId);
  const { mutate: deleteBatch, isPending: isDeleting } =
    useDeleteBatch(connectionId);
  const { mutate: removeTable } = useRemoveTableFromBatch(connectionId);

  const commitRename = () => {
    const next = nameDraft.trim();
    setIsRenaming(false);
    if (!next || next === batch.name) {
      setNameDraft(batch.name);
      return;
    }
    updateBatch(
      { batchId: batch.id, payload: { name: next } },
      {
        onSuccess: () => toaster.success({ title: "Batch renamed" }),
        onError: (err: unknown) => {
          const message =
            (err as { response?: { data?: { error?: string } } })?.response
              ?.data?.error ?? "Could not rename batch";
          toaster.error({ title: message });
          setNameDraft(batch.name);
        },
      },
    );
  };

  const handleDelete = () => {
    deleteBatch(batch.id, {
      onSuccess: () => toaster.success({ title: "Batch deleted" }),
      onError: () => toaster.error({ title: "Could not delete batch" }),
    });
  };

  const handleRemoveTable = (tableName: string) => {
    removeTable(
      { batchId: batch.id, tableName },
      {
        onSuccess: () =>
          toaster.success({ title: `Removed ${tableName} from batch` }),
        onError: () => toaster.error({ title: "Could not remove table" }),
      },
    );
  };

  const startRename = () => {
    setNameDraft(batch.name);
    setIsRenaming(true);
  };

  return (
    <Box
      borderWidth={1}
      borderColor="gray.200"
      borderRadius="md"
      bgColor="white"
      overflow="hidden"
      flexShrink={0}
    >
      <Flex
        alignItems="center"
        gap={2}
        px={3}
        py={2.5}
        minH="40px"
        bgColor="gray.50"
        borderBottomWidth={expanded ? 1 : 0}
        borderColor="gray.200"
        flexShrink={0}
      >
        <Box
          onClick={() => setExpanded((p) => !p)}
          cursor="pointer"
          color="gray.600"
          transform={expanded ? "rotate(0deg)" : "rotate(-90deg)"}
          transition="transform 0.15s ease"
        >
          <IoCaretDownSharp />
        </Box>

        <Box flex="1" minW={0}>
          {isRenaming ? (
            <Input
              size="xs"
              value={nameDraft}
              autoFocus
              onChange={(e) => setNameDraft(e.target.value)}
              onBlur={commitRename}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitRename();
                else if (e.key === "Escape") {
                  setNameDraft(batch.name);
                  setIsRenaming(false);
                }
              }}
            />
          ) : (
            <Flex alignItems="center" gap={2}>
              <Text
                fontSize="sm"
                fontWeight="semibold"
                onDoubleClick={startRename}
                cursor="text"
                title="Double-click to rename"
                overflow="hidden"
                textOverflow="ellipsis"
                whiteSpace="nowrap"
              >
                {batch.name}
              </Text>
              <Text fontSize="xs" color="gray.500">
                ({batch.table_count})
              </Text>
            </Flex>
          )}
        </Box>

        <Menu.Root>
          <Menu.Trigger asChild>
            <IconButton aria-label="Batch actions" size="xs" variant="ghost">
              <FiMoreVertical />
            </IconButton>
          </Menu.Trigger>
          <Portal>
            <Menu.Positioner>
              <Menu.Content>
                <Menu.Item value="rename" onClick={startRename}>
                  <FiEdit2 /> Rename
                </Menu.Item>
                <Menu.Item
                  value="delete"
                  color="red.600"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  <FiTrash2 /> Delete batch
                </Menu.Item>
              </Menu.Content>
            </Menu.Positioner>
          </Portal>
        </Menu.Root>
      </Flex>

      {expanded && (
        <Box px={2} py={2} bg="white">
          {batch.tables.length === 0 && (
            <Text fontSize="xs" color="gray.500" px={2} py={2}>
              No tables in this batch yet. Move tables from the list.
            </Text>
          )}
          {batch.tables.length > 0 && (
            <Box
              maxH={batch.tables.length > 6 ? "240px" : undefined}
              overflowY={batch.tables.length > 6 ? "auto" : "visible"}
              borderWidth={1}
              borderColor="gray.100"
              borderRadius="md"
            >
              {batch.tables
                .slice()
                .sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0))
                .map((t, index) => (
                  <Flex
                    key={t.table_name}
                    alignItems="center"
                    gap={2}
                    minH="36px"
                    bgColor={index % 2 === 0 ? "gray.50" : "white"}
                    px={2.5}
                    py={2}
                    borderBottomWidth={index < batch.tables.length - 1 ? 1 : 0}
                    borderColor="gray.100"
                  >
                    <Text
                      fontSize="sm"
                      flex="1"
                      minW={0}
                      lineHeight="short"
                      truncate
                      title={t.table_name}
                    >
                      {t.table_name}
                    </Text>
                    <IconButton
                      aria-label={`Remove ${t.table_name}`}
                      size="xs"
                      variant="ghost"
                      flexShrink={0}
                      color="gray.500"
                      _hover={{ color: "red.500", bg: "red.50" }}
                      onClick={() => handleRemoveTable(t.table_name)}
                    >
                      <MdClose />
                    </IconButton>
                  </Flex>
                ))}
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};

export default BatchCard;
