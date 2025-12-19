import { startTransition, useEffect, useMemo, useRef, useState } from "react";

import { Button, Flex, Text } from "@chakra-ui/react";

import { MdRefresh } from "react-icons/md";

import { useOutletContext } from "react-router";

import { toaster } from "@/components/ui/toaster";
import { Tooltip } from "@/components/ui/tooltip";
import useFetchTableStatus from "@/queryOptions/connector/schema/useFetchTableStatus";
import useRefreshSchema from "@/queryOptions/connector/schema/useRefreshSchema";
import useUpdateSchema from "@/queryOptions/connector/schema/useUpdateSchema";
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

  // Track refresh schema mutation status
  const isRefreshSchemaInProgress = useIsMutating({
    mutationKey: ["refreshSchema", connection_id],
  });

  // Track refresh delta table mutation status (to disable other buttons)
  const isRefreshDeltaTableInProgress = useIsMutating({
    mutationKey: ["refreshDeltaTable", connection_id],
  });

  // Track reload single table mutation status (to disable other buttons)
  const isReloadSingleTableInProgress = useIsMutating({
    mutationKey: ["reloadSingleTable", connection_id],
  });

  // Track when to poll table status for refresh schema button
  const [shouldPollRefreshStatus, setShouldPollRefreshStatus] = useState(false);
  const prevIsRefreshInProgress = useRef(0);

  // Start polling table status when refresh schema mutation begins
  useEffect(() => {
    const wasInProgress = prevIsRefreshInProgress.current > 0;
    const isInProgress = isRefreshSchemaInProgress > 0 || isRefreshing;

    // If refresh mutation just started, enable polling
    if (!wasInProgress && isInProgress) {
      startTransition(() => {
        setShouldPollRefreshStatus(true);
      });
    }

    prevIsRefreshInProgress.current = isInProgress ? 1 : 0;
  }, [isRefreshSchemaInProgress, isRefreshing]);

  // Poll get_table_status API - always enabled to check for any in-progress tables
  const { data: tableStatusData } = useFetchTableStatus(
    connection_id,
    true, // Always enabled to check table status (for both refresh schema and refresh delta table)
  );

  // Check if any table has "in_progress" status from get_table_status API
  // OR if refresh delta table mutation is in progress OR reload single table is in progress
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

  // Stop polling when no tables are in progress (keep polling until all tables complete)
  useEffect(() => {
    if (!hasAnyTableInProgress && shouldPollRefreshStatus && tableStatusData) {
      // Only stop if we have data and no tables are in progress
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

  // Refresh button should show loading if mutation is pending OR tables are in progress
  // Same logic as reload button: check both mutation state and table status from API
  const isRefreshButtonLoading =
    isRefreshing || (shouldPollRefreshStatus && hasAnyTableInProgress);

  const createButtonProps = (
    isButtonLoading: boolean,
    onAction: () => void,
  ) => {
    const isDisabled =
      (shouldShowDisabledState || hasAnyTableInProgress) && !isButtonLoading;

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
      (shouldShowDisabledState || hasAnyTableInProgress) && !isButtonLoading;
    return {
      content: isDisabled
        ? "Another migration is in progress. Please wait until it is complete."
        : "",
      disabled:
        (!shouldShowDisabledState && !hasAnyTableInProgress) || isButtonLoading,
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
                setShouldPollRefreshStatus(true); // Start polling immediately
                refreshSchema(undefined);
                // State will be cleared when get_table_status shows all tables are completed
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
              {...createButtonProps(isUpdating, () => {
                onUpdateSchemaStart?.();
                updateSchema(undefined, {
                  onSettled: () => {
                    setShouldShowDisabledState(false);
                  },
                });
              })}
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
