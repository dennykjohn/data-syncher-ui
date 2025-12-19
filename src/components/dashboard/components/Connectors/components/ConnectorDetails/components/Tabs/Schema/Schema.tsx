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

import LoadingSpinner from "@/components/shared/Spinner";
import { toaster } from "@/components/ui/toaster";
import { Tooltip } from "@/components/ui/tooltip";
import useFetchConnectorTableById from "@/queryOptions/connector/schema/useFetchTable";
import useFetchTableFields from "@/queryOptions/connector/schema/useFetchTableFields";
import useFetchTableStatus from "@/queryOptions/connector/schema/useFetchTableStatus";
import useReloadSingleTable from "@/queryOptions/connector/schema/useReloadSingleTable";
import useUpdateSchemaStatus from "@/queryOptions/connector/schema/useUpdateSchemaStatus";
import useUpdateSelectedTables from "@/queryOptions/connector/schema/useUpdateSelectedTables";
import { type Connector, type ConnectorTable } from "@/types/connectors";

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
  tableStatusData?: { tables: Array<{ table: string; status: string }> };
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
  tableStatusData,
  onReload,
}: TableRowProps) => {
  const { table } = item;
  const isEven = index % 2 === 0;
  const rowBg = isEven ? "gray.100" : "white";

  // Fetch table fields when expanded
  const { data: tableFieldsData, isLoading: isLoadingFields } =
    useFetchTableFields(connectionId, table, isExpanded);

  const isChecked = userCheckedTables.some((t) => t.table === table);

  // Check if table is in progress from get_table_status API
  const tableStatus = tableStatusData?.tables?.find(
    (t) => t.table === table,
  )?.status;
  const isTableInProgressFromAPI = tableStatus === "in_progress";

  // Reload button spinner should be active if:
  // 1. Mutation is pending (API call in progress), OR
  // 2. Table status from get_table_status API is "in_progress"
  const isThisTableReloading =
    (reloadingTable === table && isReloadingSingleTable) ||
    (reloadingTable === table && isTableInProgressFromAPI);

  return (
    <Flex
      key={table}
      justifyContent="space-between"
      backgroundColor={rowBg}
      alignItems="center"
      direction={isExpanded ? "column" : "row"}
      padding={2}
      borderRadius={4}
    >
      <Flex
        alignItems="center"
        justifyContent="space-between"
        gap={2}
        width="100%"
      >
        <Flex alignItems="center" gap={2} flex="1">
          <Box
            onClick={() => onToggleExpand(table)}
            style={{ cursor: "pointer" }}
            padding={1}
            _hover={{
              backgroundColor: "brand.200",
              borderRadius: 4,
            }}
          >
            {isExpanded ? <IoCaretDownSharp /> : <IoMdPlay />}
          </Box>
          <Text
            fontSize="sm"
            onClick={() => onToggleExpand(table)}
            style={{ cursor: "pointer" }}
          >
            {table}
          </Text>
        </Flex>
        <Flex gap={6} alignItems="center">
          <Flex justifyContent="center" minW="40px">
            {item.is_delta && (
              <TbDelta color="#2563EB" size={18} title="Delta table" />
            )}
          </Flex>

          <Flex justifyContent="center" minW="40px">
            <Tooltip
              content={
                shouldShowDisabledState && !isThisTableReloading
                  ? "Another migration is in progress. Please wait until it is complete."
                  : ""
              }
              disabled={!shouldShowDisabledState || isThisTableReloading}
            >
              <Box
                _hover={{
                  color:
                    shouldShowDisabledState && !isThisTableReloading
                      ? "gray.400"
                      : "brand.500",
                  cursor:
                    shouldShowDisabledState && !isThisTableReloading
                      ? "not-allowed"
                      : "pointer",
                }}
                p={1}
                borderRadius="sm"
                onClick={onReload}
                style={{
                  animation: isThisTableReloading
                    ? "spin 1s linear infinite"
                    : undefined,
                  cursor:
                    shouldShowDisabledState && !isThisTableReloading
                      ? "not-allowed"
                      : "pointer",
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
      </Flex>

      {isExpanded && (
        <Flex direction="column" gap={2} paddingBlock={4} width="100%">
          {isLoadingFields ? (
            <Skeleton height={4} mb={2} />
          ) : (
            <>
              {tableFieldsData?.primary_keys &&
                tableFieldsData.primary_keys.length > 0 && (
                  <Flex direction="column" gap={1} mb={2}>
                    <Text fontSize="sm" color="gray.700" fontWeight="semibold">
                      Primary keys
                    </Text>
                    <Flex gap={2} wrap="wrap">
                      {tableFieldsData.primary_keys.map((pk: string) => (
                        <Flex
                          key={pk}
                          alignItems="center"
                          gap={1}
                          px={2}
                          py={1}
                          borderRadius="md"
                          bg="yellow.50"
                          border="1px solid"
                          borderColor="yellow.200"
                        >
                          <Text fontSize="sm" color="yellow.700">
                            🔑
                          </Text>
                          <Text fontSize="sm" color="gray.800">
                            {pk}
                          </Text>
                        </Flex>
                      ))}
                    </Flex>
                  </Flex>
                )}

              {tableFieldsData?.table_fields &&
                Object.entries(tableFieldsData.table_fields).map(
                  ([field, fieldInfo]) => {
                    const dataType =
                      typeof fieldInfo === "string"
                        ? fieldInfo
                        : (fieldInfo as { data_type?: string }).data_type ||
                          "unknown";

                    return (
                      <Flex key={field} alignItems="center" gap={2}>
                        <Text fontSize="sm" fontWeight="medium">
                          {field}
                        </Text>
                        <Text fontSize="sm" color="gray.500">
                          :
                        </Text>
                        <Text fontSize="sm" color="gray.600" fontStyle="italic">
                          {dataType}
                        </Text>
                      </Flex>
                    );
                  },
                )}
            </>
          )}
        </Flex>
      )}
    </Flex>
  );
};

const Schema = () => {
  const context = useOutletContext<Connector>();
  const [shouldShowDisabledState, setShouldShowDisabledState] = useState(false);
  const [isCheckingSchemaStatus, setIsCheckingSchemaStatus] = useState(false);
  const hasCheckedInitialStatus = useRef(false);

  // Fetch data
  const { data: AllTableList, isLoading: isAllTableListLoading } =
    useFetchConnectorTableById(context.connection_id);

  const { status: schemaStatus } = useUpdateSchemaStatus(
    context.connection_id,
    true,
  );

  useEffect(() => {
    if (!hasCheckedInitialStatus.current && schemaStatus) {
      hasCheckedInitialStatus.current = true;
      if (schemaStatus.is_in_progress) {
        setIsCheckingSchemaStatus(true);
      }
    }
  }, [schemaStatus]);

  useEffect(() => {
    if (schemaStatus?.is_in_progress && !isCheckingSchemaStatus) {
      setIsCheckingSchemaStatus(true);
    }
  }, [schemaStatus, isCheckingSchemaStatus]);

  useEffect(() => {
    if (
      schemaStatus &&
      !schemaStatus.is_in_progress &&
      isCheckingSchemaStatus
    ) {
      setIsCheckingSchemaStatus(false);
      toaster.success({
        title: "Schema update completed",

        description:
          schemaStatus.message || "All tables have been fetched successfully.",
      });
    }
  }, [schemaStatus, isCheckingSchemaStatus]);
  const { mutate: updateTables, isPending: isAssigningTables } =
    useUpdateSelectedTables({
      connectorId: context.connection_id,
    });

  // Temp state to trigger re-calculation
  const [recalculatedCheckedTables, setRecalculatedCheckedTables] =
    useState<boolean>(false);

  // UI States
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [reloadingTable, setReloadingTable] = useState<string | null>(null);

  const { mutate: reloadSingleTable, isPending: isReloadingSingleTable } =
    useReloadSingleTable({ connectionId: context.connection_id });

  // Track refresh delta table mutation status (to disable reload buttons)
  const isRefreshDeltaTableInProgress = useIsMutating({
    mutationKey: ["refreshDeltaTable", context.connection_id],
  });

  // Fetch table status to track reload progress - always enabled to check for any in-progress tables
  const { data: tableStatusData } = useFetchTableStatus(
    context.connection_id,
    true, // Always enabled to check for in-progress tables (including refresh delta table)
  );

  // Check if any table has "in_progress" status OR refresh delta table is in progress OR reload single table is in progress
  const hasAnyTableInProgress = useMemo(() => {
    const hasTableInProgress =
      tableStatusData?.tables?.some(
        (table) => table.status === "in_progress",
      ) ?? false;
    const isDeltaTableRefreshing = isRefreshDeltaTableInProgress > 0;
    const isReloading = isReloadingSingleTable;
    return hasTableInProgress || isDeltaTableRefreshing || isReloading;
  }, [tableStatusData, isRefreshDeltaTableInProgress, isReloadingSingleTable]);

  // Update shouldShowDisabledState when any table is in progress
  useEffect(() => {
    if (hasAnyTableInProgress || isReloadingSingleTable) {
      setShouldShowDisabledState(true);
    } else if (!reloadingTable) {
      setShouldShowDisabledState(false);
    }
  }, [hasAnyTableInProgress, isReloadingSingleTable, reloadingTable]);

  // Clear reloadingTable when table status becomes "completed" or "failed"
  useEffect(() => {
    if (!reloadingTable || !tableStatusData?.tables) return;

    const tableStatus = tableStatusData.tables.find(
      (t) => t.table === reloadingTable,
    );

    if (
      tableStatus &&
      (tableStatus.status === "completed" || tableStatus.status === "failed")
    ) {
      // Clear after a short delay to allow success message to be visible
      setTimeout(() => {
        setReloadingTable(null);
        setShouldShowDisabledState(false);
      }, 500);
    }
  }, [reloadingTable, tableStatusData]);

  const checkedTables = useMemo<ConnectorTable[]>(() => {
    if (!AllTableList) return [];
    return AllTableList.filter((t) => t.selected);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [AllTableList, recalculatedCheckedTables]);

  const [copyOfInitialCheckedTables, setCopyOfInitialCheckedTables] = useState<
    ConnectorTable[]
  >([]);
  const hasInitializedRef = useRef(false);

  useEffect(() => {
    if (AllTableList?.length && !hasInitializedRef.current) {
      setCopyOfInitialCheckedTables(AllTableList.filter((t) => t.selected));
      hasInitializedRef.current = true;
    }
  }, [AllTableList]);

  // Local writable state
  const [userCheckedTables, setUserCheckedTables] = useState<ConnectorTable[]>(
    () => checkedTables,
  );
  const shouldSkipUpdateRef = useRef(false);

  useEffect(() => {
    if (!shouldSkipUpdateRef.current) {
      setUserCheckedTables(checkedTables);
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

  // Toggle expand
  const toggleExpand = (table: string) =>
    setExpanded((prev) => ({
      ...prev,
      [table]: !prev[table],
    }));

  // Save action
  const handleAssignTables = () => {
    const tablesToAdd = userCheckedTables.map((t) => t.table);
    const savedTables = [...userCheckedTables];
    updateTables(
      { selected_tables: tablesToAdd },
      {
        onSuccess: (response) => {
          const message =
            response?.data?.message || "Tables updated successfully";
          toaster.success({
            title: message,
            description: response?.data?.description,
          });
          shouldSkipUpdateRef.current = true;
          setRecalculatedCheckedTables((prev) => !prev);
          setTimeout(() => {
            setCopyOfInitialCheckedTables(savedTables);
            setUserCheckedTables(savedTables);
            shouldSkipUpdateRef.current = false;
          }, 3000);
        },
      },
    );
  };

  // Show spinner while loading tables (header spinner covers schema status)
  if (isAllTableListLoading) {
    return <LoadingSpinner />;
  }

  return (
    <Flex flexDirection="column" gap={4} pb={8} w="100%">
      <Actions
        shouldShowDisabledState={shouldShowDisabledState}
        setShouldShowDisabledState={setShouldShowDisabledState}
        onUpdateSchemaStart={() => setIsCheckingSchemaStatus(true)}
      />
      <Flex mr="auto">
        <InputGroup endElement={<MdSearch size={24} />}>
          <Input
            placeholder="Search table name"
            size="md"
            onChange={(e) => {
              const query = e.target.value.toLowerCase();
              setSearchQuery(query);
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

          {!isAssigningTables &&
            AllTableList?.filter((item) =>
              item.table.toLowerCase().includes(searchQuery),
            ).map((item, index) => {
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
                  tableStatusData={tableStatusData}
                  onReload={() => {
                    const isThisTableReloading =
                      reloadingTable === table && isReloadingSingleTable;
                    if (shouldShowDisabledState && !isThisTableReloading) {
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
                    // State will be cleared when get_table_status shows table is completed
                  }}
                />
              );
            })}
        </Flex>

        <SelectedTableList
          shouldShowDisabledState={shouldShowDisabledState}
          setShouldShowDisabledState={setShouldShowDisabledState}
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
