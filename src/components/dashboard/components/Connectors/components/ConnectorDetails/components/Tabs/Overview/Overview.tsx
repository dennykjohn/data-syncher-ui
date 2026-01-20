import { useMemo, useState } from "react";

import { Flex, Grid, Text } from "@chakra-ui/react";

import { useOutletContext } from "react-router";

import LoadingSpinner from "@/components/shared/Spinner";
import useFetchConnectorActivity from "@/queryOptions/connector/useFetchConnectorActivity";
import useFetchConnectorActivityDetails from "@/queryOptions/connector/useFetchConnectorActivityDetails";
import {
  type Connector,
  type ConnectorActivityDetailResponse,
} from "@/types/connectors";

import Filter from "./Filter";
import Item from "./Item";
import MigrationProgressTable from "./components/MigrationProgressTable";

const Overview = () => {
  const context = useOutletContext<
    Connector & { filterDays: number; setFilterDays: (_days: number) => void }
  >();
  const { data, isLoading } = useFetchConnectorActivity(
    context.connection_id,
    context.filterDays,
  );
  const [userSelectedLog, setUserSelectedLog] = useState<number | null>(null);

  // Derive the effective selected log: user selection wins, otherwise auto-select first log
  const effectiveSelectedLog = useMemo(() => {
    if (userSelectedLog !== null) {
      return userSelectedLog;
    }

    // Auto-select first log if available
    if (data?.logs?.length) {
      const firstLog = data.logs[0];
      return firstLog.migration_id ?? firstLog.session_id ?? null;
    }

    return null;
  }, [userSelectedLog, data?.logs]);

  // Find the active log object to check properties
  const activeLog = useMemo(
    () =>
      data?.logs?.find(
        (log) =>
          log.migration_id === effectiveSelectedLog ||
          log.session_id === effectiveSelectedLog,
      ),
    [data, effectiveSelectedLog],
  );

  // Only fetch if is_clickable is true and we have a migration_id
  const migrationIdToFetch =
    activeLog?.is_clickable && activeLog?.migration_id
      ? activeLog.migration_id
      : 0;

  const { data: logDetails, isLoading: isLoadingDetails } =
    useFetchConnectorActivityDetails({
      migrationId: migrationIdToFetch,
    });

  if (isLoading) return <LoadingSpinner />;

  return (
    <Flex flexDirection="column" gap={2} w="100%" h="full">
      {/* Header Section if needed, though mostly handled by tabs outside */}

      <Flex justifyContent="flex-end" mt={0}>
        <Filter
          filterDays={context.filterDays}
          setFilterDays={context.setFilterDays}
        />
      </Flex>

      <Grid
        templateColumns={{ base: "1fr", lg: "minmax(0, 1fr) minmax(0, 1fr)" }}
        gap={6}
        h="full"
        minH="600px"
      >
        {/* Left Panel: Migration Logs */}
        <Flex
          direction="column"
          bgColor="white"
          borderRadius="lg"
          border="1px solid"
          borderColor="gray.200"
          overflow="hidden"
          h="full"
        >
          <Flex
            justifyContent="space-between"
            alignItems="center"
            p={4}
            borderBottom="1px solid"
            borderColor="gray.200"
          >
            <Text fontWeight="bold" fontSize="md" color="gray.700">
              Migration Logs
            </Text>
          </Flex>

          <Flex direction="column" overflowY="auto" flex={1}>
            {data?.logs?.length === 0 && (
              <Flex
                direction="column"
                alignItems="center"
                justifyContent="center"
                gap={2}
                padding={8}
                h="100%"
              >
                <Text color="gray.500">No logs available</Text>
              </Flex>
            )}
            {data?.logs?.map((log, index) => (
              <Item
                key={index}
                log={log}
                onClick={() => {
                  // Allow selection of any log (migration details will only show if clickable)
                  const logId = log.migration_id ?? log.session_id;
                  if (logId) {
                    setUserSelectedLog(logId);
                  }
                }}
                pointerEvent="pointer"
                selectedLog={effectiveSelectedLog}
              />
            ))}
          </Flex>
        </Flex>

        {/* Right Panel: Migration Progress */}
        <Flex
          direction="column"
          bgColor="white"
          borderRadius="lg"
          border="1px solid"
          borderColor="gray.200"
          overflow="hidden"
          h="full"
        >
          <Flex
            justifyContent="space-between"
            alignItems="center"
            p={4}
            borderBottom="1px solid"
            borderColor="gray.200"
            bg="gray.50"
          >
            <Text fontWeight="bold" fontSize="md" color="gray.700">
              Migration Details
            </Text>
          </Flex>

          <Flex direction="column" flex={1} overflowY="auto" p={0}>
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
                    <Text color="gray.500">Select a log to view details</Text>
                  </Flex>
                )}
                {(() => {
                  const currentLogs = (logDetails?.tables ||
                    []) as ConnectorActivityDetailResponse["tables"];
                  return (
                    <>
                      {effectiveSelectedLog && currentLogs.length === 0 && (
                        <Flex
                          direction="column"
                          alignItems="center"
                          justifyContent="center"
                          gap={2}
                          padding={8}
                          h="100%"
                        >
                          <Text color="gray.500">No details available</Text>
                        </Flex>
                      )}
                      {currentLogs.length > 0 && (
                        <MigrationProgressTable logs={currentLogs} />
                      )}
                    </>
                  );
                })()}
              </>
            )}
          </Flex>
        </Flex>
      </Grid>
    </Flex>
  );
};

export default Overview;
