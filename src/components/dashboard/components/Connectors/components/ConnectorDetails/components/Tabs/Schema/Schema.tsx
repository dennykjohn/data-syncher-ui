/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";

import {
  ActionBar,
  Box,
  Button,
  Checkbox,
  Flex,
  Grid,
  Input,
  InputGroup,
  Portal,
  Text,
} from "@chakra-ui/react";

import { GoPlus } from "react-icons/go";
import { IoMdPlay } from "react-icons/io";
import { IoCaretDownSharp } from "react-icons/io5";
import { MdSearch } from "react-icons/md";

import { useOutletContext } from "react-router";

import LoadingSpinner from "@/components/shared/Spinner";
import { toaster } from "@/components/ui/toaster";
import useFetchSelectedTables from "@/queryOptions/connector/schema/useFetchSelectedTables";
import useFetchConnectorTableById from "@/queryOptions/connector/schema/useFetchTable";
import useUpdateSelectedTables from "@/queryOptions/connector/schema/useUpdateSelectedTables";
import {
  type Connector,
  type ConnectorSelectedTable,
  type ConnectorTable,
} from "@/types/connectors";

import Actions from "./Actions";
import SelectedTableList from "./SelectedTable";

const Schema = () => {
  const context = useOutletContext<Connector>();
  const { data: AllTableList, isLoading: isAllTableListLoading } =
    useFetchConnectorTableById(context.connection_id);
  const { data: SelectedTables, isLoading: isLoadingSelected } =
    useFetchSelectedTables(context.connection_id);
  const { mutate: updateTables, isPending: isAssigningTables } =
    useUpdateSelectedTables({
      connectorId: context.connection_id,
    });

  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [selectedTables, setSelectedTables] = useState<
    ConnectorSelectedTable[]
  >([]);

  const [checkedTables, setCheckedTables] = useState<ConnectorTable[]>([]);
  const [copyOfInitialCheckedTables, setCopyOfInitialCheckedTables] = useState<
    ConnectorTable[]
  >([]);

  const [searchQuery, setSearchQuery] = useState<string>("");

  // 1. Store initial checkedTables on first load
  useEffect(() => {
    if (AllTableList && SelectedTables) {
      const checked = AllTableList.filter((t) => t.selected);
      setCopyOfInitialCheckedTables(checked);
    }
  }, [AllTableList, SelectedTables]);

  // Show Action bar when if the contents of
  // checked table and copyOfInitialCheckedTables changes
  const hasCheckedTablesChanged =
    checkedTables.length !== copyOfInitialCheckedTables.length ||
    checkedTables.some(
      (table) =>
        !copyOfInitialCheckedTables.find((t) => t.table === table.table),
    );

  useEffect(() => {
    if (SelectedTables) {
      setSelectedTables(SelectedTables);
    }
  }, [SelectedTables]);

  // Set selected Tables in AllTableList in CheckedTables
  useEffect(() => {
    if (AllTableList) {
      const checked = AllTableList.filter((t) =>
        selectedTables.some((st) => st.table === t.table),
      );
      setCheckedTables(checked);
    }
  }, [AllTableList, selectedTables]);

  // Track expanded tables
  const toggleExpand = (table: string) =>
    setExpanded((prev) => ({
      ...prev,
      [table]: !prev[table],
    }));

  const handleAssignTables = () => {
    const tablesToAdd = checkedTables.map((t) => ({ table: t.table }));
    updateTables(
      { selected_tables: tablesToAdd.map((t) => t.table) },
      {
        onSuccess: () => {
          setCheckedTables([]);
          toaster.success({ title: "Tables assigned successfully" });
        },
      },
    );
  };

  if (isAllTableListLoading || isLoadingSelected) {
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
          {(isAssigningTables || isAllTableListLoading) && <LoadingSpinner />}
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
                        if (checked) {
                          setCheckedTables((prev) => [...prev, item]);
                        } else {
                          setCheckedTables((prev) =>
                            prev.filter((t) => t.table !== table),
                          );
                        }
                      }}
                      checked={checkedTables.some((t) => t.table === table)}
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
