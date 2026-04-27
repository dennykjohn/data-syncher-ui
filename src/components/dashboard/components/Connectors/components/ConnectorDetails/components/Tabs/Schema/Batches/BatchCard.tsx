import { useState } from "react";

import {
  Badge,
  Box,
  Button,
  Flex,
  IconButton,
  Input,
  Menu,
  Portal,
  Text,
} from "@chakra-ui/react";

import { FiEdit2, FiMoreVertical, FiTrash2 } from "react-icons/fi";
import { IoMdPause, IoMdPlay } from "react-icons/io";
import { IoCaretDownSharp } from "react-icons/io5";
import { MdClose, MdPlayArrow } from "react-icons/md";

import { toaster } from "@/components/ui/toaster";
import {
  useDeleteBatch,
  useRemoveTableFromBatch,
  useRunBatchNow,
  useToggleBatch,
  useUpdateBatch,
} from "@/queryOptions/connector/schema/useBatches";
import { type MigrationBatch } from "@/types/connectors";

import EditBatchModal from "./EditBatchModal";
import { frequencyLabel } from "./scheduleOptions";

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
  const { mutate: runNow, isPending: isRunning } = useRunBatchNow(connectionId);
  const { mutate: toggle, isPending: isToggling } =
    useToggleBatch(connectionId);
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

  const handleRunNow = () => {
    if (batch.tables.length === 0) {
      toaster.warning({ title: "Batch has no tables" });
      return;
    }
    runNow(batch.id, {
      onSuccess: () => toaster.success({ title: `Running ${batch.name}` }),
      onError: () => toaster.error({ title: "Could not start batch" }),
    });
  };

  const handleToggle = () => {
    toggle(batch.id, {
      onSuccess: () =>
        toaster.success({
          title:
            batch.status === "active"
              ? `${batch.name} paused`
              : `${batch.name} resumed`,
        }),
      onError: () => toaster.error({ title: "Could not update batch status" }),
    });
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

  const isPaused = batch.status === "paused";

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

          <Flex gap={1} alignItems="center">
            <Badge size="sm" colorPalette="blue" variant="subtle">
              {frequencyLabel(batch.time_frequency)}
            </Badge>
            <Badge
              size="sm"
              colorPalette={
                batch.execution_order === "parallel" ? "purple" : "teal"
              }
              variant="subtle"
            >
              {batch.execution_order}
            </Badge>
            {isPaused && (
              <Badge size="sm" colorPalette="orange">
                Paused
              </Badge>
            )}
          </Flex>

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
                    value="run"
                    onClick={handleRunNow}
                    disabled={isRunning || batch.tables.length === 0}
                  >
                    <MdPlayArrow /> Run now
                  </Menu.Item>
                  <Menu.Item
                    value="toggle"
                    onClick={handleToggle}
                    disabled={isToggling}
                  >
                    {isPaused ? <IoMdPlay /> : <IoMdPause />}{" "}
                    {isPaused ? "Resume" : "Pause"}
                  </Menu.Item>
                  <Menu.Item value="edit" onClick={() => setIsEditOpen(true)}>
                    <FiEdit2 /> Edit schedule
                  </Menu.Item>
                  <Menu.Item
                    value="rename"
                    onClick={() => {
                      setNameDraft(batch.name);
                      setIsRenaming(true);
                    }}
                  >
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
          <Flex direction="column" gap={1} p={2}>
            {batch.tables.length === 0 && (
              <Text fontSize="xs" color="gray.500" px={2} py={2}>
                No tables in this batch yet. Move tables from the list.
              </Text>
            )}
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

            <Flex mt={1} justifyContent="flex-end" gap={2}>
              <Button
                size="xs"
                variant="ghost"
                onClick={handleToggle}
                loading={isToggling}
              >
                {isPaused ? <IoMdPlay /> : <IoMdPause />}
                {isPaused ? "Resume" : "Pause"}
              </Button>
              <Button
                size="xs"
                colorPalette="brand"
                variant="outline"
                onClick={handleRunNow}
                loading={isRunning}
                disabled={batch.tables.length === 0}
              >
                <MdPlayArrow />
                Run now
              </Button>
            </Flex>
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
