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
              dispatch({
                type: "SET_FIELD",
                field: "sync_start_date",
                value: e.currentTarget.value,
              });
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
            min={10000}
            max={1000000}
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
        </Field.Root>
      </Stack>
      <Flex justifyContent={"space-between"} mt={4}>
        <Flex>
          <Button
            variant="ghost"
            colorPalette="red"
            color="red.500"
            loading={isTestOperationPending}
            onClick={() =>
              testConnection(undefined, {
                onSuccess: () => {
                  toaster.success({
                    title: "Connection test initiated",
                    description:
                      "The connection test has been initiated. Please check the logs for detailed results.",
                  });
                },
              })
            }
          >
            <MdRefresh />
            Test connection
          </Button>
        </Flex>
        <Flex gap={4}>
          <Button
            variant="outline"
            colorPalette="red"
            color="red.500"
            onClick={() => setShowDeleteDialog(true)}
          >
            <CiTrash />
            Delete
          </Button>
          <Button
            colorPalette="brand"
            onClick={() =>
              updateSettings(
                {
                  sync_start_date: fromLocalDateTimeInput(syncStartLocal),
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
