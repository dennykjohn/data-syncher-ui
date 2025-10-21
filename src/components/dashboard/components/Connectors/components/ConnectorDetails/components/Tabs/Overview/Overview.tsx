import { useEffect, useState } from "react";

import { Flex, Grid, Text } from "@chakra-ui/react";

import { useOutletContext } from "react-router";

import LoadingSpinner from "@/components/shared/Spinner";
import useFetchConnectorActivity from "@/queryOptions/connector/useFetchConnectorActivity";
import useFetchConnectorActivityDetails from "@/queryOptions/connector/useFetchConnectorActivityDetails";
import { type Connector } from "@/types/connectors";

import Detail from "./Detail";
import Item from "./Item";

const Overview = () => {
  const context = useOutletContext<Connector>();
  const { data, isLoading } = useFetchConnectorActivity(context.connection_id);
  const [selectedLog, setSelectedLog] = useState<number | null>(null);
  const { data: logDetails, isLoading: isLoadingDetails } =
    useFetchConnectorActivityDetails({
      connectionId: context.connection_id,
      sessionId: selectedLog || 0,
    });

  // Set selected log to first log when data changes
  useEffect(() => {
    if (data?.logs && data.logs.length > 0) {
      setSelectedLog(data.logs[0].session_id);
    }
  }, [data]);

  if (isLoading) return <LoadingSpinner />;

  return (
    <Flex flexDirection="column" gap={4} w="100%">
      <Flex>
        <Text fontWeight="semibold">Connector activity</Text>
      </Flex>
      <Grid templateColumns="repeat(2, 1fr)" gap={4} overflowX="auto">
        <Flex
          direction="column"
          bgColor="white"
          overflowX="auto"
          borderRadius="md"
        >
          {data?.logs.map((log, index) => (
            <Item
              key={index}
              log={log}
              isSelected={log.session_id === selectedLog}
              onClick={() => setSelectedLog(log.session_id)}
            />
          ))}
        </Flex>
        <Flex
          direction="column"
          gap={2}
          bgColor="white"
          overflowX="auto"
          paddingInline={4}
          borderRadius="md"
        >
          {isLoadingDetails ? (
            <LoadingSpinner />
          ) : (
            logDetails?.logs.map((detail, index) => (
              <Detail key={index} detail={detail} />
            ))
          )}
        </Flex>
      </Grid>
    </Flex>
  );
};

export default Overview;
