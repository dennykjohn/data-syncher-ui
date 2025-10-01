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
    <Flex direction="column" gap={2} mb={2}>
      <Flex w="100%">
        <Text fontWeight="semibold" flexGrow={1} w="100%">
          Target Details
        </Text>
      </Flex>
      <Flex
        justifyContent="space-between"
        alignItems="center"
        flexWrap="wrap"
        gap={4}
      >
        <Flex gap={4}>
          <Flex gap={2}>
            <Text>Target database:</Text>
            <Text fontWeight="semibold">AT Denny</Text>
          </Flex>
          <Flex gap={2}>
            <Text>Target Schema:</Text>
            <Text fontWeight="semibold">AT Denny</Text>
          </Flex>
        </Flex>
        <Flex gap={4}>
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
    </Flex>
  );
};

export default Actions;
