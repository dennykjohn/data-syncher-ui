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
  onUpdateSchemaComplete,
  reloadingTables,
}: {
  shouldShowDisabledState: boolean;
  setShouldShowDisabledState: (_value: boolean) => void;
  onUpdateSchemaComplete?: () => void;
  reloadingTables: string[];
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

  // The hook's refetchInterval will handle stopping if not in progress.
  const { data: schemaStatus } = useUpdateSchemaStatus(
    connection_id,
    true,
    shouldPollSchemaStatus,
  );

  const isRefreshDeltaTableInProgress = useIsMutating({
    mutationKey: ["refreshDeltaTable", connection_id],
  });

  const [shouldPollRefreshStatus, setShouldPollRefreshStatus] = useState(false);

  const isReloadSingleTableInProgress = useIsMutating({
    mutationKey: ["reloadSingleTable", connection_id],
  });

  const { data: tableStatusData } = useFetchTableStatus(
    connection_id,
    true,
    shouldPollRefreshStatus,
  );

  const hasAnyTableInProgress = useMemo(() => {
    const hasTableInProgress =
      tableStatusData?.tables?.some(
        (table) => table.status === "in_progress",
      ) ?? false;
    const isDeltaTableRefreshing = isRefreshDeltaTableInProgress > 0;
    const isReloading =
      isReloadSingleTableInProgress > 0 ||
      (reloadingTables && reloadingTables.length > 0);

    return hasTableInProgress || isDeltaTableRefreshing || isReloading;
  }, [
    tableStatusData,
    isRefreshDeltaTableInProgress,
    isReloadSingleTableInProgress,
    reloadingTables,
  ]);

  useEffect(() => {
    if (shouldPollRefreshStatus && tableStatusData) {
      const isSchemaRefreshFinished =
        tableStatusData.schema_refresh_in_progress === false;
      const isSchemaRefreshActive =
        tableStatusData.schema_refresh_in_progress === true;

      if (
        isSchemaRefreshFinished ||
        (!hasAnyTableInProgress && !isSchemaRefreshActive)
      ) {
        startTransition(() => {
          setShouldPollRefreshStatus(false);
          setShouldShowDisabledState(false);
        });
      }
    }
  }, [
    hasAnyTableInProgress,
    shouldPollRefreshStatus,
    tableStatusData,
    setShouldShowDisabledState,
  ]);

  useEffect(() => {
    if (isUpdateSchemaInProgress > 0 || isUpdating) {
      startTransition(() => {
        setShouldPollSchemaStatus(true);
      });
    }
  }, [isUpdateSchemaInProgress, isUpdating]);

  const hasCheckedRefreshRef = useRef(false);
  useEffect(() => {
    if (hasCheckedRefreshRef.current) return;

    if (isRefreshSchemaInProgress > 0 || isRefreshing) {
      hasCheckedRefreshRef.current = true;
      startTransition(() => {
        setShouldPollRefreshStatus(true);
        setShouldShowDisabledState(true);
      });
    }
  }, [isRefreshSchemaInProgress, isRefreshing, setShouldShowDisabledState]);

  const hasCheckedUpdateRef = useRef(false);
  useEffect(() => {
    if (hasCheckedUpdateRef.current) return;

    if (
      isUpdateSchemaInProgress > 0 ||
      isUpdating ||
      schemaStatus?.is_in_progress ||
      hasAnyTableInProgress
    ) {
      hasCheckedUpdateRef.current = true;
      startTransition(() => {
        if (schemaStatus?.is_in_progress) {
          setShouldPollSchemaStatus(true);
        }
        if (hasAnyTableInProgress) {
          setShouldPollRefreshStatus(true);
        }
        setShouldShowDisabledState(true);
      });
    }
  }, [
    isUpdateSchemaInProgress,
    isUpdating,
    schemaStatus,
    hasAnyTableInProgress,
    setShouldShowDisabledState,
  ]);

  useEffect(() => {
    if (
      isUpdateSchemaInProgress === 0 &&
      !isUpdating &&
      shouldShowDisabledState &&
      isRefreshSchemaInProgress === 0 &&
      !isRefreshing &&
      !hasAnyTableInProgress &&
      tableStatusData?.schema_refresh_in_progress !== true
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
    hasAnyTableInProgress,
    tableStatusData?.schema_refresh_in_progress,
  ]);

  useEffect(() => {
    if (
      shouldPollSchemaStatus &&
      schemaStatus &&
      !schemaStatus.is_in_progress
    ) {
      startTransition(() => {
        setShouldPollSchemaStatus(false);
        setShouldShowDisabledState(false);
        onUpdateSchemaComplete?.();
      });
    }
  }, [
    shouldPollSchemaStatus,
    schemaStatus,
    setShouldShowDisabledState,
    onUpdateSchemaComplete,
  ]);

  const isRefreshButtonLoading = isRefreshing || isRefreshSchemaInProgress > 0;

  const isAnyOperationInProgress =
    isRefreshSchemaInProgress > 0 ||
    isRefreshing ||
    isUpdateSchemaInProgress > 0 ||
    isUpdating ||
    schemaStatus?.is_in_progress === true ||
    tableStatusData?.schema_refresh_in_progress === true ||
    hasAnyTableInProgress;

  const isUpdateSchemaFlowInProgress =
    isUpdating || !!(shouldPollSchemaStatus && schemaStatus?.is_in_progress);

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
              "Another migration is currently in progress. Please wait until it completes.",
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
        ? "Another migration is currently in progress. Please wait until it completes."
        : "",
      disabled:
        (!shouldShowDisabledState && !isAnyOperationInProgress) ||
        isButtonLoading,
    };
  };

  return (
    <Flex
      justifyContent="space-between"
      alignItems="center"
      flexWrap="wrap"
      gap={4}
      mb={2}
      minW="xl"
    >
      <Flex direction="column" gap={2}>
        <Text fontWeight="semibold">Destination Details</Text>
        <Flex gap={12} alignItems="center" flexWrap="wrap">
          <Flex gap={2}>
            <Text color="gray.600">Database:</Text>
            <Text fontWeight="semibold">{target_database}</Text>
          </Flex>
          <Flex gap={2}>
            <Text color="gray.600">Schema:</Text>
            <Text fontWeight="semibold">{target_schema}</Text>
          </Flex>
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

        <Tooltip {...createTooltipProps(isUpdateSchemaFlowInProgress)}>
          <Button
            variant="outline"
            colorPalette="brand"
            loading={isUpdateSchemaFlowInProgress}
            disabled={
              (shouldShowDisabledState || isAnyOperationInProgress) &&
              !isUpdateSchemaFlowInProgress
            }
            onClick={() => {
              if (
                (shouldShowDisabledState || isAnyOperationInProgress) &&
                !isUpdateSchemaFlowInProgress
              ) {
                toaster.warning({
                  title: "Operation in progress",
                  description:
                    "Another migration is currently in progress. Please wait until it completes.",
                });
                return;
              }
              setShouldShowDisabledState(true);
              updateSchema(undefined, {
                onSuccess: () => {
                  setShouldPollSchemaStatus(true);
                },
                onError: () => {
                  setShouldShowDisabledState(false);
                  setShouldPollSchemaStatus(false);
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
  );
};

export default Actions;
