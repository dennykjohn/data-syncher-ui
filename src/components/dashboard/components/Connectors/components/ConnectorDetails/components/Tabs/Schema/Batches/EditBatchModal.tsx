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
import { useUpdateBatch } from "@/queryOptions/connector/schema/useBatches";
import {
  type BatchExecutionOrder,
  type MigrationBatch,
} from "@/types/connectors";

import ScheduleEditor, { type ScheduleValue } from "./ScheduleEditor";

interface EditBatchModalProps {
  open: boolean;
  onClose: () => void;
  connectionId: number;
  batch: MigrationBatch;
}

const EditBatchModal = ({
  open,
  onClose,
  connectionId,
  batch,
}: EditBatchModalProps) => {
  const [name, setName] = useState<string>(batch.name);
  const [schedule, setSchedule] = useState<ScheduleValue>({
    time_frequency: Number(batch.time_frequency) || 15,
    execution_order: batch.execution_order as BatchExecutionOrder,
    sync_start_date: batch.sync_start_date,
  });

  const { mutate: updateBatch, isPending } = useUpdateBatch(connectionId);

  const handleSubmit = () => {
    updateBatch(
      {
        batchId: batch.id,
        payload: {
          name: name.trim() || batch.name,
          time_frequency: String(schedule.time_frequency),
          execution_order: schedule.execution_order,
          sync_start_date: schedule.sync_start_date,
        },
      },
      {
        onSuccess: () => {
          toaster.success({ title: "Batch updated" });
          onClose();
        },
        onError: () => {
          toaster.error({ title: "Could not update batch" });
        },
      },
    );
  };

  return (
    <Dialog.Root
      lazyMount
      open={open}
      size="md"
      onOpenChange={(e) => {
        if (e.open) {
          setName(batch.name);
          setSchedule({
            time_frequency: Number(batch.time_frequency) || 15,
            execution_order: batch.execution_order as BatchExecutionOrder,
            sync_start_date: batch.sync_start_date,
          });
        }
      }}
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>Edit batch</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <Flex direction="column" gap={4}>
                <Field.Root>
                  <Field.Label>Name</Field.Label>
                  <Input
                    size="sm"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
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
                loading={isPending}
                onClick={handleSubmit}
              >
                Save changes
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

export default EditBatchModal;
