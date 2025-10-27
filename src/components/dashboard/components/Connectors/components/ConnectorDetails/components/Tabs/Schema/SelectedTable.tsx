import { useState } from "react";

import { Box, Flex, For, Image, Skeleton, Text } from "@chakra-ui/react";

import { GrRefresh } from "react-icons/gr";
import { RxDragHandleDots2 } from "react-icons/rx";
import { SlRefresh } from "react-icons/sl";

import { useOutletContext } from "react-router";

import CheckIcon from "@/assets/icons/check-icon.svg";
import ErrorIcon from "@/assets/icons/error-icon.svg";
import SandtimeIcon from "@/assets/icons/sand-time-icon.svg";
import { toaster } from "@/components/ui/toaster";
import useFetchSelectedTables from "@/queryOptions/connector/schema/useFetchSelectedTables";
import useRefreshDeltaTable from "@/queryOptions/connector/schema/useRefreshDeltaTable";
import useReloadSingleTable from "@/queryOptions/connector/schema/useReloadSingleTable";
import useUpdateSelectedTables from "@/queryOptions/connector/schema/useUpdateSelectedTables";
import {
  type Connector,
  type ConnectorSelectedTable,
} from "@/types/connectors";

const SelectedTable = () => {
  const context = useOutletContext<Connector>();

  const [refreshingTable, setRefreshingTable] = useState<string | null>(null);
  const [reloadingTable, setReloadingTable] = useState<string | null>(null);

  const { data: selectedTables, isLoading: isLoadingSelected } =
    useFetchSelectedTables(context.connection_id);

  const { mutate: updateTables, isPending: isAssigningTables } =
    useUpdateSelectedTables({
      connectorId: context.connection_id,
    });

  const { mutate: reloadSingleTable, isPending: isReloadingSingleTable } =
    useReloadSingleTable();
  const { mutate: refreshDeltaTable, isPending: isRefreshingDeltaTable } =
    useRefreshDeltaTable();

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
    newList.splice(targetIndex, 0, draggedItem);

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
      <Flex mb={4}>
        <Text fontSize="sm" fontWeight="semibold" mr={2}>
          Selected Tables
        </Text>
      </Flex>
      {(isAssigningTables || isLoadingSelected) && (
        <For each={[...Array(10).keys()]}>
          {() => <Skeleton gap="4" height={8} />}
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
                  }}
                  p={1}
                  borderRadius="sm"
                  onClick={() => {
                    setReloadingTable(table.table);
                    reloadSingleTable(
                      {
                        connection_id: context.connection_id,
                        table_name: table.table,
                      },
                      {
                        onSettled: () => setReloadingTable(null), // clear after done
                      },
                    );
                  }}
                  style={{
                    animation:
                      reloadingTable === table.table && isReloadingSingleTable
                        ? "spin 1s linear infinite"
                        : undefined,
                    cursor: "pointer",
                  }}
                >
                  <GrRefresh />
                </Box>
                <Box
                  _hover={{
                    color: "brand.500",
                  }}
                  p={1}
                  borderRadius="sm"
                  onClick={() => {
                    setRefreshingTable(table.table);
                    refreshDeltaTable(
                      {
                        connection_id: context.connection_id,
                        table_name: table.table,
                      },
                      {
                        onSettled: () => setRefreshingTable(null), // clear after done
                      },
                    );
                  }}
                  style={{
                    animation:
                      refreshingTable === table.table && isRefreshingDeltaTable
                        ? "spin 1s linear infinite"
                        : undefined,
                    cursor: "pointer",
                  }}
                >
                  <SlRefresh />
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
  );
};

export default SelectedTable;
