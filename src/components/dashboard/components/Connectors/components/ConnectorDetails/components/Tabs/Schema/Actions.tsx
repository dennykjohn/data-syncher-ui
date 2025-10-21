import { Button, Flex, Text } from "@chakra-ui/react";

import { MdRefresh } from "react-icons/md";

import useRefreshSchema from "@/queryOptions/connector/schema/useRefreshSchema";
import useUpdateSchema from "@/queryOptions/connector/schema/useUpdateSchema";

const Actions = ({
  connection_id,
  target_database,
  target_schema,
}: {
  connection_id: number;
  target_database: string;
  target_schema: string;
}) => {
  const { mutate: refreshSchema, isPending: isRefreshing } = useRefreshSchema({
    connectorId: connection_id,
  });
  const { mutate: updateSchema, isPending: isUpdating } = useUpdateSchema({
    connectorId: connection_id,
  });

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
            <Text fontWeight="semibold">{target_database}</Text>
          </Flex>
          <Flex gap={2}>
            <Text>Target Schema:</Text>
            <Text fontWeight="semibold">{target_schema}</Text>
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
            loading={isUpdating}
            onClick={() => updateSchema()}
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
