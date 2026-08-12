import { useMemo, useState } from "react";

import { Box, Flex, Grid, NativeSelect, Text } from "@chakra-ui/react";

import { useOutletContext } from "react-router";

import LoadingSpinner from "@/components/shared/Spinner";
import useMigrationStatusWS from "@/hooks/useMigrationStatusWS";
import useFetchConnectorActivity from "@/queryOptions/connector/useFetchConnectorActivity";
import useFetchConnectorActivityDetails from "@/queryOptions/connector/useFetchConnectorActivityDetails";
import { type Connector, type ConnectorActivityLog } from "@/types/connectors";

import Filter from "./Filter";
import Item from "./Item";
import MigrationProgressTable from "./components/MigrationProgressTable";
import TableSelectionDetails from "./components/TableSelectionDetails";

const getActivityLogId = (log: ConnectorActivityLog): number | null => {
  const id = log.log_id ?? log.migration_id ?? log.session_id;
  if (id === null || id === undefined) return null;

  const numericId = Number(id);
  return Number.isFinite(numericId) && numericId > 0 ? numericId : null;
};

const Overview = () => {
  const context = useOutletContext<
    Connector & { filterDays: number; setFilterDays: (_days: number) => void }
  >();

  const [statusFilter, setStatusFilter] = useState("all");

  const { data, isLoading } = useFetchConnectorActivity(
    context.connection_id,
    context.filterDays,
    statusFilter,
  );

  const selectionScope = `${context.connection_id}:${context.filterDays}:${statusFilter}`;
  const [userSelection, setUserSelection] = useState<{
    scope: string;
    logId: number;
  } | null>(null);
  const userSelectedLog =
    userSelection?.scope === selectionScope ? userSelection.logId : null;

  // Derive the default selected log from data (first clickable log in the list)
  const defaultSelectedLog = useMemo(() => {
    const firstClickableLog = data?.logs?.find(
      (log) => log.is_clickable !== false && getActivityLogId(log) !== null,
    );
    return firstClickableLog ? getActivityLogId(firstClickableLog) : null;
  }, [data]);

  const selectedLogExists = useMemo(
    () =>
      userSelectedLog !== null &&
      data?.logs?.some((log) => getActivityLogId(log) === userSelectedLog),
    [data, userSelectedLog],
  );

  // Fall back to the first clickable row when filters remove the prior selection.
  const effectiveSelectedLog = selectedLogExists
    ? userSelectedLog
    : defaultSelectedLog;

  // Find the active log object to check properties
  const activeLog = useMemo(
    () =>
      data?.logs?.find((log) => getActivityLogId(log) === effectiveSelectedLog),
    [data, effectiveSelectedLog],
  );

  // Fetch unless the API explicitly marks the row as non-clickable.
  const migrationIdToFetch =
    activeLog?.is_clickable !== false && activeLog?.migration_id
      ? activeLog.migration_id
      : undefined;

  const logIdToFetch =
    activeLog?.is_clickable !== false &&
    !activeLog?.migration_id &&
    activeLog?.log_id
      ? activeLog.log_id
      : undefined;

  // Keep WS connected for the selected migration so terminal updates are not missed.
  const migrationIdForWS = migrationIdToFetch ?? null;

  useMigrationStatusWS(migrationIdForWS, context.connection_id);

  const { data: logDetails, isLoading: isLoadingDetails } =
    useFetchConnectorActivityDetails({
      migrationId: migrationIdToFetch,
      connectionId:
        migrationIdToFetch || logIdToFetch ? context.connection_id : undefined,
      logId: logIdToFetch,
    });

  if (isLoading) return <LoadingSpinner />;

  return (
    <Flex flexDirection="column" gap={2} w="100%" h="full">
      {/* Top Level Filter */}
      <Flex justifyContent="flex-end">
        <Filter
          filterDays={context.filterDays}
          setFilterDays={context.setFilterDays}
        />
      </Flex>

      <Grid
        templateColumns={{ base: "1fr", lg: "0.9fr 1.1fr" }}
        gap={6}
        flex={1}
        minH="0"
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
            p={2.5}
            borderBottom="1px solid"
            borderColor="gray.200"
          >
            <Text fontWeight="bold" fontSize="md" color="gray.700">
              Logs
            </Text>
            <NativeSelect.Root size="sm" width="130px">
              <NativeSelect.Field
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.currentTarget.value)}
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
              </NativeSelect.Field>
              <NativeSelect.Indicator />
            </NativeSelect.Root>
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
                <Text color="gray.500">
                  {statusFilter !== "all"
                    ? `No matching logs found`
                    : "No logs available"}
                </Text>
              </Flex>
            )}
            {data?.logs?.map((log, index) => (
              <Item
                key={`${log.log_id || log.migration_id || log.session_id || "log"}-${index}`}
                log={log}
                onClick={() => {
                  if (log.is_clickable === false) return;
                  const logId = getActivityLogId(log);
                  if (logId !== null) {
                    setUserSelection({ scope: selectionScope, logId });
                  }
                }}
                pointerEvent={
                  log.is_clickable === false ? "not-allowed" : "pointer"
                }
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
                {effectiveSelectedLog && activeLog && (
                  <Box p={0} h="full">
                    {logDetails?.changes ? (
                      <TableSelectionDetails
                        changes={logDetails.changes || []}
                      />
                    ) : (
                      <MigrationProgressTable
                        tables={logDetails?.tables || []}
                      />
                    )}
                  </Box>
                )}
              </>
            )}
          </Flex>
        </Flex>
      </Grid>
    </Flex>
  );
};

export default Overview;
