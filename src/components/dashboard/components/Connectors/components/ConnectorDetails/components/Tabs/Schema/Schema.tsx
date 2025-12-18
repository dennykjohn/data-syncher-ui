import { useCallback, useEffect, useMemo, useState } from "react";

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
import useFetchSelectedTables from "@/queryOptions/connector/schema/useFetchSelectedTables";
import useFetchConnectorTableById from "@/queryOptions/connector/schema/useFetchTable";
import useFetchTableFields from "@/queryOptions/connector/schema/useFetchTableFields";
import useReloadSingleTable from "@/queryOptions/connector/schema/useReloadSingleTable";
import useUpdateSelectedTables from "@/queryOptions/connector/schema/useUpdateSelectedTables";
import { type Connector, type ConnectorTable } from "@/types/connectors";

import Actions from "./Actions";
import SelectedTableList from "./SelectedTable";

interface TableRowProps {
  item: ConnectorTable;
  index: number;
  isExpanded: boolean;
  toggleExpand: (_table: string) => void;
  connectionId: number;
  shouldShowDisabledState: boolean;
  hasAnyTableInProgress: boolean;
  reloadingTable: string | null;
  isReloadingSingleTable: boolean;
  isTableInProgress: (_table: string) => boolean;
  setShouldShowDisabledState: (_value: boolean) => void;
  setReloadingTable: (_table: string | null) => void;
  reloadSingleTable: (
    _payload: {
      connection_id: number;
      table_name: string;
    },
    _options?: {
      onSettled?: () => void;
      onError?: () => void;
    },
  ) => void;
  userCheckedTables: ConnectorTable[];
  setUserCheckedTables: React.Dispatch<React.SetStateAction<ConnectorTable[]>>;
}

