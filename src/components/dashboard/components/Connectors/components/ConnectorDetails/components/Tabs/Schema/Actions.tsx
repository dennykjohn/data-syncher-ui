import { Button, Flex, Text } from "@chakra-ui/react";

import { MdRefresh } from "react-icons/md";

import useFetchConnectorTableById from "@/queryOptions/connector/schema/useFetchTable";
import useRefreshSchema from "@/queryOptions/connector/schema/useRefreshSchema";

const Actions = ({ connection_id }: { connection_id: number }) => {
  const { mutate: refreshSchema, isPending: isRefreshing } = useRefreshSchema({
    connectorId: connection_id,
  });
  const { refetch: fetchTables, isLoading } =
    useFetchConnectorTableById(connection_id);

  return (
    <Flex direction={{ base: "row", md: "column" }} gap={2} mb={2}>
      <Text fontWeight="semibold">Target Details</Text>
      <Flex justifyContent="space-between" alignItems="center">
        <Text>Target database: AT Denny</Text>
        <Text>Target Schema: AT Denny</Text>
        <Button
          variant="ghost"
          colorPalette="red"
          color="red.500"
          onClick={() => refreshSchema()}
          loading={isRefreshing}
        >
          <MdRefresh />
          Refresh schema
        </Button>
        <Button
          variant="outline"
          colorPalette="brand"
          loading={isLoading}
          onClick={() => fetchTables()}
        >
          <MdRefresh />
          Update schema
        </Button>
      </Flex>
    </Flex>
  );
};

export default Actions;
