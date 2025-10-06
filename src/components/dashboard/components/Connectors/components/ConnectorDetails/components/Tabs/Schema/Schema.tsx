import { useEffect, useState } from "react";

import {
  ActionBar,
  Box,
  Button,
  Checkbox,
  Flex,
  Grid,
  Image,
  Portal,
  Text,
} from "@chakra-ui/react";

import { GoPlus } from "react-icons/go";
import { IoMdPlay } from "react-icons/io";
import { IoCaretDownSharp, IoRefreshSharp } from "react-icons/io5";
import { RxDragHandleDots2 } from "react-icons/rx";
import { SlRefresh } from "react-icons/sl";

import { useOutletContext } from "react-router";

import CheckIcon from "@/assets/icons/check-icon.svg";
import ErrorIcon from "@/assets/icons/error-icon.svg";
import SandtimeIcon from "@/assets/icons/sand-time-icon.svg";
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

    const newList = [...selectedTables!] as ConnectorSelectedTable[];
    const draggedIndex = newList.findIndex(
      (i) => i.table === draggedItem.table,
    );
    const targetIndex = newList.findIndex((i) => i.table === targetItem.table);

    newList.splice(draggedIndex, 1);
    newList.splice(targetIndex, 0, draggedItem);

    setSelectedTables(newList);
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
            AllTableList?.map((item, index) => {
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
        <Flex
          direction="column"
          gap={2}
          borderWidth={1}
          borderColor="gray.300"
          borderRadius="lg"
          padding={4}
          bgColor="white"
        >
          <Flex mb={4}>
            <Text fontSize="sm" fontWeight="semibold">
              Selected Tables
            </Text>
          </Flex>
          {selectedTables?.map((table, index) => {
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
                <Flex gap={2} alignItems="center">
                  <Text fontSize="sm">{table.table}</Text>
                  {status === "in_progress" && <Image src={SandtimeIcon} />}
                  {status === "completed" && <Image src={CheckIcon} />}
                  {status === "failed" && <Image src={ErrorIcon} />}
                </Flex>
                <Flex gap={3}>
                  <Box
                    _hover={{
                      color: "brand.500",
                      backgroundColor: "gray.300",
                    }}
                    p={1}
                    borderRadius="sm"
                  >
                    <IoRefreshSharp cursor="pointer" />
                  </Box>
                  <Box
                    _hover={{
                      color: "brand.500",
                      backgroundColor: "gray.300",
                    }}
                    p={1}
                    borderRadius="sm"
                  >
                    <SlRefresh cursor="pointer" />
                  </Box>
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
            );
          })}
        </Flex>
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
