import { useEffect, useMemo, useRef, useState } from "react";

import {
  ActionBar,
  Box,
  Button,
  Checkbox,
  Flex,
  For,
  Grid,
  Input,
  InputGroup,
  Portal,
  Skeleton,
  Text,
} from "@chakra-ui/react";

import { GoPlus } from "react-icons/go";
import { GrRefresh } from "react-icons/gr";
import { IoMdPlay } from "react-icons/io";
import { IoCaretDownSharp } from "react-icons/io5";
import { MdSearch } from "react-icons/md";
import { TbDelta } from "react-icons/tb";

import { useOutletContext } from "react-router";

import Pagination from "@/components/shared/Pagination";
import LoadingSpinner from "@/components/shared/Spinner";
import { toaster } from "@/components/ui/toaster";
import { Tooltip } from "@/components/ui/tooltip";
import { queryClient } from "@/lib/react-query-client";
import useFetchConnectorTableById from "@/queryOptions/connector/schema/useFetchTable";
import useFetchTableFields from "@/queryOptions/connector/schema/useFetchTableFields";
import useFetchTableStatus from "@/queryOptions/connector/schema/useFetchTableStatus";
import { usePagination } from "@/queryOptions/connector/schema/usePagination";
import useReloadSingleTable from "@/queryOptions/connector/schema/useReloadSingleTable";
import useUpdateSchemaStatus from "@/queryOptions/connector/schema/useUpdateSchemaStatus";
import useUpdateSelectedTables from "@/queryOptions/connector/schema/useUpdateSelectedTables";
import { type Connector, type ConnectorTable } from "@/types/connectors";

import { isPrimaryKey } from "../ReverseSchema/utils/validation";
import Actions from "./Actions";
import SelectedTableList from "./SelectedTable";
import { useIsMutating } from "@tanstack/react-query";

interface TableRowProps {
  item: ConnectorTable;
  index: number;
  connectionId: number;
  isExpanded: boolean;
  onToggleExpand: (_table: string) => void;
  userCheckedTables: ConnectorTable[];
  onCheckedChange: (_checked: boolean) => void;
  shouldShowDisabledState: boolean;
  reloadingTable: string | null;
  isReloadingSingleTable: boolean;
  isRefreshDeltaTableInProgress: number;
  isRefreshSchemaInProgress: number;
  tableStatusData?: { tables: Array<{ table: string; status: string | null }> };
  onReload: () => void;
}
const TableRow = ({
  item,
  index,
  connectionId,
  isExpanded,
  onToggleExpand,
  userCheckedTables,
  onCheckedChange,
  shouldShowDisabledState,
  reloadingTable,
  isReloadingSingleTable,
  isRefreshDeltaTableInProgress,
  isRefreshSchemaInProgress,
  tableStatusData,
  onReload,
}: TableRowProps) => {
  const { table } = item;
  const isEven = index % 2 === 0;
  const rowBg = isEven ? "gray.100" : "white";

  const { data: tableFieldsData } = useFetchTableFields(
    connectionId,
    table,
    isExpanded,
  );

  const isChecked = userCheckedTables.some((t) => t.table === table);

  const tableStatus = tableStatusData?.tables?.find(
    (t) => t.table === table,
  )?.status;
  const isTableInProgressFromAPI = tableStatus === "in_progress";

  const isThisTableReloading =
    (reloadingTable === table && isReloadingSingleTable) ||
    (reloadingTable === table && isTableInProgressFromAPI);

  const isReloadButtonDisabled =
    (shouldShowDisabledState ||
      isRefreshDeltaTableInProgress > 0 ||
      isRefreshSchemaInProgress > 0 ||
      tableStatusData?.tables?.some(
        (t) => t.status === "in_progress" && t.table !== table,
      ) ||
      (isReloadingSingleTable && reloadingTable !== table)) &&
    !isThisTableReloading;

  return (
    <Flex
      key={table}
      backgroundColor={rowBg}
      direction="column"
      padding={2}
      borderRadius={4}
    >
      <Grid
        templateColumns="24px 1fr auto"
        alignItems="start"
        width="100%"
        gap={2}
      >
        <Box>
          <Box onClick={() => onToggleExpand(table)} cursor="pointer">
            {isExpanded ? <IoCaretDownSharp /> : <IoMdPlay />}
          </Box>
        </Box>

        <Box>
          <Text
            fontSize="sm"
            cursor="pointer"
            onClick={() => onToggleExpand(table)}
          >
            {table}
          </Text>

          {isExpanded && (
            <Flex direction="column" gap={2} mt={2}>
              {tableFieldsData?.table_fields &&
                Object.entries(tableFieldsData.table_fields).map(
                  ([field, fieldInfo]) => {
                    const dataType =
                      typeof fieldInfo === "string"
                        ? fieldInfo
                        : (fieldInfo as { data_type?: string }).data_type ||
                          "unknown";

                    const isPK = isPrimaryKey(field, fieldInfo);

                    return (
                      <Flex key={field} gap={2} alignItems="center">
                        {isPK && <Text color="yellow.600">🔑</Text>}
                        <Text fontSize="sm">{field}</Text>
                        <Text color="gray.500">:</Text>
                        <Text fontSize="sm" color="gray.600">
                          {dataType}
                        </Text>
                      </Flex>
                    );
                  },
                )}
            </Flex>
          )}
        </Box>

        <Flex gap={6} alignItems="center" justifySelf="end">
          <Flex justifyContent="center" minW="40px">
            {item.is_delta && (
              <TbDelta color="#2563EB" size={18} title="Delta table" />
            )}
          </Flex>

          <Flex justifyContent="center" minW="40px">
            <Tooltip
              content={
                isReloadButtonDisabled
                  ? "Another migration is in progress. Please wait until it is complete."
                  : ""
              }
              disabled={!isReloadButtonDisabled}
            >
              <Box
                _hover={{
                  color: isReloadButtonDisabled ? "gray.400" : "brand.500",
                  cursor: isReloadButtonDisabled ? "not-allowed" : "pointer",
                }}
                p={1}
                onClick={onReload}
                style={{
                  animation: isThisTableReloading
                    ? "spin 1s linear infinite"
                    : undefined,
                  cursor: isReloadButtonDisabled ? "not-allowed" : "pointer",
                }}
              >
                <GrRefresh />
              </Box>
            </Tooltip>
          </Flex>

          <Flex justifyContent="center" minW="40px">
            <Checkbox.Root
              colorPalette="brand"
              variant="solid"
              onCheckedChange={({ checked }) =>
                onCheckedChange(checked === true)
              }
              checked={isChecked}
            >
              <Checkbox.HiddenInput />
              <Checkbox.Control cursor="pointer" />
            </Checkbox.Root>
          </Flex>
        </Flex>
      </Grid>
    </Flex>
  );
};

