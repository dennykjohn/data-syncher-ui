import { useMemo, useState } from "react";

import { Flex, Grid, Text } from "@chakra-ui/react";

import { FcComboChart } from "react-icons/fc";

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
  const [filterDays, setFilterDays] = useState<number>(1);
  const { data, isLoading } = useFetchConnectorActivity(
    context.connection_id,
    filterDays,
  );
  const [selectedLog, setSelectedLog] = useState<number | null>(null);

  // derive first log with session id from data
  const firstLogWithSessionId = useMemo(
    () => data?.logs?.find((log) => log.session_id !== null),
    [data],
  );

  // effective selected log: user selection wins, otherwise first available
  const effectiveSelectedLog =
    selectedLog ?? firstLogWithSessionId?.session_id ?? null;

  const { data: logDetails, isLoading: isLoadingDetails } =
    useFetchConnectorActivityDetails({
      connectionId: context.connection_id,
      sessionId: effectiveSelectedLog || 0,
    });

  if (isLoading) return <LoadingSpinner />;

  return (
    <Flex flexDirection="column" gap={4} w="100%">
      <Flex justifyContent="space-between" alignItems="center" paddingBlock={2}>
        <Text fontWeight="semibold">Connector activity</Text>
        <Filter filterDays={filterDays} setFilterDays={setFilterDays} />
      </Flex>
      <Grid
        minW="2xl"
        templateColumns="repeat(2, 1fr)"
        gap={4}
        overflowX="auto"
        h="100%"
      >
        <Flex
          direction="column"
          bgColor="white"
          overflowX="auto"
          borderRadius="md"
        >
          {data?.logs.length === 0 && (
            <Flex
              direction="column"
              alignItems="center"
              justifyContent="center"
              gap={2}
              padding={8}
              h="100%"
            >
              <FcComboChart size={48} />
              <Text color="brand.500">No logs available</Text>
            </Flex>
          )}
          {data?.logs.map((log, index) => (
            <Item
              key={index}
              log={log}
              onClick={() => {
                if (log.session_id) setSelectedLog(log.session_id);
              }}
              pointerEvent={log.session_id ? "pointer" : "not-allowed"}
              selectedLog={effectiveSelectedLog}
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
            <>
              {!effectiveSelectedLog && (
                <Flex
                  direction="column"
                  alignItems="center"
                  justifyContent="center"
                  gap={2}
                  padding={8}
                  h="100%"
                >
                  <FcComboChart size={48} />
                  <Text color="brand.500">No log selected</Text>
                </Flex>
              )}
              {logDetails?.logs.length === 0 && (
                <Flex
                  direction="column"
                  alignItems="center"
                  justifyContent="center"
                  gap={2}
                  padding={8}
                  h="100%"
                >
                  <FcComboChart size={48} />
                  <Text color="brand.500">No logs available</Text>
                </Flex>
              )}
              {logDetails?.logs.map((detail, index) => (
                <Detail key={index} detail={detail} />
              ))}
            </>
          )}
        </Flex>
      </Grid>
    </Flex>
  );
};

export default Overview;