const TableRow = ({
  item,
  index,
  isExpanded,
  toggleExpand,
  connectionId,
  shouldShowDisabledState,
  hasAnyTableInProgress,
  reloadingTable,
  isReloadingSingleTable,
  isTableInProgress,
  setShouldShowDisabledState,
  setReloadingTable,
  reloadSingleTable,
  userCheckedTables,
  setUserCheckedTables,
}: TableRowProps) => {
  const {
    table,
    table_fields: initialTableFields,
    primary_keys: initialPrimaryKeys = [],
  } = item;

  // Fetch fields from new API when table is expanded
  const { data: tableFieldsData, isLoading: isLoadingFields } =
    useFetchTableFields(connectionId, table, isExpanded);

  // Use fetched fields if available, otherwise fall back to initial fields
  const table_fields = tableFieldsData?.table_fields || initialTableFields;
  const primary_keys = tableFieldsData?.primary_keys || initialPrimaryKeys;

  const isEven = index % 2 === 0;
  const rowBg = isEven ? "gray.100" : "white";

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
            onClick={() => toggleExpand(table)}
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
            onClick={() => toggleExpand(table)}
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
                (shouldShowDisabledState || hasAnyTableInProgress) &&
                !(
                  (reloadingTable === table && isReloadingSingleTable) ||
                  (reloadingTable === table && isTableInProgress(table))
                )
                  ? "Another migration is in progress. Please wait until it is complete."
                  : ""
              }
              disabled={
                (!shouldShowDisabledState && !hasAnyTableInProgress) ||
                (reloadingTable === table && isReloadingSingleTable) ||
                (reloadingTable === table && isTableInProgress(table))
              }
            >
              <Box
                _hover={{
                  color:
                    (shouldShowDisabledState || hasAnyTableInProgress) &&
                    !(
                      (reloadingTable === table && isReloadingSingleTable) ||
                      (reloadingTable === table && isTableInProgress(table))
                    )
                      ? "gray.400"
                      : "brand.500",
                  cursor:
                    (shouldShowDisabledState || hasAnyTableInProgress) &&
                    !(
                      (reloadingTable === table && isReloadingSingleTable) ||
                      (reloadingTable === table && isTableInProgress(table))
                    )
                      ? "not-allowed"
                      : "pointer",
                }}
                p={1}
                borderRadius="sm"
                onClick={() => {
                  const isThisTableReloading =
                    (reloadingTable === table && isReloadingSingleTable) ||
                    (reloadingTable === table && isTableInProgress(table));
                  if (
                    (shouldShowDisabledState || hasAnyTableInProgress) &&
                    !isThisTableReloading
                  ) {
                    toaster.warning({
                      title: "Operation in progress",
                      description:
                        "Another migration is in progress. Please wait until it is complete.",
                    });
                    return;
                  }
                  setShouldShowDisabledState(true);
                  setReloadingTable(table);
                  reloadSingleTable(
                    {
                      connection_id: connectionId,
                      table_name: table,
                    },
                    {
                      onSettled: () => {
                        /* keep disabled until polling says not in progress */
                      },
                      onError: () => {
                        setReloadingTable(null);
                        setShouldShowDisabledState(false);
                      },
                    },
                  );
                }}
                style={{
                  animation:
                    (reloadingTable === table && isReloadingSingleTable) ||
                    (reloadingTable === table && isTableInProgress(table))
                      ? "spin 1s linear infinite"
                      : undefined,
                  cursor:
                    (shouldShowDisabledState || hasAnyTableInProgress) &&
                    !(
                      (reloadingTable === table && isReloadingSingleTable) ||
                      (reloadingTable === table && isTableInProgress(table))
                    )
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
              onCheckedChange={({ checked }) => {
                setUserCheckedTables((prev) =>
                  checked
                    ? [...prev, item]
                    : prev.filter((t) => t.table !== table),
                );
              }}
              checked={userCheckedTables.some((t) => t.table === table)}
            >
              <Checkbox.HiddenInput />
              <Checkbox.Control cursor="pointer" />
            </Checkbox.Root>
          </Flex>
        </Flex>
      </Flex>

      {isExpanded && (
        <Flex direction="column" gap={2} paddingBlock={4} width="100%">
          {isLoadingFields && (
            <Flex direction="column" gap={2}>
              <For each={[...Array(3).keys()]}>
                {() => <Skeleton height={4} />}
              </For>
            </Flex>
          )}
          {!isLoadingFields && primary_keys.length > 0 && (
            <Flex direction="column" gap={1} mb={2}>
              <Text fontSize="sm" color="gray.700" fontWeight="semibold">
                Primary keys
              </Text>
              <Flex gap={2} wrap="wrap">
                {primary_keys.map((pk: string) => (
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

          {!isLoadingFields &&
            table_fields &&
            Object.entries(table_fields).map(([field, fieldInfo]) => {
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
            })}
        </Flex>
      )}
    </Flex>
  );
};

const Schema = () => {
  const context = useOutletContext<Connector>();
  const [shouldShowDisabledState, setShouldShowDisabledState] = useState(false);

  // Fetch data
  const { data: AllTableList, isLoading: isAllTableListLoading } =
    useFetchConnectorTableById(context.connection_id);

  const { data: selectedTablesData } = useFetchSelectedTables(
    context.connection_id,
  );

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

  const isTableInProgress = useCallback(
    (tableName: string) =>
      selectedTablesData?.tables?.some(
        (table) => table.table === tableName && table.status === "in_progress",
      ) ?? false,
    [selectedTablesData],
  );

  const hasAnyTableInProgress = useMemo(() => {
    return (
      selectedTablesData?.tables?.some(
        (table) => table.status === "in_progress",
      ) ?? false
    );
  }, [selectedTablesData]);

  const checkedTables = useMemo<ConnectorTable[]>(() => {
    if (!AllTableList) return [];
    return AllTableList.filter((t) => t.selected);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [AllTableList, recalculatedCheckedTables]);

  // Save a copy of initial checked tables
  const copyOfInitialCheckedTables: ConnectorTable[] = useMemo(() => {
    if (!AllTableList) return [];
    return AllTableList.filter((t) => t.selected);
  }, [AllTableList]);

  // Local writable state
  const [userCheckedTables, setUserCheckedTables] = useState<ConnectorTable[]>(
    () => checkedTables,
  );

  useEffect(() => {
    setUserCheckedTables(checkedTables);
  }, [checkedTables]);

  useEffect(() => {
    if (!reloadingTable) return;

    const isInProgress =
      isReloadingSingleTable || isTableInProgress(reloadingTable);

    if (isInProgress) {
      setShouldShowDisabledState(true);
      return;
    }

    setReloadingTable(null);
    setShouldShowDisabledState(false);
  }, [
    isReloadingSingleTable,
    isTableInProgress,
    reloadingTable,
    selectedTablesData,
  ]);

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
          setRecalculatedCheckedTables((prev) => !prev);
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
              const isExpanded = !!expanded[item.table];
              return (
                <TableRow
                  key={item.table}
                  item={item}
                  index={index}
                  isExpanded={isExpanded}
                  toggleExpand={toggleExpand}
                  connectionId={context.connection_id}
                  shouldShowDisabledState={shouldShowDisabledState}
                  hasAnyTableInProgress={hasAnyTableInProgress}
                  reloadingTable={reloadingTable}
                  isReloadingSingleTable={isReloadingSingleTable}
                  isTableInProgress={isTableInProgress}
                  setShouldShowDisabledState={setShouldShowDisabledState}
                  setReloadingTable={setReloadingTable}
                  reloadSingleTable={reloadSingleTable}
                  userCheckedTables={userCheckedTables}
                  setUserCheckedTables={setUserCheckedTables}
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
