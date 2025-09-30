import { useState } from "react";

import { Box, Button, Checkbox, Flex, Grid, Text } from "@chakra-ui/react";

import { IoMdPlay } from "react-icons/io";
import { IoCaretDownSharp } from "react-icons/io5";
import { MdRefresh } from "react-icons/md";

import { useOutletContext } from "react-router";

import LoadingSpinner from "@/components/shared/Spinner";
import useFetchConnectorTableById from "@/queryOptions/connector/schema/useFetchTable";
import { type Connector } from "@/types/connectors";

const Schema = () => {
  const context = useOutletContext<Connector>();
  const { data: tables, isLoading } = useFetchConnectorTableById(
    context.connection_id,
  );
  const selectedTables = tables?.filter((table) => table.selected);
  const unSelectedTables = tables?.filter((table) => !table.selected);

  // Track expanded tables
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const toggleExpand = (table: string) => {
    setExpanded((prev) => ({
      ...prev,
      [table]: !prev[table],
    }));
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <Flex flexDirection="column" gap={4} pb={8}>
      <Flex direction={{ base: "row", md: "column" }} gap={2} mb={2}>
        <Text fontWeight="semibold">Target Details</Text>
        <Flex justifyContent="space-between" alignItems="center">
          <Text>Target database: AT Denny</Text>
          <Text>Target Schema: AT Denny</Text>
          <Button variant="ghost" colorPalette="red" color="red.500">
            <MdRefresh />
            Refresh schema
          </Button>
          <Button variant="outline" colorPalette="brand">
            <MdRefresh />
            Update schema
          </Button>
        </Flex>
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
          {selectedTables?.map(({ table }, index) => {
            const isEven = index % 2 === 0;
            const rowBg = isEven ? "gray.100" : "white";

            return (
              <Flex
                key={table}
                justifyContent="space-between"
                backgroundColor={rowBg}
                alignItems="center"
                padding={2}
                borderRadius={4}
              >
                <Text>{table}</Text>
              </Flex>
            );
          })}
        </Flex>
      </Grid>
    </Flex>
  );
};

export default Schema;
