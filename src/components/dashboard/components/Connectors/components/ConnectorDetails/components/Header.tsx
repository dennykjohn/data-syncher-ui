import { startTransition, useEffect, useRef, useState } from "react";

import { Box, Button, Flex, Image, Text } from "@chakra-ui/react";

import { CiPause1 } from "react-icons/ci";
import { IoMdCheckmark } from "react-icons/io";
import { LuDot } from "react-icons/lu";

import Arrow from "@/assets/images/arrow-cool-down.svg";
import {
  getDestinationImage,
  getSourceImage,
} from "@/components/dashboard/utils/getImage";
import LoadingSpinner from "@/components/shared/Spinner";
import { Tooltip } from "@/components/ui/tooltip";
import { dateTimeFormat } from "@/constants/common";
import useFetchSelectedTables from "@/queryOptions/connector/schema/useFetchSelectedTables";
import useUpdateSchemaStatus from "@/queryOptions/connector/schema/useUpdateSchemaStatus";
import useToggleConnectionStatus from "@/queryOptions/connector/useToggleConnectionStatus";
import { type Connector } from "@/types/connectors";

import { formatTimeFrequency, getStatusMessage } from "../helpers";
import { useIsMutating } from "@tanstack/react-query";

const Header = ({ connector }: { connector: Connector }) => {
  const {
    source_title,
    destination_title,
    source_name,
    destination_name,
    status,
    connection_id,
    time_frequency,
    next_sync_time,
  } = connector;

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

  // Track when to enable schema status polling
  // Start polling when mutation starts, keep polling until backend job completes
  const [shouldPollSchemaStatus, setShouldPollSchemaStatus] = useState(false);
  const prevIsUpdateSchemaInProgress = useRef(0);

  // Start polling when update schema mutation begins
  useEffect(() => {
    const wasInProgress = prevIsUpdateSchemaInProgress.current > 0;
    const isInProgress = isUpdateSchemaInProgress > 0;

    // If mutation just started, enable polling
    if (!wasInProgress && isInProgress) {
      startTransition(() => {
        setShouldPollSchemaStatus(true);
      });
    }

    prevIsUpdateSchemaInProgress.current = isUpdateSchemaInProgress;
  }, [isUpdateSchemaInProgress]);

  // Check schema status to see if backend job is still in progress
  const { status: schemaStatus } = useUpdateSchemaStatus(
    connection_id,
    shouldPollSchemaStatus,
  );

  // Stop polling when backend job completes
  useEffect(() => {
    if (
      schemaStatus &&
      !schemaStatus.is_in_progress &&
      shouldPollSchemaStatus
    ) {
      startTransition(() => {
        setShouldPollSchemaStatus(false);
      });
    }
  }, [schemaStatus, shouldPollSchemaStatus]);

  // Check if any table has "in_progress" status
  const { data: selectedTablesData } = useFetchSelectedTables(connection_id);
  const hasInProgressStatus =
    selectedTablesData?.tables?.some(
      (table) => table.status === "in_progress",
    ) ?? false;

  // Check if any operation is in progress
  // Include schemaStatus.is_in_progress to keep spinner until all tables are fetched
  const isAnyOperationInProgress =
    isRefreshSchemaInProgress > 0 ||
    isUpdateSchemaInProgress > 0 ||
    isReloadInProgress > 0 ||
    isRefreshDeltaTableInProgress > 0 ||
    hasInProgressStatus ||
    schemaStatus?.is_in_progress === true;

  // Determine the message to show based on the active operation
  const statusMessage = getStatusMessage({
    isUpdateSchemaInProgress,
    isRefreshSchemaInProgress,
    isAnyOperationInProgress,
    next_sync_time,
    time_frequency,
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
              <Flex gap={2} alignItems="center" ml={2}>
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
              {status === "A" && time_frequency !== "None" && (
                <>
                  <LuDot size={24} />
                  <Text fontSize="sm">
                    Loads every {formatTimeFrequency(time_frequency)}
                  </Text>
                </>
              )}
            </Flex>
          </Box>
        </Flex>

        {/* Status Buttons */}
        <Flex ml="auto" gap={2}>
          {(status === "P" || status === "B") && (
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
