import { useReducer, useState } from "react";

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
import usePermissions from "@/hooks/usePermissions";
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
  const [chunkCountError, setChunkCountError] = useState<string | null>(null);
  const { can } = usePermissions();

  const canEdit = can("can_edit_connection_settings");
  const canDelete = can("can_delete_connectors");

  const {
    sync_start_date,
    time_frequency,
    safety_interval,
    execution_order,
    chunk_count,
    effective_max_chunk,
    min_count,
    max_count,
    status,
    dst_min_count,
    dst_max_count,
  } = props;

  const minChunkCount = min_count ?? dst_min_count ?? 10;
  const maxChunkCount = max_count ?? dst_max_count ?? 1000000;
  const transferPacketSize =
    chunk_count ?? effective_max_chunk ?? minChunkCount;

  const initialFormState = {
    sync_start_date: sync_start_date ?? "",
    time_frequency: time_frequency ?? "",
    safety_interval: safety_interval ?? "",
    execution_order: execution_order ?? "",
    chunk_count: Math.min(
      Math.max(transferPacketSize, minChunkCount),
      maxChunkCount,
    ),
  };

  const [formState, dispatch] = useReducer(reducer, initialFormState);
  const [syncStartLocal, setSyncStartLocal] = useState(
    toLocalDateTimeInput(formState?.sync_start_date),
  );

  const { mutate: updateSettings, isPending: isUpdateOperationPending } =
    useUpdateConnectionSettings({
      connectorId: props.connection_id,
    });

  const { mutate: testConnection, isPending: isTestOperationPending } =
    useTestConnection({ connectorId: props.connection_id });

  return (
    <Flex direction="column" gap={4} mb={8}>
      <Stack gap="8" flexWrap="wrap" direction="row">
        <Field.Root maxW="sm" disabled={!canEdit}>
          <Field.Label>Start date & time (UTC)</Field.Label>
          <Input
            placeholder="Choose date and time"
            type="datetime-local"
            value={syncStartLocal ?? ""}
            disabled={!canEdit}
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

        <Field.Root maxW="sm" disabled={!canEdit}>
          <Field.Label>Sync Frequency</Field.Label>
          <NativeSelect.Root disabled={!canEdit}>
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

        <Field.Root maxW="sm" disabled={!canEdit}>
          <Field.Label>Safety Interval</Field.Label>
          <NativeSelect.Root disabled={!canEdit}>
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

        <Field.Root maxW="sm" disabled={!canEdit}>
          <Field.Label>Execution Order</Field.Label>
          <NativeSelect.Root disabled={!canEdit}>
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

        <Field.Root maxW="sm" disabled={!canEdit} invalid={!!chunkCountError}>
          <Field.Label>Transfer packet size</Field.Label>
          <NumberInput.Root
            disabled={!canEdit}
            min={minChunkCount}
            max={maxChunkCount}
            value={String(formState.chunk_count ?? minChunkCount)}
            onValueChange={(e) => {
              const value = Number(e.value);
              if (isNaN(value)) return;

              dispatch({
                type: "SET_FIELD",
                field: "chunk_count",
                value: value,
              });
              setChunkCountError(null);
            }}
          >
            <NumberInput.Control />
            <NumberInput.Input />
          </NumberInput.Root>
          {chunkCountError ? (
            <Field.ErrorText>{chunkCountError}</Field.ErrorText>
          ) : (
            <Field.HelperText fontSize="xs" color="gray.600" mt={1}>
              Min count: {minChunkCount.toLocaleString()} | Max count:{" "}
              {maxChunkCount.toLocaleString()}
            </Field.HelperText>
          )}
        </Field.Root>
      </Stack>

      <Flex justifyContent={"space-between"} mt={4}>
        <Flex gap={4}>
          {canDelete && (
            <>
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
            </>
          )}
        </Flex>
        <Flex gap={4}>
          <Button
            variant="outline"
            colorPalette="brand"
            color="brand.500"
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
            disabled={!canEdit}
            onClick={() => {
              setChunkCountError(null);
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
                  onError: (error: unknown) => {
                    const err = error as {
                      response?: {
                        data?: {
                          chunk_count?: string | string[];
                          message?: string;
                        };
                      };
                    };
                    const errors = err.response?.data;
                    if (errors && (errors.chunk_count || errors.message)) {
                      const msg =
                        (Array.isArray(errors.chunk_count)
                          ? errors.chunk_count[0]
                          : errors.chunk_count || errors.message) || null;
                      setChunkCountError(msg);
                    }
                  },
                },
              );
            }}
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
