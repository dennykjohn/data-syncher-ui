import { startTransition, useEffect, useReducer, useState } from "react";

import {
  Button,
  Field,
  Flex,
  Input,
  NativeSelect,
  NumberInput,
  Stack,
} from "@chakra-ui/react";

import { CiTrash } from "react-icons/ci";
import { MdRefresh } from "react-icons/md";

import { toaster } from "@/components/ui/toaster";
import { Tooltip } from "@/components/ui/tooltip";
import useUpdateConnectionSettings from "@/queryOptions/connector/schema/useUpdateConnectionSettings";
import useTestConnection from "@/queryOptions/connector/useTestConnection";
import { type Connector } from "@/types/connectors";

import DeleteConfirmationDialog from "./DeleteConfirmationDialog";
import {
  executionOrderOptions,
  fromLocalDateTimeInput,
  safetyIntervalOptions,
  syncFrequenciesOptions,
  toLocalDateTimeInput,
} from "./helpers";
import { reducer } from "./reducer";

const Form = (props: Connector) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const {
    sync_start_date,
    time_frequency,
    safety_interval,
    execution_order,
    chunk_count,
    status,
    dst_min_count,
    dst_max_count,
  } = props;

  const initialFormState = {
    sync_start_date: sync_start_date ?? "",
    time_frequency: time_frequency ?? "",
    safety_interval: safety_interval ?? "",
    execution_order: execution_order ?? "",
    chunk_count: typeof chunk_count === "number" ? chunk_count : undefined,
  };

  const [formState, dispatch] = useReducer(reducer, initialFormState);
  const [syncStartLocal, setSyncStartLocal] = useState(
    toLocalDateTimeInput(formState?.sync_start_date),
  );

  // Update syncStartLocal when sync_start_date prop changes
  useEffect(() => {
    if (sync_start_date) {
      const localValue = toLocalDateTimeInput(sync_start_date);
      startTransition(() => {
        setSyncStartLocal(localValue);
      });
      dispatch({
        type: "SET_FIELD",
        field: "sync_start_date",
        value: sync_start_date,
      });
    }
  }, [sync_start_date]);

  const { mutate: updateSettings, isPending: isUpdateOperationPending } =
    useUpdateConnectionSettings({
      connectorId: props.connection_id,
    });

  const { mutate: testConnection, isPending: isTestOperationPending } =
    useTestConnection({ connectorId: props.connection_id });

  return (
    <Flex direction="column" gap={4} mb={8}>
      <Stack gap="8" flexWrap="wrap" direction="row">
        <Field.Root maxW="sm">
          <Field.Label>Start date & time (UTC)</Field.Label>
          <Input
            placeholder="Choose date and time"
            type="datetime-local"
            value={syncStartLocal ?? ""}
            onChange={(e) => {
              // Convert local datetime-local value to UTC ISO and store that in formState
              const iso = fromLocalDateTimeInput(e.currentTarget.value);
              dispatch({
                type: "SET_FIELD",
                field: "sync_start_date",
                value: iso ?? "",
              });
              // Keep the local representation for the input control
              setSyncStartLocal(e.currentTarget.value);
            }}
          />
        </Field.Root>

        <Field.Root maxW="sm">
          <Field.Label>Sync Frequency</Field.Label>
          <NativeSelect.Root>
            <NativeSelect.Field
              value={formState.time_frequency}
              onChange={(e) =>
                dispatch({
                  type: "SET_FIELD",
                  field: "time_frequency",
                  value: e.currentTarget.value,
                })
              }
            >
              {syncFrequenciesOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </NativeSelect.Field>
            <NativeSelect.Indicator />
          </NativeSelect.Root>
        </Field.Root>

        <Field.Root maxW="sm">
          <Field.Label>Safety Interval</Field.Label>
          <NativeSelect.Root>
            <NativeSelect.Field
              value={formState.safety_interval}
              onChange={(e) =>
                dispatch({
                  type: "SET_FIELD",
                  field: "safety_interval",
                  value: e.currentTarget.value,
                })
              }
            >
              {safetyIntervalOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </NativeSelect.Field>
            <NativeSelect.Indicator />
          </NativeSelect.Root>
        </Field.Root>

        <Field.Root maxW="sm">
          <Field.Label>Execution Order</Field.Label>
          <NativeSelect.Root>
            <NativeSelect.Field
              value={formState.execution_order}
              onChange={(e) =>
                dispatch({
                  type: "SET_FIELD",
                  field: "execution_order",
                  value: e.currentTarget.value,
                })
              }
            >
              {executionOrderOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </NativeSelect.Field>
            <NativeSelect.Indicator />
          </NativeSelect.Root>
        </Field.Root>

        <Field.Root maxW="sm">
          <Field.Label>Transfer order count</Field.Label>
          <NumberInput.Root
            defaultValue="10"
            min={dst_min_count || 10000}
            max={dst_max_count || 1000000}
            step={10000}
            value={String(formState.chunk_count)}
            onValueChange={(e) => {
              dispatch({
                type: "SET_FIELD",
                field: "chunk_count",
                value: Number(e.value),
              });
            }}
          >
            <NumberInput.Control />
            <NumberInput.Input />
          </NumberInput.Root>
          <Field.HelperText fontSize="xs" color="gray.600" mt={1}>
            Min count: {dst_min_count?.toLocaleString() || "10,000"} | Max
            count: {dst_max_count?.toLocaleString() || "1,000,000"}
          </Field.HelperText>
        </Field.Root>
      </Stack>

      <Flex justifyContent={"space-between"} mt={4}>
        <Flex gap={4}>
          {status === "A" ? (
            <Tooltip content="Cannot delete an active connector">
              <Button
                variant="outline"
                colorPalette="red"
                color="red.500"
                onClick={() => setShowDeleteDialog(true)}
                disabled
              >
                <CiTrash />
                Delete
              </Button>
            </Tooltip>
          ) : (
            <Button
              variant="outline"
              colorPalette="red"
              color="red.500"
              onClick={() => setShowDeleteDialog(true)}
            >
              <CiTrash />
              Delete
            </Button>
          )}
        </Flex>
        <Flex gap={4}>
          <Button
            variant="ghost"
            colorPalette="red"
            color="red.500"
            loading={isTestOperationPending}
            onClick={() =>
              testConnection(undefined, {
                onSuccess: (response) => {
                  toaster.success({
                    title:
                      response.data?.message || "Connection test initiated",
                  });
                },
              })
            }
          >
            <MdRefresh />
            Test connection
          </Button>
          <Button
            colorPalette="brand"
            onClick={() =>
              updateSettings(
                {
                  ...formState,
                },
                {
                  onSuccess: () => {
                    toaster.success({
                      title: "Connector settings updated",
                    });
                  },
                },
              )
            }
            loading={isUpdateOperationPending}
          >
            <MdRefresh />
            Update
          </Button>
        </Flex>
      </Flex>

      {showDeleteDialog && (
        <DeleteConfirmationDialog
          open={showDeleteDialog}
          setShowDeleteDialog={setShowDeleteDialog}
          connectorId={props.connection_id}
        />
      )}
    </Flex>
  );
};

export default Form;
