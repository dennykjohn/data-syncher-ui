import { useEffect, useMemo, useState } from "react";

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
import useReloadSingleTable from "@/queryOptions/connector/schema/useReloadSingleTable";
import useUpdateSelectedTables from "@/queryOptions/connector/schema/useUpdateSelectedTables";
import { type Connector, type ConnectorTable } from "@/types/connectors";

import Actions from "./Actions";
import SelectedTableList from "./SelectedTable";

const Schema = () => {
  const context = useOutletContext<Connector>();
  const [shouldShowDisabledState, setShouldShowDisabledState] = useState(false);

  // Fetch data
  const { data: AllTableList, isLoading: isAllTableListLoading } =
    useFetchConnectorTableById(context.connection_id);
  const { mutate: updateTables, isPending: isAssigningTables } =
    useUpdateSelectedTables({
      connectorId: context.connection_id,
    });

  // Fetch selected tables to check migration status
  const { data: selectedTablesData } = useFetchSelectedTables(
    context.connection_id,
  );

  // Temp state to trigger re-calculation
  const [recalculatedCheckedTables, setRecalculatedCheckedTables] =
    useState<boolean>(false);

  // UI States
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [reloadingTable, setReloadingTable] = useState<string | null>(null);

  const { mutate: reloadSingleTable, isPending: isReloadingSingleTable } =
    useReloadSingleTable();

  // Check if any table has "in_progress" status
  const hasInProgressStatus = useMemo(() => {
    if (!selectedTablesData?.tables) return false;
    return selectedTablesData.tables.some(
      (table) => table.status === "in_progress",
    );
  }, [selectedTablesData]);

  // Combined disabled state: either manual disable OR any table is in progress
  const isAnyOperationActive = shouldShowDisabledState || hasInProgressStatus;

  // Monitor status changes and reset shouldShowDisabledState when all operations complete
  useEffect(() => {
    if (hasInProgressStatus) {
      // If any table is in progress, ensure buttons are disabled
      // This handles the case when migrations are in progress from backend
      if (!shouldShowDisabledState) {
        setShouldShowDisabledState(true);
      }
    } else if (!hasInProgressStatus && shouldShowDisabledState) {
      // All operations completed (no in_progress status), reset after a short delay
      // This ensures buttons are enabled only after tick symbol appears (status = "completed")
      const timer = setTimeout(() => {
        setShouldShowDisabledState(false);
      }, 1000); // 1 second delay to ensure UI updates

      return () => clearTimeout(timer);
    }
  }, [hasInProgressStatus, shouldShowDisabledState]);

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
        onSuccess: () => {
          toaster.success({ title: "Tables assigned successfully" });
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
        {...context}
        shouldShowDisabledState={isAnyOperationActive}
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
              const { table, table_fields } = item;
              const isEven = index % 2 === 0;
              const rowBg = isEven ? "gray.100" : "white";
              const isExpanded = !!expanded[table];

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
                          <TbDelta
                            color="#2563EB"
                            size={18}
                            title="Delta table"
                          />
                        )}
                      </Flex>

                      <Flex justifyContent="center" minW="40px">
                        <Tooltip
                          content={
                            isAnyOperationActive &&
                            !(
                              reloadingTable === table && isReloadingSingleTable
                            )
                              ? "Another migration is in progress. Please wait until it is complete."
                              : ""
                          }
                          disabled={
                            !isAnyOperationActive ||
                            (reloadingTable === table && isReloadingSingleTable)
                          }
                        >
                          <Box
                            _hover={{
                              color:
                                isAnyOperationActive &&
                                !(
                                  reloadingTable === table &&
                                  isReloadingSingleTable
                                )
                                  ? "gray.400"
                                  : "brand.500",
                              cursor:
                                isAnyOperationActive &&
                                !(
                                  reloadingTable === table &&
                                  isReloadingSingleTable
                                )
                                  ? "not-allowed"
                                  : "pointer",
                            }}
                            p={1}
                            borderRadius="sm"
                            onClick={(e) => {
                              const isThisTableReloading =
                                reloadingTable === table &&
                                isReloadingSingleTable;
                              if (
                                isAnyOperationActive &&
                                !isThisTableReloading
                              ) {
                                e.preventDefault();
                                e.stopPropagation();
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
                                  connection_id: context.connection_id,
                                  table_name: table,
                                },
                                {
                                  onSettled: () => {
                                    setReloadingTable(null);
                                    setShouldShowDisabledState(false);
                                  },
                                },
                              );
                            }}
                            style={{
                              animation:
                                reloadingTable === table &&
                                isReloadingSingleTable
                                  ? "spin 1s linear infinite"
                                  : undefined,
                              cursor:
                                isAnyOperationActive &&
                                !(
                                  reloadingTable === table &&
                                  isReloadingSingleTable
                                )
                                  ? "not-allowed"
                                  : "pointer",
                              opacity:
                                isAnyOperationActive &&
                                !(
                                  reloadingTable === table &&
                                  isReloadingSingleTable
                                )
                                  ? 0.5
                                  : 1,
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
                          checked={userCheckedTables.some(
                            (t) => t.table === table,
                          )}
                        >
                          <Checkbox.HiddenInput />
                          <Checkbox.Control cursor="pointer" />
                        </Checkbox.Root>
                      </Flex>
                    </Flex>
                  </Flex>

                  {isExpanded && (
                    <Flex
                      direction="column"
                      gap={2}
                      paddingBlock={4}
                      width="100%"
                    >
                      {table_fields &&
                        Object.entries(table_fields).map(
                          ([field, fieldInfo]) => {
                            const dataType =
                              typeof fieldInfo === "string"
                                ? fieldInfo
                                : (fieldInfo as { data_type: string })
                                    .data_type;

                            return (
                              <Flex key={field} alignItems="center" gap={2}>
                                <Text fontSize="sm">
                                  {field}: {dataType}
                                </Text>
                              </Flex>
                            );
                          },
                        )}
                    </Flex>
                  )}
                </Flex>
              );
            })}
        </Flex>

        <SelectedTableList
          shouldShowDisabledState={isAnyOperationActive}
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
