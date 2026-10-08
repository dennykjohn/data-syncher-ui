import { useMemo, useRef } from "react";

import { Badge, Box, Flex, Text } from "@chakra-ui/react";

import { type MappingTableRow } from "@/types/connectors";

import { useVirtualizer } from "@tanstack/react-virtual";

type FilterChip = "all" | "unmapped_source" | "unmapped_target" | "warnings";

interface VirtualMappingTableProps {
  rows: MappingTableRow[];
  search: string;
  filter: FilterChip;
}

const STATUS_COLOR: Record<string, string> = {
  Direct: "gray",
  Constant: "blue",
  Narrowed: "orange",
  "Date check": "yellow",
  "From script": "purple",
  "Not in SAP": "red",
  "Added by user": "teal",
};

const VirtualMappingTable = ({
  rows,
  search,
  filter,
}: VirtualMappingTableProps) => {
  const parentRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((row) => {
      if (filter === "unmapped_source" && row.sap_column) return false;
      if (filter === "unmapped_target" && row.target_column) return false;
      if (
        filter === "warnings" &&
        !["Narrowed", "Date check", "Not in SAP"].includes(row.status)
      )
        return false;
      if (!q) return true;
      return (
        (row.sap_column || "").toLowerCase().includes(q) ||
        row.target_column.toLowerCase().includes(q)
      );
    });
  }, [rows, search, filter]);

  const virtualizer = useVirtualizer({
    count: filtered.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 40,
    overscan: 8,
  });

  return (
    <Box
      ref={parentRef}
      maxH="320px"
      overflowY="auto"
      borderWidth={1}
      borderColor="gray.200"
      borderRadius="md"
    >
      <Flex
        px={3}
        py={2}
        bg="gray.50"
        fontSize="xs"
        fontWeight="semibold"
        color="gray.600"
        borderBottomWidth={1}
        position="sticky"
        top={0}
        zIndex={1}
      >
        <Box flex="1">SAP column → Target column</Box>
        <Box w="100px">Status</Box>
      </Flex>
      <Box h={`${virtualizer.getTotalSize()}px`} position="relative">
        {virtualizer.getVirtualItems().map((vItem) => {
          const row = filtered[vItem.index];
          const renamed = row.renamed;
          return (
            <Flex
              key={`${row.target_column}-${vItem.index}`}
              position="absolute"
              top={0}
              left={0}
              w="100%"
              h={`${vItem.size}px`}
              transform={`translateY(${vItem.start}px)`}
              px={3}
              py={2}
              align="center"
              borderBottomWidth={1}
              borderColor="gray.100"
              fontSize="sm"
            >
              <Flex flex="1" align="center" gap={2} minW={0}>
                <Text truncate color={row.sap_column ? "gray.800" : "gray.400"}>
                  {row.sap_column || "none"}
                </Text>
                {row.status === "From script" ? (
                  <Text color="purple.500" fontSize="xs">
                    script →
                  </Text>
                ) : (
                  <Text
                    color={renamed ? "brand.500" : "gray.400"}
                    fontWeight={renamed ? "bold" : "normal"}
                  >
                    →
                  </Text>
                )}
                <Text truncate fontWeight="medium">
                  {row.target_column}
                </Text>
              </Flex>
              <Badge
                size="sm"
                colorPalette={STATUS_COLOR[row.status] || "gray"}
                variant="subtle"
              >
                {row.status}
              </Badge>
            </Flex>
          );
        })}
      </Box>
      {filtered.length === 0 && (
        <Text p={4} fontSize="sm" color="gray.500">
          No rows match the current filter.
        </Text>
      )}
    </Box>
  );
};

export default VirtualMappingTable;
