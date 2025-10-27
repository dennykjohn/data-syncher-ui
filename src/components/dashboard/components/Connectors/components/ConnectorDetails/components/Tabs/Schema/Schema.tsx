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
import { IoMdPlay } from "react-icons/io";
import { IoCaretDownSharp } from "react-icons/io5";
import { MdSearch } from "react-icons/md";

import { useOutletContext } from "react-router";

import LoadingSpinner from "@/components/shared/Spinner";
import { toaster } from "@/components/ui/toaster";
import useFetchConnectorTableById from "@/queryOptions/connector/schema/useFetchTable";
import useUpdateSelectedTables from "@/queryOptions/connector/schema/useUpdateSelectedTables";
import { type Connector, type ConnectorTable } from "@/types/connectors";

import Actions from "./Actions";
import SelectedTableList from "./SelectedTable";

const Schema = () => {
  const context = useOutletContext<Connector>();

  // Fetch data
  const { data: AllTableList, isLoading: isAllTableListLoading } =
    useFetchConnectorTableById(context.connection_id);
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

  const checkedTables = useMemo<ConnectorTable[]>(() => {
    if (!AllTableList) return [];
    return AllTableList.filter((t) => t.selected);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [AllTableList, recalculatedCheckedTables]);

  // Save a Copy on initial checked tables
  // to compare for changes
  const copyOfInitialCheckedTables: ConnectorTable[] = useMemo(() => {
    if (!AllTableList) return [];
    return AllTableList.filter((t) => t.selected);
  }, [AllTableList]);

  // Local writable state (only for user interactions)
  const [userCheckedTables, setUserCheckedTables] = useState<ConnectorTable[]>(
    () => checkedTables,
  );

  useEffect(() => {
    setUserCheckedTables(checkedTables);
  }, [checkedTables]);

  // Recompute difference when data changes (optional lazy sync)
  const hasCheckedTablesChanged = useMemo(() => {
    return (
      userCheckedTables.length !== copyOfInitialCheckedTables.length ||
      userCheckedTables.some(
        (table) =>
          !copyOfInitialCheckedTables.find((t) => t.table === table.table),
      )
    );
  }, [userCheckedTables, copyOfInitialCheckedTables]);

  // Track expanded tables
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
      <Actions {...context} />
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
          <Flex mb={4} justifyContent="space-between">
            <Text fontSize="sm" fontWeight="semibold">
              Table Names
            </Text>
            <Text fontSize="sm" fontWeight="semibold">
              Select
            </Text>
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
                  <Flex alignItems="center" gap={2} width="100%">
                    <Box
                      onClick={() => toggleExpand(table)}
                      style={{ cursor: "pointer" }}
                      padding={1}
                      _hover={{ backgroundColor: "brand.200", borderRadius: 4 }}
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
                    <Checkbox.Root
                      colorPalette="brand"
                      marginLeft="auto"
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
                  {isExpanded && (
                    <Flex direction="column" gap={2} paddingBlock={4}>
                      {table_fields &&
                        Object.entries(table_fields).map(([field, type]) => (
                          <Text key={field} fontSize="sm">
                            {field}: {type}
                          </Text>
                        ))}
                    </Flex>
                  )}
                </Flex>
              );
            })}
        </Flex>
        <SelectedTableList />
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
