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

import EditBatchModal from "./EditBatchModal";

interface BatchCardProps {
  batch: MigrationBatch;
  connectionId: number;
}

const BatchCard = ({ batch, connectionId }: BatchCardProps) => {
  const [expanded, setExpanded] = useState(true);
  const [isRenaming, setIsRenaming] = useState(false);
  const [nameDraft, setNameDraft] = useState(batch.name);
  const [isEditOpen, setIsEditOpen] = useState(false);

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
        onError: () => {
          toaster.error({ title: "Could not rename batch" });
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

  return (
    <>
      <Box
        borderWidth={1}
        borderColor="gray.300"
        borderRadius="lg"
        bgColor="white"
        overflow="hidden"
      >
        <Flex
          alignItems="center"
          gap={2}
          px={3}
          py={2}
          bgColor="gray.50"
          borderBottomWidth={expanded ? 1 : 0}
          borderColor="gray.200"
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
                  onDoubleClick={() => {
                    setNameDraft(batch.name);
                    setIsRenaming(true);
                  }}
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
                  <Menu.Item
                    value="rename"
                    onClick={() => {
                      setNameDraft(batch.name);
                      setIsRenaming(true);
                    }}
                  >
                    <FiEdit2 /> Rename
                  </Menu.Item>
                  <Menu.Item value="edit" onClick={() => setIsEditOpen(true)}>
                    <FiEdit2 /> Edit batch
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
          <Flex direction="column" gap={1} p={2} minH={0}>
            {batch.tables.length === 0 && (
              <Text fontSize="xs" color="gray.500" px={2} py={2}>
                No tables in this batch yet. Move tables from the list.
              </Text>
            )}
            {batch.tables.length > 0 && (
              <Box maxH="220px" overflowY="auto" minH={0}>
                {batch.tables
                  .slice()
                  .sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0))
                  .map((t, index) => (
                    <Flex
                      key={t.table_name}
                      alignItems="center"
                      gap={2}
                      bgColor={index % 2 === 0 ? "gray.50" : "white"}
                      px={2}
                      py={1.5}
                      borderRadius="sm"
                    >
                      <Text fontSize="sm" flex="1" title={t.table_name}>
                        {t.table_name}
                      </Text>
                      {t.last_synced && (
                        <Text fontSize="xs" color="gray.500">
                          {t.last_synced}
                        </Text>
                      )}
                      <IconButton
                        aria-label={`Remove ${t.table_name}`}
                        size="xs"
                        variant="ghost"
                        onClick={() => handleRemoveTable(t.table_name)}
                      >
                        <MdClose />
                      </IconButton>
                    </Flex>
                  ))}
              </Box>
            )}
          </Flex>
        )}
      </Box>

      <EditBatchModal
        open={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        connectionId={connectionId}
        batch={batch}
      />
    </>
  );
};

export default BatchCard;
