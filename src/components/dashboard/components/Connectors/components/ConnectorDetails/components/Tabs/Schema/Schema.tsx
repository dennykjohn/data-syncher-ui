import {
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { Box, Flex, Image, Skeleton, Text } from "@chakra-ui/react";

import { MdExpandLess, MdExpandMore } from "react-icons/md";
import { SlRefresh } from "react-icons/sl";

import { useOutletContext } from "react-router";

import CheckIcon from "@/assets/icons/check-icon.svg";
import ErrorIcon from "@/assets/icons/error-icon.svg";
import SandtimeIcon from "@/assets/icons/sand-time-icon.svg";
import LoadingSpinner from "@/components/shared/Spinner";
import { toaster } from "@/components/ui/toaster";
import { Tooltip } from "@/components/ui/tooltip";
import useFetchSelectedTables from "@/queryOptions/connector/schema/useFetchSelectedTables";
import useFetchConnectorTableById from "@/queryOptions/connector/schema/useFetchTable";
import useFetchTableFields from "@/queryOptions/connector/schema/useFetchTableFields";
import useReloadSingleTable from "@/queryOptions/connector/schema/useReloadSingleTable";
import { type Connector, type ConnectorTable } from "@/types/connectors";

import Actions from "./Actions";

interface TableRowProps {
  item: ConnectorTable;
  connectionId: number;
  isTableInProgress: (_tableName: string) => boolean;
  hasAnyTableInProgress: boolean;
  shouldShowDisabledState: boolean;
  setShouldShowDisabledState: (_value: boolean) => void;
}

const TableRow = ({
  item,
  connectionId,
  isTableInProgress,
  hasAnyTableInProgress,
  shouldShowDisabledState,
  setShouldShowDisabledState,
}: TableRowProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { table, primary_keys = [] } = item;

  const { data: tableFieldsData, isLoading: isLoadingFields } =
    useFetchTableFields(connectionId, table, isExpanded);

  const { mutate: reloadTable, isPending: isReloading } = useReloadSingleTable({
    connectionId,
  });

  const isInProgress = isTableInProgress(table);

  const handleReload = () => {
    if ((shouldShowDisabledState || hasAnyTableInProgress) && !isReloading) {
      toaster.warning({
        title: "Operation in progress",
        description:
          "Another migration is in progress. Please wait until it is complete.",
      });
      return;
    }

    setShouldShowDisabledState(true);
    reloadTable(
      {
        connection_id: connectionId,
        table_name: table,
      },
      {
        onSettled: () => {
          setShouldShowDisabledState(false);
        },
      },
    );
  };

  return (
    <Box
      borderWidth={1}
      borderColor="gray.300"
      borderRadius="md"
      p={3}
      mb={2}
      bg="white"
    >
      <Flex
        justifyContent="space-between"
        alignItems="center"
        cursor="pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <Flex alignItems="center" gap={2} flex={1}>
          {isExpanded ? <MdExpandLess /> : <MdExpandMore />}
          <Text fontSize="sm" fontWeight="medium">
            {table}
          </Text>
        </Flex>
        <Flex gap={3} alignItems="center">
          <Flex justifyContent="center" minW="40px">
            {isInProgress && <Image src={SandtimeIcon} />}
            {!isInProgress && item.selected && <Image src={CheckIcon} />}
            {!isInProgress && !item.selected && item.is_delta && (
              <Image src={ErrorIcon} />
            )}
          </Flex>
          <Tooltip
            content={
              (shouldShowDisabledState || hasAnyTableInProgress) && !isReloading
                ? "Another migration is in progress. Please wait until it is complete."
                : ""
            }
            disabled={
              !(shouldShowDisabledState || hasAnyTableInProgress) || isReloading
            }
          >
            <Box
              onClick={(e) => {
                e.stopPropagation();
                handleReload();
              }}
              _hover={{
                color:
                  (shouldShowDisabledState || hasAnyTableInProgress) &&
                  !isReloading
                    ? "gray.400"
                    : "brand.500",
                cursor:
                  (shouldShowDisabledState || hasAnyTableInProgress) &&
                  !isReloading
                    ? "not-allowed"
                    : "pointer",
              }}
              p={1}
              borderRadius="sm"
              style={{
                animation: isReloading ? "spin 1s linear infinite" : undefined,
                cursor:
                  (shouldShowDisabledState || hasAnyTableInProgress) &&
                  !isReloading
                    ? "not-allowed"
                    : "pointer",
              }}
            >
              <SlRefresh />
            </Box>
          </Tooltip>
        </Flex>
      </Flex>

      {isExpanded && (
        <Box mt={3} pl={6} onClick={(e) => e.stopPropagation()}>
          {isLoadingFields ? (
            <Skeleton height={4} mb={2} />
          ) : (
            <>
              {(tableFieldsData?.primary_keys || primary_keys).length > 0 && (
                <Flex direction="column" gap={1} mb={2}>
                  <Text fontSize="sm" color="gray.700" fontWeight="semibold">
                    Primary keys
                  </Text>
                  <Flex gap={2} wrap="wrap">
                    {(tableFieldsData?.primary_keys || primary_keys).map(
                      (pk: string) => (
                        <Flex
                          key={pk}
                          alignItems="center"
                          gap={1}
                          px={2}
                          py={1}
                          borderRadius="md"
                          bg="yellow.50"
                          border="1px solid"
                          borderColor="yellow.200"
                        >
                          <Text fontSize="sm" color="yellow.700">
                            🔑
                          </Text>
                          <Text fontSize="sm" color="gray.800">
                            {pk}
                          </Text>
                        </Flex>
                      ),
                    )}
                  </Flex>
                </Flex>
              )}

              {tableFieldsData?.table_fields &&
                Object.entries(tableFieldsData.table_fields).map(
                  ([field, fieldInfo]) => {
                    const dataType =
                      typeof fieldInfo === "string"
                        ? fieldInfo
                        : (fieldInfo as { data_type?: string }).data_type ||
                          "unknown";

                    return (
                      <Flex key={field} alignItems="center" gap={2} mb={1}>
                        <Text fontSize="sm" fontWeight="medium">
                          {field}
                        </Text>
                        <Text fontSize="sm" color="gray.500">
                          :
                        </Text>
                        <Text fontSize="sm" color="gray.600" fontStyle="italic">
                          {dataType}
                        </Text>
                      </Flex>
                    );
                  },
                )}
            </>
          )}
        </Box>
      )}
    </Box>
  );
};

const Schema = () => {
  const context = useOutletContext<Connector>();
  const { connection_id } = context;

  const [shouldShowDisabledState, setShouldShowDisabledState] = useState(false);

  const { data: tablesData, isLoading: isLoadingTables } =
    useFetchConnectorTableById(connection_id);
  const { data: selectedTablesData } = useFetchSelectedTables(connection_id);

  const isTableInProgress = useCallback(
    (tableName: string) => {
      return (
        selectedTablesData?.tables?.some(
          (table) =>
            table.table === tableName && table.status === "in_progress",
        ) ?? false
      );
    },
    [selectedTablesData],
  );

  const hasAnyTableInProgress = useMemo(() => {
    return (
      selectedTablesData?.tables?.some(
        (table) => table.status === "in_progress",
      ) ?? false
    );
  }, [selectedTablesData]);

  useEffect(() => {
    if (!hasAnyTableInProgress) {
      startTransition(() => {
        setShouldShowDisabledState(false);
      });
    }
  }, [hasAnyTableInProgress]);

  if (isLoadingTables) {
    return <LoadingSpinner />;
  }

  const tables = tablesData || [];

  return (
    <Flex flexDirection="column" gap={4} pb={8} w="100%">
      <Actions
        shouldShowDisabledState={shouldShowDisabledState}
        setShouldShowDisabledState={setShouldShowDisabledState}
        onUpdateSchemaStart={() => setShouldShowDisabledState(true)}
      />

      <Flex direction="column" gap={2}>
        <Text fontSize="md" fontWeight="semibold" mb={2}>
          Tables
        </Text>
        {tables.length === 0 ? (
          <Text>No tables available</Text>
        ) : (
          tables.map((item) => (
            <TableRow
              key={item.table}
              item={item}
              connectionId={connection_id}
              isTableInProgress={isTableInProgress}
              hasAnyTableInProgress={hasAnyTableInProgress}
              shouldShowDisabledState={shouldShowDisabledState}
              setShouldShowDisabledState={setShouldShowDisabledState}
            />
          ))
        )}
      </Flex>
    </Flex>
  );
};

export default Schema;
