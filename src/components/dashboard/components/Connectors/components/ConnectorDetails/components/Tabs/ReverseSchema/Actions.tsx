import { startTransition, useEffect, useState } from "react";

import { Button, Flex } from "@chakra-ui/react";

import { MdRefresh } from "react-icons/md";

import { useOutletContext } from "react-router";

import { toaster } from "@/components/ui/toaster";
import { Tooltip } from "@/components/ui/tooltip";
import useRefreshSchema from "@/queryOptions/connector/schema/useRefreshSchema";
import useUpdateSchema from "@/queryOptions/connector/schema/useUpdateSchema";
import useUpdateSchemaStatus from "@/queryOptions/connector/schema/useUpdateSchemaStatus";
import { type Connector } from "@/types/connectors";

import { useQueryClient } from "@tanstack/react-query";

const Actions = ({
  shouldShowDisabledState,
  setShouldShowDisabledState,
  onUpdateSchemaStart,
}: {
  shouldShowDisabledState: boolean;
  setShouldShowDisabledState: (_value: boolean) => void;
  onUpdateSchemaStart?: () => void;
}) => {
  const queryClient = useQueryClient();
  const context = useOutletContext<Connector>();
  const { connection_id } = context;

  const [activeOperation, setActiveOperation] = useState<
    "refresh" | "update" | null
  >(null);

  const { mutate: refreshSchema, isPending: isRefreshing } = useRefreshSchema({
    connectorId: connection_id,
  });
  const { mutate: updateSchema, isPending: isUpdating } = useUpdateSchema({
    connectorId: connection_id,
  });

  const { status: schemaStatus } = useUpdateSchemaStatus(connection_id, true);

  // Track if schema update/refresh is in progress via WebSocket or API
  const isSchemaOperationInProgress = schemaStatus?.is_in_progress || false;

  // Auto-enable and show success message when schema operation completes
  useEffect(() => {
    if (
      !isSchemaOperationInProgress &&
      !isUpdating &&
      !isRefreshing &&
      activeOperation !== null
    ) {
      startTransition(() => {
        setActiveOperation(null);
        setShouldShowDisabledState(false);
      });
    }
  }, [
    isSchemaOperationInProgress,
    isUpdating,
    isRefreshing,
    activeOperation,
    setShouldShowDisabledState,
  ]);

  const createButtonProps = (
    isPending: boolean,
    onAction: () => void,
    showGlobalLoading: boolean = false,
  ) => {
    // Show loading if the mutation is pending
    // For Update Schema, also show loading if a background operation is in progress
    const isLoading =
      isPending || (showGlobalLoading && isSchemaOperationInProgress);
    const isDisabled = shouldShowDisabledState && !isPending;

    return {
      onClick: () => {
        if (isDisabled) {
          toaster.warning({
            title: "Operation in progress",
            description:
              "Another migration is currently in progress. Please wait until it completes.",
          });
          return;
        }
        setShouldShowDisabledState(true);
        onAction();
      },
      loading: isLoading,
      disabled: isDisabled,
    };
  };

  const createTooltipProps = (isPending: boolean) => {
    const isDisabled = shouldShowDisabledState && !isPending;
    return {
      content: isDisabled
        ? "Another migration is currently in progress. Please wait until it completes."
        : "",
      disabled: !shouldShowDisabledState || isPending,
    };
  };

  return (
    <Flex
      justifyContent="flex-end"
      alignItems="center"
      flexWrap="wrap"
      gap={4}
      mb={2}
      w="100%"
    >
      <Tooltip {...createTooltipProps(isRefreshing)}>
        <Button
          variant="outline"
          colorPalette="brand"
          {...createButtonProps(
            isRefreshing,
            () => {
              setActiveOperation("refresh");
              refreshSchema(undefined, {
                onSuccess: () => {
                  // Immediately invalidate ReverseSchema on successful refresh with a delay
                  setTimeout(() => {
                    queryClient.invalidateQueries({
                      queryKey: ["ReverseSchema", connection_id],
                      refetchType: "active",
                    });
                  }, 500);
                },
                onError: () => {
                  setActiveOperation(null);
                  setShouldShowDisabledState(false);
                },
              });
            },
            false,
          )}
        >
          <MdRefresh />
          Refresh schema
        </Button>
      </Tooltip>

      <Tooltip {...createTooltipProps(isUpdating)}>
        <Button
          variant="outline"
          colorPalette="brand"
          {...createButtonProps(
            isUpdating,
            () => {
              setActiveOperation("update");
              onUpdateSchemaStart?.();
              updateSchema(undefined, {
                onError: () => {
                  setActiveOperation(null);
                  setShouldShowDisabledState(false);
                },
              });
            },
            true,
          )}
        >
          <MdRefresh />
          Update schema
        </Button>
      </Tooltip>
    </Flex>
  );
};

export default Actions;
