import { useState } from "react";

import {
  Button,
  CloseButton,
  Dialog,
  Field,
  Flex,
  Input,
  Portal,
} from "@chakra-ui/react";

import { toaster } from "@/components/ui/toaster";
import {
  useAddTablesToBatch,
  useCreateBatch,
} from "@/queryOptions/connector/schema/useBatches";
import {
  type BatchExecutionOrder,
  type MigrationBatch,
} from "@/types/connectors";

import ScheduleEditor, { type ScheduleValue } from "./ScheduleEditor";

interface NewBatchModalProps {
  open: boolean;
  onClose: () => void;
  connectionId: number;
  /**
   * Suggested default name. Pass e.g. `Batch ${batches.length + 1}`.
   */
  defaultName?: string;
  /**
   * If provided, after creating the batch these tables will be assigned to it.
   */
  tablesToAssign?: string[];
  onCreated?: (_batch: MigrationBatch) => void;
}

const DEFAULT_SCHEDULE: ScheduleValue = {
  time_frequency: 15,
  execution_order: "parallel" as BatchExecutionOrder,
  sync_start_date: null,
};

const NewBatchModal = ({
  open,
  onClose,
  connectionId,
  defaultName,
  tablesToAssign,
  onCreated,
}: NewBatchModalProps) => {
  const [name, setName] = useState<string>(defaultName ?? "");
  const [schedule, setSchedule] = useState<ScheduleValue>(DEFAULT_SCHEDULE);
  const [formSource, setFormSource] = useState({
    open: false,
    defaultName: defaultName ?? "",
  });

  if (
    open &&
    (formSource.open !== open || formSource.defaultName !== (defaultName ?? ""))
  ) {
    setFormSource({ open, defaultName: defaultName ?? "" });
    setName(defaultName ?? "");
    setSchedule(DEFAULT_SCHEDULE);
  }

  const { mutate: createBatch, isPending: isCreating } =
    useCreateBatch(connectionId);
  const { mutateAsync: addTables, isPending: isAssigning } =
    useAddTablesToBatch(connectionId);

  const handleSubmit = () => {
    createBatch(
      {
        name: name.trim() || undefined,
        time_frequency: String(schedule.time_frequency),
        execution_order: schedule.execution_order,
        sync_start_date: schedule.sync_start_date,
      },
      {
        onSuccess: async (response) => {
          const batch = response?.data as MigrationBatch | undefined;
          toaster.success({ title: "Batch created" });

          if (batch && tablesToAssign && tablesToAssign.length > 0) {
            try {
              await addTables({
                batchId: batch.id,
                payload: { tables: tablesToAssign },
              });
            } catch {
              toaster.warning({
                title: "Batch created, but could not assign tables",
              });
            }
          }

          onCreated?.(batch as MigrationBatch);
          onClose();
        },
        onError: () => {
          toaster.error({ title: "Could not create batch" });
        },
      },
    );
  };

  return (
    <Dialog.Root lazyMount open={open} size="md">
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>Create new batch</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <Flex direction="column" gap={4}>
                <Field.Root>
                  <Field.Label>Name</Field.Label>
                  <Input
                    size="sm"
                    placeholder={defaultName ?? "Batch name"}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoFocus
                  />
                </Field.Root>

                <ScheduleEditor value={schedule} onChange={setSchedule} />
              </Flex>
            </Dialog.Body>
            <Dialog.Footer>
              <Dialog.ActionTrigger asChild>
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
              </Dialog.ActionTrigger>
              <Button
                colorPalette="brand"
                loading={isCreating || isAssigning}
                onClick={handleSubmit}
              >
                Create batch
              </Button>
            </Dialog.Footer>
            <Dialog.CloseTrigger asChild>
              <CloseButton size="sm" onClick={onClose} />
            </Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
};

export default NewBatchModal;
