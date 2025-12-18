import { useMemo } from "react";

import { Button, Flex, Text } from "@chakra-ui/react";

import { MdRefresh } from "react-icons/md";

import { useOutletContext } from "react-router";

import { toaster } from "@/components/ui/toaster";
import { Tooltip } from "@/components/ui/tooltip";
import useFetchSelectedTables from "@/queryOptions/connector/schema/useFetchSelectedTables";
import useRefreshSchema from "@/queryOptions/connector/schema/useRefreshSchema";
import useUpdateSchema from "@/queryOptions/connector/schema/useUpdateSchema";
import { type Connector } from "@/types/connectors";

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

  const { data: selectedTablesData } = useFetchSelectedTables(connection_id);

  const hasAnyTableInProgress = useMemo(() => {
    return (
      selectedTablesData?.tables?.some(
        (table) => table.status === "in_progress",
      ) ?? false
    );
  }, [selectedTablesData]);

  const { mutate: refreshSchema, isPending: isRefreshing } = useRefreshSchema({
    connectorId: connection_id,
  });
  const { mutate: updateSchema, isPending: isUpdating } = useUpdateSchema({
    connectorId: connection_id,
  });

  const createButtonProps = (isPending: boolean, onAction: () => void) => {
    const isDisabled =
      (shouldShowDisabledState || hasAnyTableInProgress) && !isPending;

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
      loading: isPending,
      disabled: isDisabled,
    };
  };

  const createTooltipProps = (isPending: boolean) => {
    const isDisabled =
      (shouldShowDisabledState || hasAnyTableInProgress) && !isPending;
    return {
      content: isDisabled
        ? "Another migration is in progress. Please wait until it is complete."
        : "",
      disabled:
        (!shouldShowDisabledState && !hasAnyTableInProgress) || isPending,
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
          <Tooltip {...createTooltipProps(isRefreshing)}>
            <Button
              variant="outline"
              colorPalette="brand"
              {...createButtonProps(isRefreshing, () => {
                refreshSchema(undefined, {
                  onSettled: () => {
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
