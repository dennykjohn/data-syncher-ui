import { startTransition, useEffect, useMemo, useRef, useState } from "react";

import { Button, Flex, Text } from "@chakra-ui/react";

import { MdRefresh } from "react-icons/md";

import { useOutletContext } from "react-router";

import { toaster } from "@/components/ui/toaster";
import { Tooltip } from "@/components/ui/tooltip";
import useFetchTableStatus from "@/queryOptions/connector/schema/useFetchTableStatus";
import useRefreshSchema from "@/queryOptions/connector/schema/useRefreshSchema";
import useUpdateSchema from "@/queryOptions/connector/schema/useUpdateSchema";
import useUpdateSchemaStatus from "@/queryOptions/connector/schema/useUpdateSchemaStatus";
import { type Connector } from "@/types/connectors";

import { useIsMutating } from "@tanstack/react-query";

const Actions = ({
  shouldShowDisabledState,
  setShouldShowDisabledState,
  onUpdateSchemaStart,
}: {
  shouldShowDisabledState: boolean;
  setShouldShowDisabledState: (_value: boolean) => void;
  onUpdateSchemaStart?: () => void;
}) => {
  const context = useOutletContext<Connector>();
  const { connection_id, target_database, target_schema } = context;

  const { mutate: refreshSchema, isPending: isRefreshing } = useRefreshSchema({
    connectorId: connection_id,
  });
  const { mutate: updateSchema, isPending: isUpdating } = useUpdateSchema({
    connectorId: connection_id,
  });

  const isRefreshSchemaInProgress = useIsMutating({
    mutationKey: ["refreshSchema", connection_id],
  });

  const isUpdateSchemaInProgress = useIsMutating({
    mutationKey: ["updateSchema", connection_id],
  });

  const [shouldPollSchemaStatus, setShouldPollSchemaStatus] = useState(false);

  const { status: schemaStatus } = useUpdateSchemaStatus(
    connection_id,
    shouldPollSchemaStatus || isUpdateSchemaInProgress > 0 || isUpdating,
  );

  const isRefreshDeltaTableInProgress = useIsMutating({
    mutationKey: ["refreshDeltaTable", connection_id],
  });

  const isReloadSingleTableInProgress = useIsMutating({
    mutationKey: ["reloadSingleTable", connection_id],
  });

  const [shouldPollRefreshStatus, setShouldPollRefreshStatus] = useState(false);

  const { data: tableStatusData } = useFetchTableStatus(
    connection_id,
    shouldPollRefreshStatus,
    shouldPollRefreshStatus,
  );

  const hasAnyTableInProgress = useMemo(() => {
    const hasTableInProgress =
      tableStatusData?.tables?.some(
        (table) => table.status === "in_progress",
      ) ?? false;
    const isDeltaTableRefreshing = isRefreshDeltaTableInProgress > 0;
    const isReloading = isReloadSingleTableInProgress > 0;
    return hasTableInProgress || isDeltaTableRefreshing || isReloading;
  }, [
    tableStatusData,
    isRefreshDeltaTableInProgress,
    isReloadSingleTableInProgress,
  ]);

  useEffect(() => {
    if (!hasAnyTableInProgress && shouldPollRefreshStatus && tableStatusData) {
      startTransition(() => {
        setShouldPollRefreshStatus(false);
        setShouldShowDisabledState(false);
      });
    }
  }, [
    hasAnyTableInProgress,
    shouldPollRefreshStatus,
    tableStatusData,
    setShouldShowDisabledState,
  ]);

  const hasShownCompletionMessage = useRef(false);
  const prevIsInProgress = useRef<boolean | undefined>(undefined);

  useEffect(() => {
    if (isUpdateSchemaInProgress > 0 || isUpdating) {
      startTransition(() => {
        setShouldPollSchemaStatus(true);
      });
    }
  }, [isUpdateSchemaInProgress, isUpdating]);

  useEffect(() => {
    if (
      isUpdateSchemaInProgress === 0 &&
      !isUpdating &&
      shouldShowDisabledState &&
      isRefreshSchemaInProgress === 0 &&
      !isRefreshing &&
      isRefreshDeltaTableInProgress === 0 &&
      isReloadSingleTableInProgress === 0 &&
      !hasAnyTableInProgress
    ) {
      const timer = setTimeout(() => {
        if (
          isUpdateSchemaInProgress === 0 &&
          !isUpdating &&
          shouldShowDisabledState
        ) {
          startTransition(() => {
            setShouldShowDisabledState(false);
            setShouldPollSchemaStatus(false);
          });
        }
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [
    isUpdateSchemaInProgress,
    isUpdating,
    shouldShowDisabledState,
    setShouldShowDisabledState,
    isRefreshSchemaInProgress,
    isRefreshing,
    isRefreshDeltaTableInProgress,
    isReloadSingleTableInProgress,
    hasAnyTableInProgress,
  ]);

  useEffect(() => {
    if (isUpdateSchemaInProgress === 0 && !isUpdating && !schemaStatus) {
      return;
    }

    const wasInProgress = prevIsInProgress.current;
    const isInProgress = schemaStatus?.is_in_progress;

    prevIsInProgress.current = isInProgress;

    const mutationCompleted = isUpdateSchemaInProgress === 0 && !isUpdating;
    const statusCompleted = schemaStatus ? !isInProgress : true;

    const noOtherOperations =
      isRefreshSchemaInProgress === 0 &&
      !isRefreshing &&
      isRefreshDeltaTableInProgress === 0 &&
      isReloadSingleTableInProgress === 0 &&
      !hasAnyTableInProgress;

    if (
      mutationCompleted &&
      statusCompleted &&
      shouldShowDisabledState &&
      noOtherOperations
    ) {
      if (!hasShownCompletionMessage.current && schemaStatus) {
        toaster.success({
          title: "Schema update completed",
          description:
            schemaStatus.message ||
            "All tables have been fetched and updated successfully.",
          duration: 5000,
        });
        hasShownCompletionMessage.current = true;
      }

      startTransition(() => {
        setShouldShowDisabledState(false);
        setShouldPollSchemaStatus(false);
      });
    }

    if (isInProgress && !wasInProgress) {
      hasShownCompletionMessage.current = false;
    }
  }, [
    schemaStatus,
    isUpdateSchemaInProgress,
    isUpdating,
    shouldShowDisabledState,
    setShouldShowDisabledState,
    isRefreshSchemaInProgress,
    isRefreshing,
    isRefreshDeltaTableInProgress,
    isReloadSingleTableInProgress,
    hasAnyTableInProgress,
  ]);

  const isRefreshButtonLoading =
    isRefreshing || (shouldPollRefreshStatus && hasAnyTableInProgress);

  const isAnyOperationInProgress =
    isRefreshSchemaInProgress > 0 ||
    isRefreshing ||
    isUpdateSchemaInProgress > 0 ||
    isUpdating ||
    schemaStatus?.is_in_progress === true ||
    isRefreshDeltaTableInProgress > 0 ||
    isReloadSingleTableInProgress > 0 ||
    hasAnyTableInProgress;

  const createButtonProps = (
    isButtonLoading: boolean,
    onAction: () => void,
  ) => {
    const isDisabled =
      (shouldShowDisabledState || isAnyOperationInProgress) && !isButtonLoading;

    return {
      onClick: () => {
        if (isDisabled) {
          toaster.warning({
            title: "Operation in progress",
            description:
              "Another migration is in progress. Please wait until it is complete.",
          });
          return;
        }
        setShouldShowDisabledState(true);
        onAction();
      },
      loading: isButtonLoading,
      disabled: isDisabled,
    };
  };

  const createTooltipProps = (isButtonLoading: boolean) => {
    const isDisabled =
      (shouldShowDisabledState || isAnyOperationInProgress) && !isButtonLoading;
    return {
      content: isDisabled
        ? "Another migration is in progress. Please wait until it is complete."
        : "",
      disabled:
        (!shouldShowDisabledState && !isAnyOperationInProgress) ||
        isButtonLoading,
    };
  };

  return (
    <Flex direction="column" gap={2} mb={2} minW="xl">
      <Flex w="100%">
        <Text fontWeight="semibold" flexGrow={1} w="100%">
          Destination Details
        </Text>
      </Flex>
      <Flex
        justifyContent="space-between"
        alignItems="center"
        flexWrap="wrap"
        gap={4}
      >
        <Flex gap={4}>
          <Flex gap={2}>
            <Text>Destination database:</Text>
            <Text fontWeight="semibold">{target_database}</Text>
          </Flex>
          <Flex gap={2}>
            <Text>Destination Schema:</Text>
            <Text fontWeight="semibold">{target_schema}</Text>
          </Flex>
        </Flex>
        <Flex gap={4}>
          <Tooltip {...createTooltipProps(isRefreshButtonLoading)}>
            <Button
              variant="outline"
              colorPalette="brand"
              {...createButtonProps(isRefreshButtonLoading, () => {
                refreshSchema(undefined, {
                  onSuccess: () => {
                    setShouldPollRefreshStatus(true);
                  },
                  onError: () => {
                    setShouldPollRefreshStatus(false);
                    setShouldShowDisabledState(false);
                  },
                });
              })}
            >
              <MdRefresh />
              Refresh schema
            </Button>
          </Tooltip>

          <Tooltip {...createTooltipProps(isUpdating)}>
            <Button
              variant="outline"
              colorPalette="brand"
              loading={isUpdating}
              disabled={
                (shouldShowDisabledState || isAnyOperationInProgress) &&
                !isUpdating
              }
              onClick={() => {
                if (
                  (shouldShowDisabledState || isAnyOperationInProgress) &&
                  !isUpdating
                ) {
                  toaster.warning({
                    title: "Operation in progress",
                    description:
                      "Another migration is in progress. Please wait until it is complete.",
                  });
                  return;
                }
                onUpdateSchemaStart?.();
                hasShownCompletionMessage.current = false;
                setShouldShowDisabledState(true);
                setShouldPollSchemaStatus(true);
                updateSchema(undefined, {
                  onSuccess: () => {},
                  onError: () => {
                    setShouldShowDisabledState(false);
                    setShouldPollSchemaStatus(false);
                    hasShownCompletionMessage.current = false;
                  },
                });
              }}
            >
              <MdRefresh />
              Update schema
            </Button>
          </Tooltip>
        </Flex>
      </Flex>
    </Flex>
  );
};

export default Actions;
