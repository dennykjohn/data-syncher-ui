import { useEffect, useMemo, useRef, useState } from "react";

import {
  ActionBar,
  Box,
  Button,
  Checkbox,
  Flex,
  For,
  Grid,
  Image,
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

import SandtimeIcon from "@/assets/icons/sand-time-icon.svg";
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
  reloadingTables: string[];
  isReloadingSingleTable: boolean;
  isRefreshDeltaTableInProgress: number;
  isRefreshSchemaInProgress: number;
  shouldLockAllReloads: boolean; // New prop for Cross-Blocking
  tableStatusData?: {
    tables: Array<{ table: string; status?: string | null }>;
  };
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
  reloadingTables,
  shouldLockAllReloads,
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

  const isThisTableReloading =
    reloadingTables?.some((t) => t.toLowerCase() === table.toLowerCase()) ??
    false;

  const isThisTableInProgress =
    tableStatusData?.tables?.some(
      (t) => t.table === table && t.status === "in_progress",
    ) ?? false;

  const isReloadButtonDisabled =
    shouldLockAllReloads || isThisTableReloading || isThisTableInProgress;

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
                  ? "Another migration is currently in progress. Please wait until it completes."
                  : ""
              }
              disabled={!isReloadButtonDisabled}
            >
              <Box
                color={isReloadButtonDisabled ? "gray.400" : "inherit"}
                opacity={isReloadButtonDisabled ? 0.5 : 1}
                filter={isReloadButtonDisabled ? "blur(0.3px)" : "none"}
                _hover={{
                  color: isReloadButtonDisabled ? "gray.400" : "brand.500",
                  cursor: isReloadButtonDisabled ? "not-allowed" : "pointer",
                }}
                p={1}
                onClick={(e) => {
                  if (isReloadButtonDisabled) {
                    e.preventDefault();
                    e.stopPropagation();
                    return;
                  }
                  onReload();
                }}
                style={{
                  cursor: isReloadButtonDisabled ? "not-allowed" : "pointer",
                }}
              >
                {isThisTableReloading ? (
                  <Image
                    src={SandtimeIcon}
                    boxSize="16px" // Match icon size
                    objectFit="contain"
                  />
                ) : (
                  <GrRefresh />
                )}
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

  const reloadingTables = context.reloadingTables ?? [];
  const setReloadingTables = context.setReloadingTables ?? (() => {});
  const [refreshingTables, setRefreshingTables] = useState<string[]>([]); // Hoist Refresh State
  const reloadTimestamps = useRef<Record<string, number>>({});

  useEffect(() => {
    reloadingTables.forEach((table) => {
      if (!reloadTimestamps.current[table]) {
        reloadTimestamps.current[table] = 0;
      }
    });
  }, [reloadingTables]);

  const filteredTables = useMemo(() => {
    const filtered =
      AllTableList?.filter((item: ConnectorTable) =>
        item.table.toLowerCase().includes(searchQuery),
      ) || [];
    return filtered;
  }, [AllTableList, searchQuery]);

  const {
    currentData: paginatedTables,
    currentPage,
    totalPages,
    jumpToPage,
  } = usePagination<ConnectorTable>({
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

  const { data: tableStatusData } = useFetchTableStatus(
    context.connection_id,
    true,
    false,
  );

  const hasAnyTableInProgress = useMemo(() => {
    const hasTableInProgress =
      tableStatusData?.tables?.some(
        (table) => table.status === "in_progress",
      ) ?? false;
    const isSchemaRefreshing = isRefreshSchemaInProgress > 0;
    const isReloading = isReloadingSingleTable || reloadingTables.length > 0;
    const isRefreshing = refreshingTables.length > 0;
    return (
      hasTableInProgress || isSchemaRefreshing || isReloading || isRefreshing
    );
  }, [
    tableStatusData,
    isRefreshSchemaInProgress,
    isReloadingSingleTable,
    reloadingTables,
    refreshingTables,
  ]);

  const activeMigrations =
    tableStatusData?.tables
      ?.filter((t) => t.status === "in_progress")
      .map((t) => t.table.toLowerCase()) || [];
  const activeReloads = reloadingTables.map((t) => t.toLowerCase());

  const activeRefreshes = activeMigrations.filter(
    (t) => !activeReloads.includes(t),
  );

  const isAnyRefreshing =
    isRefreshDeltaTableInProgress > 0 ||
    activeRefreshes.length > 0 ||
    refreshingTables.length > 0;
  const isAnyReloading = reloadingTables.length > 0 || isReloadingSingleTable;
  const isSchemaSyncing = isRefreshSchemaInProgress > 0;

  const shouldLockAllReloads = isAnyRefreshing || isSchemaSyncing;

  const shouldLockAllRefreshes = isAnyReloading || isSchemaSyncing;

  useEffect(() => {
    if (hasAnyTableInProgress || isReloadingSingleTable) {
      setTimeout(() => {
        setShouldShowDisabledState(true);
      }, 0);
    } else if (reloadingTables.length === 0 && !hasAnyTableInProgress) {
      setTimeout(() => {
        setShouldShowDisabledState(false);
      }, 0);
    }
  }, [hasAnyTableInProgress, isReloadingSingleTable, reloadingTables]);

  const hasSeenInProgressRef = useRef<Record<string, boolean>>({});

  // Clean up completed reloads
  useEffect(() => {
    if (isReloadingSingleTable) return;
    if (reloadingTables.length === 0 || !tableStatusData?.tables) return;

    const tablesToRemove = reloadingTables.filter((table) => {
      const statusItem = tableStatusData.tables.find(
        (t) => t.table.toLowerCase() === table.toLowerCase(),
      );
      const startTime = reloadTimestamps.current[table];
      const isTimeSafe = !startTime || startTime === 0;

      const status = statusItem?.status;
      if (status === "in_progress") {
        hasSeenInProgressRef.current[table] = true;
        return false;
      }

      const hasSeenInProgress = hasSeenInProgressRef.current[table];
      const isFinished =
        status === "completed" || status === "failed" || status === null;

      if (statusItem && isFinished && (hasSeenInProgress || isTimeSafe)) {
        return true;
      }

      if (!startTime) {
        return true;
      }

      return false;
    });

    if (tablesToRemove.length > 0) {
      setReloadingTables((prev) =>
        prev.filter((t) => !tablesToRemove.includes(t)),
      );

      tablesToRemove.forEach((t) => {
        delete reloadTimestamps.current[t];
        delete hasSeenInProgressRef.current[t];
      });

      queryClient.refetchQueries({
        queryKey: ["ConnectorTable", context.connection_id],
      });
      queryClient.refetchQueries({
        queryKey: ["TableStatus", context.connection_id],
      });
    }
  }, [
    tableStatusData,
    reloadingTables,
    setReloadingTables,
    context.connection_id,
    isReloadingSingleTable,
  ]);

  const checkedTables = useMemo<ConnectorTable[]>(() => {
    if (!AllTableList) return [];
    return AllTableList.filter((t: ConnectorTable) => t.selected).sort(
      (a: ConnectorTable, b: ConnectorTable) => {
        const seqA = a.sequence ?? 0;
        const seqB = b.sequence ?? 0;
        return seqA - seqB;
      },
    );
  }, [AllTableList]);

  const [copyOfInitialCheckedTables, setCopyOfInitialCheckedTables] = useState<
    ConnectorTable[]
  >([]);
  const hasInitializedRef = useRef(false);

  useEffect(() => {
    if (AllTableList?.length && !hasInitializedRef.current) {
      setTimeout(() => {
        setCopyOfInitialCheckedTables(
          AllTableList.filter((t: ConnectorTable) => t.selected),
        );
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
        (table: ConnectorTable) =>
          !copyOfInitialCheckedTables.find(
            (t: ConnectorTable) => t.table === table.table,
          ),
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
        reloadingTables={reloadingTables}
        onUpdateSchemaComplete={() => {
          queryClient.refetchQueries({
            queryKey: ["ConnectorTable", context.connection_id],
          });
        }}
      />
      <Flex mr="auto" mt={-4}>
        <InputGroup endElement={<MdSearch size={28} />}>
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
              {(_item, index) => <Skeleton key={index} gap="4" height={8} />}
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
                      setUserCheckedTables((prev: ConnectorTable[]) =>
                        checked
                          ? [...prev, item]
                          : prev.filter(
                              (t: ConnectorTable) => t.table !== table,
                            ),
                      );
                    }}
                    reloadingTables={reloadingTables}
                    isReloadingSingleTable={isReloadingSingleTable}
                    isRefreshDeltaTableInProgress={
                      isRefreshDeltaTableInProgress
                    }
                    isRefreshSchemaInProgress={isRefreshSchemaInProgress}
                    shouldLockAllReloads={shouldLockAllReloads}
                    tableStatusData={tableStatusData}
                    onReload={() => {
                      setShouldShowDisabledState(true);
                      setReloadingTables((prev) => [...prev, table]);
                      reloadTimestamps.current[table] = Date.now();
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
          selectedTablesFromMain={checkedTables}
          reloadingTables={reloadingTables}
          refreshingTables={refreshingTables}
          setRefreshingTables={setRefreshingTables}
          isReloadingSingleTable={isReloadingSingleTable}
          shouldLockAllReloads={shouldLockAllReloads}
          shouldLockAllRefreshes={shouldLockAllRefreshes}
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
