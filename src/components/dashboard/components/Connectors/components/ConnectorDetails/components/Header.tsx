import { useEffect } from "react";

import { Box, Button, Flex, Image, Text } from "@chakra-ui/react";

import { CiPause1 } from "react-icons/ci";
import { IoMdCheckmark } from "react-icons/io";

import Arrow from "@/assets/images/arrow-cool-down.svg";
import {
  getDestinationImage,
  getSourceImage,
} from "@/components/dashboard/utils/getImage";
import LoadingSpinner from "@/components/shared/Spinner";
import { Tooltip } from "@/components/ui/tooltip";
import { dateTimeFormat } from "@/constants/common";
import useFetchTableStatus from "@/queryOptions/connector/schema/useFetchTableStatus";
import useUpdateSchemaStatus from "@/queryOptions/connector/schema/useUpdateSchemaStatus";
import useToggleConnectionStatus from "@/queryOptions/connector/useToggleConnectionStatus";
import { type Connector } from "@/types/connectors";

import { getStatusMessage } from "../helpers";
import { useIsMutating } from "@tanstack/react-query";

const Header = ({ connector }: { connector: Connector }) => {
  // Safely destructure with fallback to prevent undefined errors
  const {
    source_title = "",
    destination_title = "",
    source_name = "",
    destination_name = "",
    status = "P",
    connection_id = 0,
    time_frequency = "None",
    next_sync_time = "",
  } = connector || {};

  const { mutate: toggleConnectionStatus, isPending } =
    useToggleConnectionStatus({
      connectorId: connection_id,
    });

  // Check if refresh/update schema mutations are in progress for this connector
  const isRefreshSchemaInProgress = useIsMutating({
    mutationKey: ["refreshSchema", connection_id],
  });
  const isUpdateSchemaInProgress = useIsMutating({
    mutationKey: ["updateSchema", connection_id],
  });

  // Check if reload mutations are in progress
  const isReloadInProgress = useIsMutating({
    mutationKey: ["reloadSingleTable", connection_id],
  });
  const isRefreshDeltaTableInProgress = useIsMutating({
    mutationKey: ["refreshDeltaTable", connection_id],
  });

  const { data: tableStatusData } = useFetchTableStatus(connection_id, true);

  // Check if any table has "in_progress" status from get_table_status API
  const hasTableInProgress =
    tableStatusData?.tables?.some((table) => table.status === "in_progress") ??
    false;

  const { status: schemaStatus } = useUpdateSchemaStatus(connection_id, true);

  useEffect(() => {
    if (schemaStatus?.is_in_progress) {
      // Logic for background operation tracking if needed
    }
  }, [schemaStatus]);

  // Check if any operation is in progress
  // For reload button: use get_table_status API (hasTableInProgress)
  // For other operations: use existing checks
  const isAnyOperationInProgress =
    isRefreshSchemaInProgress > 0 ||
    isUpdateSchemaInProgress > 0 ||
    isReloadInProgress > 0 ||
    isRefreshDeltaTableInProgress > 0 ||
    hasTableInProgress || // Use get_table_status for reload spinner
    schemaStatus?.is_in_progress === true;

  // Determine the message to show based on the active operation
  // Use next_sync_time from tableStatusData (updated via WebSocket) if available,
  // otherwise fallback to initial connector data
  const statusMessage = getStatusMessage({
    isUpdateSchemaInProgress,
    isRefreshSchemaInProgress,
    isAnyOperationInProgress,
    next_sync_time:
      tableStatusData?.next_sync_time !== undefined
        ? tableStatusData.next_sync_time
        : next_sync_time,
    time_frequency:
      tableStatusData?.readable_time_frequency !== undefined
        ? (tableStatusData.readable_time_frequency ?? time_frequency)
        : time_frequency,
    dateTimeFmt: dateTimeFormat,
    schemaStatus,
  });

  return (
    <Flex flexDirection="column" gap={4}>
      <Flex
        gap={6}
        alignItems="center"
        flexDirection={{ base: "column", md: "row" }}
        flexWrap="wrap"
      >
        {/* Source Section */}
        <Flex gap={2} alignItems={"center"}>
          <Box>
            <Image
              src={getSourceImage(source_name)}
              alt={source_name}
              h="50px"
              objectFit="contain"
            />
          </Box>
          <Box>
            <Flex gap={2} alignItems="center">
              <Text>{source_title}</Text>
            </Flex>
            <Text fontSize="sm">Source</Text>
          </Box>
        </Flex>

        <Flex>
          <Image src={Arrow} alt="arrow" />
        </Flex>

        {/* Destination Section */}
        <Flex gap={2} alignItems={"center"}>
          <Box>
            <Image
              src={getDestinationImage(destination_name)}
              alt={destination_name}
              h="50px"
              objectFit="contain"
            />
          </Box>
          <Box>
            <Flex gap={2} alignItems="center">
              <Text>{destination_title}</Text>
              <Flex gap={2} alignItems="center" ml={6}>
                {isAnyOperationInProgress ? (
                  <Tooltip content={statusMessage}>
                    <Box>
                      <LoadingSpinner size="sm" />
                    </Box>
                  </Tooltip>
                ) : (
                  statusMessage && (
                    <Text fontSize="sm" color="gray.600">
                      {statusMessage}
                    </Text>
                  )
                )}
              </Flex>
            </Flex>
            <Flex flexWrap={"wrap"} gap={1} alignItems="center">
              <Text fontSize="sm">Destination</Text>
            </Flex>
          </Box>
        </Flex>

        {/* Status Buttons */}
        <Flex ml="auto" gap={2}>
          {(status === "P" || status === "E") && (
            <Button
              colorPalette="yellow"
              size="xs"
              variant="solid"
              loading={isPending}
              onClick={() => toggleConnectionStatus()}
            >
              <CiPause1 />
              Paused
            </Button>
          )}
          {status === "A" && (
            <Button
              colorPalette="green"
              size="xs"
              variant="solid"
              loading={isPending}
              onClick={() => toggleConnectionStatus()}
            >
              <IoMdCheckmark />
              Active
            </Button>
          )}
        </Flex>
      </Flex>
    </Flex>
  );
};

export default Header;
