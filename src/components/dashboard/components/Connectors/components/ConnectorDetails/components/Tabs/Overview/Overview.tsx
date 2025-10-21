import { useEffect, useState } from "react";

import { Flex, Grid, Text } from "@chakra-ui/react";

import { useOutletContext } from "react-router";

import LoadingSpinner from "@/components/shared/Spinner";
import useFetchConnectorActivity from "@/queryOptions/connector/useFetchConnectorActivity";
import useFetchConnectorActivityDetails from "@/queryOptions/connector/useFetchConnectorActivityDetails";
import { type Connector } from "@/types/connectors";

import Detail from "./Detail";
import Filter from "./Filter";
import Item from "./Item";

const Overview = () => {
  const context = useOutletContext<Connector>();
  const [filterDays, setFilterDays] = useState<number>(7);
  const { data, isLoading } = useFetchConnectorActivity(
    context.connection_id,
    filterDays,
  );
  const [selectedLog, setSelectedLog] = useState<number | null>(null);
  const { data: logDetails, isLoading: isLoadingDetails } =
    useFetchConnectorActivityDetails({
      connectionId: context.connection_id,
      sessionId: selectedLog || 0,
    });

  // Set selected log to first log when data changes
  useEffect(() => {
    if (data?.logs && data.logs.length > 0) {
      //Find elem with session_id not null
      const firstLogWithSessionId = data.logs.find(
        (log) => log.session_id !== null,
      );
      setSelectedLog(firstLogWithSessionId?.session_id || null);
    }
  }, [data]);

  if (isLoading) return <LoadingSpinner />;

  return (
    <Flex flexDirection="column" gap={4} w="100%">
      <Flex justifyContent="space-between" alignItems="center" paddingBlock={2}>
        <Text fontWeight="semibold">Connector activity</Text>
        <Filter filterDays={filterDays} setFilterDays={setFilterDays} />
      </Flex>
      <Grid templateColumns="repeat(2, 1fr)" gap={4} overflowX="auto" h="100%">
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
              onClick={() => {
                if (log.session_id) setSelectedLog(log.session_id);
              }}
              pointerEvent={log.session_id ? "pointer" : "not-allowed"}
              selectedLog={selectedLog}
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