const Schema = () => {
  const context = useOutletContext<Connector>();
  const [shouldShowDisabledState, setShouldShowDisabledState] = useState(false);

  const { data: allTableData, isLoading: isAllTableListLoading } =
    useFetchConnectorTableById(context.connection_id);

  const AllTableList = allTableData?.tables;
  const itemsPerPage = allTableData?.pagination_limit;

  const { status: schemaStatus } = useUpdateSchemaStatus(
    context.connection_id,
    true,
  );
  const isCheckingSchemaStatus = !!schemaStatus?.is_in_progress;

  const prevIsCheckingRef = useRef(false);
  useEffect(() => {
    if (isCheckingSchemaStatus && !prevIsCheckingRef.current) {
      prevIsCheckingRef.current = true;
    } else if (!isCheckingSchemaStatus) {
      prevIsCheckingRef.current = false;
    }
  }, [isCheckingSchemaStatus]);

  useEffect(() => {
    if (
      schemaStatus &&
      !schemaStatus.is_in_progress &&
      isCheckingSchemaStatus
    ) {
      setTimeout(() => {}, 0);
      queryClient.refetchQueries({
        queryKey: ["ConnectorTable", context.connection_id],
      });
    }
  }, [schemaStatus, isCheckingSchemaStatus, context.connection_id]);

  const { mutate: updateTables, isPending: isAssigningTables } =
    useUpdateSelectedTables({
      connectorId: context.connection_id,
    });

  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState<string>("");

  const [reloadingTable, setReloadingTable] = useState<string | null>(null);

  // Filtered tables based on search query
  const filteredTables = useMemo(() => {
    return (
      AllTableList?.filter((item) =>
        item.table.toLowerCase().includes(searchQuery),
      ) || []
    );
  }, [AllTableList, searchQuery]);

  // Pagination logic
  const {
    currentData: paginatedTables,
    currentPage,
    totalPages,
    jumpToPage,
  } = usePagination({
    data: filteredTables,
    itemsPerPage,
  });

  const { mutate: reloadSingleTable, isPending: isReloadingSingleTable } =
    useReloadSingleTable({ connectionId: context.connection_id });

  const isRefreshDeltaTableInProgress = useIsMutating({
    mutationKey: ["refreshDeltaTable", context.connection_id],
  });

  const isRefreshSchemaInProgress = useIsMutating({
    mutationKey: ["refreshSchema", context.connection_id],
  });

  const shouldPollTableStatus =
    reloadingTable !== null || isReloadingSingleTable;

  const { data: tableStatusData } = useFetchTableStatus(
    context.connection_id,
    // Only enable the query when a table reload / migration is actually running.
    shouldPollTableStatus,
    // While enabled, keep polling while work is in progress.
    shouldPollTableStatus,
  );

  const hasAnyTableInProgress = useMemo(() => {
    const hasTableInProgress =
      tableStatusData?.tables?.some(
        (table) => table.status === "in_progress",
      ) ?? false;
    const isDeltaTableRefreshing = isRefreshDeltaTableInProgress > 0;
    const isSchemaRefreshing = isRefreshSchemaInProgress > 0;
    const isReloading = isReloadingSingleTable;
    return (
      hasTableInProgress ||
      isDeltaTableRefreshing ||
      isSchemaRefreshing ||
      isReloading
    );
  }, [
    tableStatusData,
    isRefreshDeltaTableInProgress,
    isRefreshSchemaInProgress,
    isReloadingSingleTable,
  ]);

  useEffect(() => {
    if (hasAnyTableInProgress || isReloadingSingleTable) {
      setTimeout(() => {
        setShouldShowDisabledState(true);
      }, 0);
    } else if (!reloadingTable && !hasAnyTableInProgress) {
      setTimeout(() => {
        setShouldShowDisabledState(false);
      }, 0);
    }
  }, [hasAnyTableInProgress, isReloadingSingleTable, reloadingTable]);

  useEffect(() => {
    if (!reloadingTable) return;

    const mutationCompleted = !isReloadingSingleTable;
    const tableStatus = tableStatusData?.tables?.find(
      (t) => t.table === reloadingTable,
    );
    const statusCompleted =
      tableStatus &&
      (tableStatus.status === "completed" || tableStatus.status === "failed");

    if (mutationCompleted && statusCompleted) {
      setTimeout(() => {
        setReloadingTable(null);
        setShouldShowDisabledState(false);
      }, 0);
      queryClient.refetchQueries({
        queryKey: ["ConnectorTable", context.connection_id],
      });
      queryClient.refetchQueries({
        queryKey: ["TableStatus", context.connection_id],
      });
    } else if (mutationCompleted && !tableStatusData) {
      queryClient.refetchQueries({
        queryKey: ["TableStatus", context.connection_id],
      });
    }
  }, [
    reloadingTable,
    tableStatusData,
    isReloadingSingleTable,
    context.connection_id,
  ]);

  const checkedTables = useMemo<ConnectorTable[]>(() => {
    if (!AllTableList) return [];
    return AllTableList.filter((t) => t.selected).sort((a, b) => {
      // Sort by sequence if available, otherwise maintain current order
      const seqA = a.sequence ?? 0;
      const seqB = b.sequence ?? 0;
      return seqA - seqB;
    });
  }, [AllTableList]);

  const [copyOfInitialCheckedTables, setCopyOfInitialCheckedTables] = useState<
    ConnectorTable[]
  >([]);
  const hasInitializedRef = useRef(false);

  useEffect(() => {
    if (AllTableList?.length && !hasInitializedRef.current) {
      setTimeout(() => {
        setCopyOfInitialCheckedTables(AllTableList.filter((t) => t.selected));
      }, 0);
      hasInitializedRef.current = true;
    }
  }, [AllTableList]);

  const [userCheckedTables, setUserCheckedTables] = useState<ConnectorTable[]>(
    () => checkedTables,
  );
  const shouldSkipUpdateRef = useRef(false);

  useEffect(() => {
    if (!shouldSkipUpdateRef.current) {
      setTimeout(() => {
        setUserCheckedTables(checkedTables);
      }, 0);
    }
  }, [checkedTables]);

  const hasCheckedTablesChanged = useMemo(() => {
    return (
      userCheckedTables.length !== copyOfInitialCheckedTables.length ||
      userCheckedTables.some(
        (table) =>
          !copyOfInitialCheckedTables.find((t) => t.table === table.table),
      )
    );
  }, [userCheckedTables, copyOfInitialCheckedTables]);

  const toggleExpand = (table: string) =>
    setExpanded((prev) => ({
      ...prev,
      [table]: !prev[table],
    }));

  const handleAssignTables = () => {
    const tablesToAdd = userCheckedTables.map((t) => t.table);
    const savedTables = [...userCheckedTables];
    updateTables(
      { selected_tables: tablesToAdd },
      {
        onSuccess: async (response) => {
          const message =
            response?.data?.message || "Tables updated successfully";
          const warning = response?.data?.warning;

          // Show warning if present, otherwise show success
          if (warning) {
            toaster.warning({
              title: warning,
            });
          } else {
            toaster.success({
              title: message,
            });
          }

          shouldSkipUpdateRef.current = true;
          setCopyOfInitialCheckedTables(savedTables);
          setUserCheckedTables(savedTables);
          shouldSkipUpdateRef.current = false;

          // Manually trigger refetch since we're overriding the default onSuccess
          await queryClient.refetchQueries({
            queryKey: ["ConnectorTable", context.connection_id],
          });

          queryClient.invalidateQueries({
            queryKey: ["TableStatus", context.connection_id],
          });
        },
      },
    );
  };

  if (isAllTableListLoading) {
    return <LoadingSpinner />;
  }

  return (
    <Flex flexDirection="column" gap={4} pb={8} w="100%">
      <Actions
        shouldShowDisabledState={shouldShowDisabledState}
        setShouldShowDisabledState={setShouldShowDisabledState}
        onUpdateSchemaComplete={() => {
          queryClient.refetchQueries({
            queryKey: ["ConnectorTable", context.connection_id],
          });
        }}
      />
      <Flex mr="auto">
        <InputGroup endElement={<MdSearch size={24} />}>
          <Input
            placeholder="Search table name"
            size="md"
            onChange={(e) => {
              const query = e.target.value.toLowerCase();
              setSearchQuery(query);
              jumpToPage(1);
            }}
          />
        </InputGroup>
      </Flex>
      <Grid templateColumns="1fr 1fr" gap={4}>
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
              Table Names
            </Text>
            <Flex gap={6} alignItems="center">
              <Text fontSize="sm" fontWeight="semibold" minW="40px">
                Delta
              </Text>
              <Text fontSize="sm" fontWeight="semibold" minW="40px">
                Reload
              </Text>
              <Text fontSize="sm" fontWeight="semibold" minW="40px">
                Select
              </Text>
            </Flex>
          </Flex>

          {(isAssigningTables || isAllTableListLoading) && (
            <For each={[...Array(10).keys()]}>
              {() => <Skeleton gap="4" height={8} />}
            </For>
          )}

          {!AllTableList?.length && !isAllTableListLoading && (
            <Flex direction="column" alignItems="center">
              <Text>No Tables available</Text>
            </Flex>
          )}

          {!isAssigningTables && (
            <>
              {paginatedTables.map((item, index) => {
                const { table } = item;
                const isExpanded = !!expanded[table];

                return (
                  <TableRow
                    key={table}
                    item={item}
                    index={index}
                    connectionId={context.connection_id}
                    isExpanded={isExpanded}
                    onToggleExpand={toggleExpand}
                    userCheckedTables={userCheckedTables}
                    onCheckedChange={(checked) => {
                      setUserCheckedTables((prev) =>
                        checked
                          ? [...prev, item]
                          : prev.filter((t) => t.table !== table),
                      );
                    }}
                    shouldShowDisabledState={shouldShowDisabledState}
                    reloadingTable={reloadingTable}
                    isReloadingSingleTable={isReloadingSingleTable}
                    isRefreshDeltaTableInProgress={
                      isRefreshDeltaTableInProgress
                    }
                    isRefreshSchemaInProgress={isRefreshSchemaInProgress}
                    tableStatusData={tableStatusData}
                    onReload={() => {
                      if (shouldShowDisabledState) {
                        toaster.warning({
                          title: "Operation in progress",
                          description:
                            "Another migration is in progress. Please wait until it is complete.",
                        });
                        return;
                      }
                      setShouldShowDisabledState(true);
                      setReloadingTable(table);
                      reloadSingleTable({
                        connection_id: context.connection_id,
                        table_name: table,
                      });
                    }}
                  />
                );
              })}
              {totalPages > 1 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={jumpToPage}
                />
              )}
            </>
          )}
        </Flex>

        <SelectedTableList
          shouldShowDisabledState={shouldShowDisabledState}
          setShouldShowDisabledState={setShouldShowDisabledState}
          selectedTablesFromMain={checkedTables}
        />
      </Grid>

      <ActionBar.Root open={hasCheckedTablesChanged}>
        <Portal>
          <ActionBar.Positioner>
            <ActionBar.Content>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAssignTables()}
                loading={isAssigningTables}
              >
                <GoPlus />
                Save
              </Button>
            </ActionBar.Content>
          </ActionBar.Positioner>
        </Portal>
      </ActionBar.Root>
    </Flex>
  );
};

export default Schema;
