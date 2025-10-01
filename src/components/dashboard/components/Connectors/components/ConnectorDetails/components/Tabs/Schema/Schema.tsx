import { useEffect, useMemo, useState } from "react";

import { Box, Checkbox, Flex, Grid, Image, Text } from "@chakra-ui/react";

import { IoMdPlay } from "react-icons/io";
import { IoCaretDownSharp } from "react-icons/io5";

import { useOutletContext } from "react-router";

import CheckIcon from "@/assets/icons/check-icon.svg";
import ErrorIcon from "@/assets/icons/error-icon.svg";
import SandtimeIcon from "@/assets/icons/sand-time-icon.svg";
import LoadingSpinner from "@/components/shared/Spinner";
import useFetchSelectedTables from "@/queryOptions/connector/schema/useFetchSelectedTables";
import useFetchConnectorTableById from "@/queryOptions/connector/schema/useFetchTable";
import {
  type Connector,
  type ConnectorSelectedTable,
} from "@/types/connectors";

import Actions from "./Actions";

const Schema = () => {
  const context = useOutletContext<Connector>();
  const { data: tables, isLoading } = useFetchConnectorTableById(
    context.connection_id,
  );
  const { data: SelectedTables, isLoading: isLoadingSelected } =
    useFetchSelectedTables(context.connection_id);

  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [selectedTables, setSelectedTables] = useState<
    ConnectorSelectedTable[]
  >([]);

  useEffect(() => {
    if (SelectedTables) {
      setSelectedTables(SelectedTables);
    }
  }, [SelectedTables]);

  const unSelectedTables = useMemo(
    () => tables?.filter((t) => !t.selected) || [],
    [tables],
  );

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
    setDraggedItem(null);
  };

  if (isLoading || isLoadingSelected) {
    return <LoadingSpinner />;
  }

  return (
    <Flex flexDirection="column" gap={4} pb={8}>
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
          {unSelectedTables?.map(({ table, table_fields }, index) => {
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
                  <Text>{table.table}</Text>
                  {status === "in_progress" && <Image src={SandtimeIcon} />}
                  {status === "completed" && <Image src={CheckIcon} />}
                  {status === "failed" && <Image src={ErrorIcon} />}
                </Flex>
              </Flex>
            );
          })}
        </Flex>
      </Grid>
    </Flex>
  );
};

export default Schema;
