import {
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { Box, Flex, For, Image, Skeleton, Text } from "@chakra-ui/react";

import { RxDragHandleDots2 } from "react-icons/rx";
import { SlRefresh } from "react-icons/sl";

import { useOutletContext } from "react-router";

import CheckIcon from "@/assets/icons/check-icon.svg";
import ErrorIcon from "@/assets/icons/error-icon.svg";
import SandtimeIcon from "@/assets/icons/sand-time-icon.svg";
import { toaster } from "@/components/ui/toaster";
import { Tooltip } from "@/components/ui/tooltip";
import useFetchTableStatus from "@/queryOptions/connector/schema/useFetchTableStatus";
import useRefreshDeltaTable from "@/queryOptions/connector/schema/useRefreshDeltaTable";
import useUpdateSelectedTables from "@/queryOptions/connector/schema/useUpdateSelectedTables";
import {
  type Connector,
  type ConnectorSelectedTable,
  type ConnectorTable,
} from "@/types/connectors";

import { useQueryClient } from "@tanstack/react-query";

const SelectedTable = ({
  shouldShowDisabledState,
  setShouldShowDisabledState,
  selectedTablesFromMain,
}: {
  shouldShowDisabledState: boolean;
  setShouldShowDisabledState: (_value: boolean) => void;
  selectedTablesFromMain: ConnectorTable[];
}) => {
  const context = useOutletContext<Connector>();
  const queryClient = useQueryClient();

  const [refreshingTable, setRefreshingTable] = useState<string | null>(null);

  const { mutate: updateTables, isPending: isAssigningTables } =
    useUpdateSelectedTables({
      connectorId: context.connection_id,
    });

  const { mutate: refreshDeltaTable, isPending: isRefreshingDeltaTable } =
    useRefreshDeltaTable({ connectionId: context.connection_id });

  // Track when to poll table status for refresh delta table button
  const [shouldPollDeltaTableStatus, setShouldPollDeltaTableStatus] =
    useState(false);

  // Always fetch table status to show current state
  // Poll continuously only when shouldPollDeltaTableStatus is true (after button click)
  const { data: tableStatusData } = useFetchTableStatus(
    context.connection_id,
    true, // Always enabled to fetch initial status
    shouldPollDeltaTableStatus, // Only force polling when refresh is active
  );

  // Merge selected tables from main list with status from get_table_status API
  const selectedTables = useMemo(() => {
    if (!selectedTablesFromMain || selectedTablesFromMain.length === 0) {
      return [];
    }

    return selectedTablesFromMain.map((table) => {
      const statusFromAPI = tableStatusData?.tables?.find(
        (t) => t.table === table.table,
      );
      return {
        tbl_id: 0, // Not used, but required by type
        table: table.table,
        sequence: table.sequence || 0,
        status: (statusFromAPI?.status || null) as
          | "in_progress"
          | "completed"
          | "failed"
          | null,
      };
    });
  }, [selectedTablesFromMain, tableStatusData]);

  const hasExistingMigrations = useMemo(() => {
    if (!tableStatusData?.tables) return false;
    return tableStatusData.tables.some(
      (table) => table.status === "in_progress",
    );
  }, [tableStatusData]);

  const getTableStatus = useCallback(
    (tableName: string) => {
      return tableStatusData?.tables?.find((t) => t.table === tableName)
        ?.status;
    },
    [tableStatusData],
  );

  useEffect(() => {
    if (
      !refreshingTable ||
      !shouldPollDeltaTableStatus ||
      !tableStatusData?.tables
    ) {
      return;
    }

    const tableStatus = tableStatusData.tables.find(
      (t) => t.table === refreshingTable,
    )?.status;

    if (tableStatus && tableStatus !== "in_progress") {
      startTransition(() => {
        setShouldPollDeltaTableStatus(false);
        setRefreshingTable(null);
        setShouldShowDisabledState(false);
      });
    }
  }, [
    refreshingTable,
    tableStatusData,
    shouldPollDeltaTableStatus,
    setShouldShowDisabledState,
  ]);

  // Set shouldShowDisabledState when there are existing migrations
  useEffect(() => {
    if (hasExistingMigrations) {
      setShouldShowDisabledState(true);
    } else {
      if (!refreshingTable) {
        setShouldShowDisabledState(false);
      }
    }
  }, [hasExistingMigrations, refreshingTable, setShouldShowDisabledState]);

  // Drag and drop state
  const [draggedItem, setDraggedItem] = useState<null | ConnectorSelectedTable>(
    null,
  );
  const handleDragStart = (table: ConnectorSelectedTable) => {
    setDraggedItem(table);
  };
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); // Allow drop
  };
  const handleDrop = (targetItem: ConnectorSelectedTable) => {
    if (!draggedItem || draggedItem.table === targetItem.table) return;

    const newList = [...(selectedTables || [])];
    const draggedIndex = newList.findIndex(
      (i) => i.table === draggedItem.table,
    );
    const targetIndex = newList.findIndex((i) => i.table === targetItem.table);

    newList.splice(draggedIndex, 1);
    newList.splice(targetIndex, 0, {
      ...draggedItem,
      status: draggedItem.status ?? null,
    });

    const tablesToUpdate = newList.map((t) => t.table);
    updateTables(
      { selected_tables: tablesToUpdate },
      {
        onSuccess: () => {
          toaster.success({ title: "Table order updated successfully" });
        },
      },
    );
    setDraggedItem(null);
  };

  return (
    <Flex
      direction="column"
      gap={2}
      borderWidth={1}
      borderColor="gray.300"
      borderRadius="lg"
      padding={4}
      bgColor="white"
    >
      <Flex mb={4} justifyContent="space-between" alignItems="center">
        <Text fontSize="sm" fontWeight="semibold">
          Selected Tables
        </Text>
        <Flex gap={3} alignItems="center">
          <Text
            fontSize="sm"
            fontWeight="semibold"
            textAlign="center"
            minW="40px"
          >
            Status
          </Text>
          <Text
            fontSize="sm"
            fontWeight="semibold"
            textAlign="center"
            minW="40px"
          >
            Refresh
          </Text>
          <Box minW="40px" />
        </Flex>
      </Flex>
      {isAssigningTables && (
        <For each={[...Array(10).keys()]}>
          {(_, index) => <Skeleton gap="4" height={8} key={index} />}
        </For>
      )}
      {!selectedTables?.length && !isAssigningTables && (
        <Flex direction="column" alignItems="center">
          <Text>No Tables available</Text>
        </Flex>
      )}
      {!isAssigningTables &&
        selectedTables?.map((table, index) => {
          const isEven = index % 2 === 0;
          const rowBg = isEven ? "gray.100" : "white";
          const { status } = table;

          return (
            <Flex
              key={table.table}
              justifyContent="space-between"
              backgroundColor={rowBg}
              alignItems="center"
              padding={2}
              borderRadius={4}
              draggable
              onDragStart={() => handleDragStart(table)}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(table)}
            >
              <Flex gap={2} alignItems="center" flex="1">
                <Text fontSize="sm">{table.table}</Text>
              </Flex>
              <Flex gap={3} alignItems="center">
                <Flex justifyContent="center" minW="40px">
                  {status === "in_progress" && <Image src={SandtimeIcon} />}
                  {status === "completed" && <Image src={CheckIcon} />}
                  {status === "failed" && <Image src={ErrorIcon} />}
                </Flex>
                <Flex justifyContent="center" minW="40px">
                  <Tooltip
                    content={
                      (shouldShowDisabledState || hasExistingMigrations) &&
                      !(
                        refreshingTable === table.table &&
                        (isRefreshingDeltaTable ||
                          getTableStatus(table.table) === "in_progress")
                      )
                        ? "Another migration is in progress. Please wait until it is complete."
                        : ""
                    }
                    disabled={
                      !(shouldShowDisabledState || hasExistingMigrations) ||
                      (refreshingTable === table.table &&
                        (isRefreshingDeltaTable ||
                          getTableStatus(table.table) === "in_progress"))
                    }
                  >
                    <Box
                      _hover={{
                        color:
                          (shouldShowDisabledState || hasExistingMigrations) &&
                          !(
                            refreshingTable === table.table &&
                            (isRefreshingDeltaTable ||
                              getTableStatus(table.table) === "in_progress")
                          )
                            ? "gray.400"
                            : "brand.500",
                        cursor:
                          (shouldShowDisabledState || hasExistingMigrations) &&
                          !(
                            refreshingTable === table.table &&
                            (isRefreshingDeltaTable ||
                              getTableStatus(table.table) === "in_progress")
                          )
                            ? "not-allowed"
                            : "pointer",
                      }}
                      p={1}
                      borderRadius="sm"
                      onClick={() => {
                        const isThisTableRefreshing =
                          (refreshingTable === table.table &&
                            isRefreshingDeltaTable) ||
                          (refreshingTable === table.table &&
                            getTableStatus(table.table) === "in_progress");
                        if (
                          (shouldShowDisabledState || hasExistingMigrations) &&
                          !isThisTableRefreshing
                        ) {
                          toaster.warning({
                            title: "Operation in progress",
                            description:
                              "Another migration is in progress. Please wait until it is complete.",
                          });
                          return;
                        }
                        setShouldShowDisabledState(true);
                        setRefreshingTable(table.table);
                        refreshDeltaTable(
                          {
                            connection_id: context.connection_id,
                            table_name: table.table,
                          },
                          {
                            onSuccess: () => {
                              // Start polling get_table_status only after refresh delta API completes
                              setShouldPollDeltaTableStatus(true);
                              // Trigger immediate refetch of get_table_status API
                              queryClient.invalidateQueries({
                                queryKey: [
                                  "TableStatus",
                                  context.connection_id,
                                ],
                              });
                            },
                            onError: () => {
                              // Stop polling and re-enable buttons on error
                              setShouldPollDeltaTableStatus(false);
                              setRefreshingTable(null);
                              setShouldShowDisabledState(false);
                            },
                          },
                        );
                        // State will be cleared when get_table_status shows table is completed
                      }}
                      style={{
                        animation:
                          (refreshingTable === table.table &&
                            isRefreshingDeltaTable) ||
                          (refreshingTable === table.table &&
                            getTableStatus(table.table) === "in_progress")
                            ? "spin 1s linear infinite"
                            : undefined,
                        cursor:
                          (shouldShowDisabledState || hasExistingMigrations) &&
                          !(
                            refreshingTable === table.table &&
                            (isRefreshingDeltaTable ||
                              getTableStatus(table.table) === "in_progress")
                          )
                            ? "not-allowed"
                            : "pointer",
                      }}
                    >
                      <SlRefresh />
                    </Box>
                  </Tooltip>
                </Flex>
                <Flex justifyContent="center" minW="40px">
                  <Box
                    _hover={{
                      color: "brand.500",
                      backgroundColor: "gray.300",
                    }}
                    p={1}
                    borderRadius="sm"
                  >
                    <RxDragHandleDots2 cursor="grab" />
                  </Box>
                </Flex>
              </Flex>
            </Flex>
          );
        })}
    </Flex>
  );
};

export default SelectedTable;
