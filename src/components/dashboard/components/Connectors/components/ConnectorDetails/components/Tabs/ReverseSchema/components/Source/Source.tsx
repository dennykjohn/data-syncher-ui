import { useEffect, useMemo, useState } from "react";

import { Box, Flex, Input, InputGroup, Text } from "@chakra-ui/react";

import { IoMdPlay } from "react-icons/io";
import { IoCaretDownSharp } from "react-icons/io5";
import { MdSearch } from "react-icons/md";

import Pagination from "@/components/shared/Pagination";
import { usePagination } from "@/queryOptions/connector/schema/usePagination";
import { type ReverseSchemaResponse } from "@/types/connectors";

import { isPrimaryKey } from "../../utils/validation";

const ITEMS_PER_PAGE = 10;

interface SourceProps {
  reverseSchemaData: ReverseSchemaResponse | null;
}

const Source = ({ reverseSchemaData }: SourceProps) => {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [draggedTable, setDraggedTable] = useState<string | null>(null);

  const toggleExpand = (table: string) =>
    setExpanded((prev) => ({
      ...prev,
      [table]: !prev[table],
    }));

  const filteredTables = useMemo(() => {
    const sourceTableList = reverseSchemaData?.source_tables || [];
    if (!sourceTableList.length) return [];
    return sourceTableList.filter((item) =>
      item.table.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [reverseSchemaData?.source_tables, searchQuery]);

  const {
    currentData: paginatedTables,
    currentPage,
    totalPages,
    jumpToPage,
  } = usePagination({ data: filteredTables, itemsPerPage: ITEMS_PER_PAGE });

  // Reset to page 1 when search changes
  useEffect(() => {
    jumpToPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  return (
    <Flex
      direction="column"
      gap={2}
      borderWidth={1}
      borderColor="gray.300"
      borderRadius="lg"
      padding={4}
      bgColor="white"
      w="100%"
      maxW="100%"
    >
      <Flex mb={4} justifyContent="space-between" alignItems="center">
        <Flex alignItems="center" gap={2}>
          <Text fontSize="sm" fontWeight="semibold">
            Source Tables
          </Text>
        </Flex>
      </Flex>

      <Flex mb={4}>
        <InputGroup endElement={<MdSearch size={24} />}>
          <Input
            placeholder="Search table name"
            size="sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </InputGroup>
      </Flex>

      {!filteredTables.length && (
        <Flex direction="column" alignItems="center" py={8}>
          <Text>No Source Tables available</Text>
        </Flex>
      )}

      {filteredTables.length > 0 && (
        <>
          <Flex direction="column" gap={2}>
            {paginatedTables.map((item, index) => {
              const { table, table_fields } = item;
              const isEven = index % 2 === 0;
              const rowBg = isEven ? "gray.100" : "white";
              const isExpanded = !!expanded[table];
              const isSelected = selectedTable === table;
              const isDragging = draggedTable === table;

              return (
                <Flex
                  key={table}
                  draggable={isSelected}
                  onClick={() => setSelectedTable(isSelected ? null : table)}
                  onDragStart={(e) => {
                    if (!isSelected) {
                      e.preventDefault();
                      return;
                    }
                    setDraggedTable(table);
                    e.dataTransfer.effectAllowed = "move";
                    e.dataTransfer.setData("text/plain", table);
                    e.dataTransfer.setData("source-table", table);
                  }}
                  onDragEnd={() => {
                    setDraggedTable(null);
                    setSelectedTable(null);
                  }}
                  justifyContent="space-between"
                  backgroundColor={
                    isDragging ? "blue.100" : isSelected ? "blue.50" : rowBg
                  }
                  alignItems="center"
                  direction={isExpanded ? "column" : "row"}
                  padding={2}
                  borderRadius={4}
                  style={{
                    cursor: isDragging
                      ? "grabbing"
                      : isSelected
                        ? "grab"
                        : "pointer",
                    userSelect: "none",
                    WebkitUserSelect: "none",
                    opacity: isDragging ? 0.8 : 1,
                  }}
                  borderWidth={isDragging || isSelected ? 2 : 0}
                  borderColor={
                    isDragging
                      ? "blue.500"
                      : isSelected
                        ? "blue.300"
                        : "transparent"
                  }
                  _hover={
                    isDragging
                      ? {}
                      : {
                          backgroundColor: isSelected ? "blue.100" : "gray.50",
                        }
                  }
                >
                  <Flex
                    alignItems="center"
                    justifyContent="space-between"
                    gap={2}
                    width="100%"
                  >
                    <Flex alignItems="center" gap={2} flex="1">
                      <Box
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleExpand(table);
                        }}
                        cursor="pointer"
                        padding={1}
                        _hover={{
                          backgroundColor: "brand.200",
                          borderRadius: 4,
                        }}
                      >
                        {isExpanded ? <IoCaretDownSharp /> : <IoMdPlay />}
                      </Box>
                      <Text fontSize="sm" fontWeight="medium" flex="1">
                        {table}
                      </Text>
                    </Flex>
                  </Flex>

                  {isExpanded && (
                    <Flex
                      direction="column"
                      gap={2}
                      paddingBlock={4}
                      width="100%"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {table_fields &&
                        Object.entries(table_fields).map(
                          ([field, fieldInfo]) => {
                            const dataType =
                              typeof fieldInfo === "string"
                                ? fieldInfo
                                : (fieldInfo as { data_type: string })
                                    .data_type;
                            const isPK = isPrimaryKey(field, fieldInfo);

                            return (
                              <Flex
                                key={field}
                                direction="column"
                                gap={1}
                                width="100%"
                              >
                                <Flex alignItems="center" gap={2}>
                                  {isPK && <Text>🔑</Text>}
                                  <Text fontSize="sm">
                                    {field}: {dataType}
                                  </Text>
                                </Flex>
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
  );
};

export default Source;
