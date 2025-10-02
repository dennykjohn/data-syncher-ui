import { Flex, Grid, Text } from "@chakra-ui/react";

import { useOutletContext } from "react-router";

import LoadingSpinner from "@/components/shared/Spinner";
import { useFetchConnectorActivity } from "@/queryOptions/connector/useFetchConnectorActivity";
import { type Connector } from "@/types/connectors";

const Overview = () => {
  const context = useOutletContext<Connector>();

  const { data, isLoading } = useFetchConnectorActivity(context.connection_id);

  if (isLoading) return <LoadingSpinner />;
  console.log(data);

  return (
    <Flex flexDirection="column" gap={4} w="100%">
      <Flex>
        <Text fontWeight="semibold">Connector activity</Text>
      </Flex>
      <Grid templateColumns="repeat(2, 1fr)" gap={4}>
        <Flex
          direction="column"
          gap={2}
          borderWidth={1}
          borderColor="gray.300"
          borderRadius="lg"
          padding={4}
          bgColor="white"
        >
          Test 1
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
          Test 2
        </Flex>
      </Grid>
    </Flex>
  );
};

export default Overview;
