import { Box, Button, Flex, Image, Spinner, Text } from "@chakra-ui/react";

import { CiPause1 } from "react-icons/ci";
import { IoMdCheckmark } from "react-icons/io";
import { LuDot } from "react-icons/lu";

import { format } from "date-fns";

import Arrow from "@/assets/images/arrow-cool-down.svg";
import {
  getDestinationImage,
  getSourceImage,
} from "@/components/dashboard/utils/getImage";
import { dateTimeFormat } from "@/constants/common";
import useFetchSelectedTables from "@/queryOptions/connector/schema/useFetchSelectedTables";
import useToggleConnectionStatus from "@/queryOptions/connector/useToggleConnectionStatus";
import { type Connector } from "@/types/connectors";

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

  // Check if any table has "in_progress" status
  const { data: selectedTablesData } = useFetchSelectedTables(connection_id);
  const hasInProgressStatus =
    selectedTablesData?.tables?.some(
      (table) => table.status === "in_progress",
    ) ?? false;

  // Check if any operation is in progress
  const isAnyOperationInProgress =
    isRefreshSchemaInProgress > 0 ||
    isUpdateSchemaInProgress > 0 ||
    isReloadInProgress > 0 ||
    isRefreshDeltaTableInProgress > 0 ||
    hasInProgressStatus;

  // Determine the message to show based on the active operation
  const getStatusMessage = () => {
    if (isUpdateSchemaInProgress > 0) {
      return "Updating schema...";
    }
    if (isRefreshSchemaInProgress > 0) {
      return "Refreshing schema...";
    }
    if (isAnyOperationInProgress) {
      return "Sync in progress";
    }
    if (next_sync_time) {
      try {
        const formattedDate = format(new Date(next_sync_time), dateTimeFormat);
        return `Next Sync in: ${formattedDate}`;
      } catch {
        // If date parsing fails, fallback to time_frequency
        return `Next Sync in: ${formatTimeFrequency(time_frequency)}`;
      }
    }
    return "Next Sync in: None";
  };
  // Time Freq format. If the time frequency is a number and
  // greater than 60 mins, convert to hours and minutes. Else show in minutes.
  const formatTimeFrequency = (freq: string) => {
    const freqNum = Number(freq);
    if (isNaN(freqNum) || freqNum <= 0) {
      return "None";
    }
    if (freqNum >= 60) {
      const hours = Math.floor(freqNum / 60);
      const minutes = freqNum % 60;
      return minutes === 0 ? `${hours} hr` : `${hours} hr ${minutes} min`;
    }
    return `${freqNum} minutes`;
  };

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
              {/* Next Sync text - shows different messages based on operation */}
              <Flex gap={2} alignItems="center" ml={2}>
                {isAnyOperationInProgress ? (
                  <>
                    <Spinner size="sm" color="brand.500" />
                    <Text fontSize="sm" color="gray.600">
                      {getStatusMessage()}
                    </Text>
                  </>
                ) : (
                  <Text fontSize="sm" color="gray.600">
                    {getStatusMessage()}
                  </Text>
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
