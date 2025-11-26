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
import AxiosInstance from "@/lib/axios/api-client";
import useFetchSelectedTables from "@/queryOptions/connector/schema/useFetchSelectedTables";
import useToggleConnectionStatus from "@/queryOptions/connector/useToggleConnectionStatus";
import { type Connector } from "@/types/connectors";

import { formatTimeFrequency, getStatusMessage } from "../helpers";
import { useIsMutating, useQuery, useQueryClient } from "@tanstack/react-query";

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

  const queryClient = useQueryClient();

  // Check if refresh/update schema mutations are in progress for this connector
  const isRefreshSchemaInProgress = useIsMutating({
    mutationKey: ["refreshSchema", connection_id],
  });
  const isUpdateSchemaInProgress = useIsMutating({
    mutationKey: ["updateSchema", connection_id],
  });

  // Get cached status data to check if we should keep polling
  const cachedStatusData = queryClient.getQueryData([
    "updateSchemaStatus",
    connection_id,
  ]) as
    | {
        is_in_progress?: boolean;
        status?: string;
        current_job?: { status: string };
      }
    | undefined;

  // Check if cached data shows migration is still in progress
  const cachedIsInProgress = Boolean(
    cachedStatusData?.is_in_progress === true ||
      cachedStatusData?.status === "Migration started" ||
      (cachedStatusData?.current_job?.status &&
        cachedStatusData.current_job.status !== "completed" &&
        cachedStatusData.current_job.status !== "failed"),
  );

  // Check schema status from update-schema-status API
  // Enable when updateSchema mutation is in progress OR when cached data shows migration is active
  const { data: schemaStatusData } = useQuery<{
    is_in_progress?: boolean;
    status?: string;
    current_job?: {
      job_name?: string;
      task_id?: string;
      status?: string;
      migration_session_id?: number;
      connection_name?: string | null;
      created_at?: string;
      updated_at?: string;
    } | null;
    celery_task_status?: {
      state?: string;
      ready?: boolean;
      successful?: boolean | null;
      failed?: boolean | null;
    };
  }>({
    queryKey: ["updateSchemaStatus", connection_id],
    queryFn: async () => {
      const { data } = await AxiosInstance.get(
        `connection/${connection_id}/update-schema-status/`,
      );
      return data;
    },
    enabled: isUpdateSchemaInProgress > 0 || cachedIsInProgress, // Enable when mutation starts or when cached data shows in progress
    refetchInterval: (query) => {
      const data = query.state.data;
      // Check both is_in_progress and status field
      const isInProgress =
        data?.is_in_progress === true ||
        data?.status === "Migration started" ||
        (data?.current_job?.status &&
          data.current_job.status !== "completed" &&
          data.current_job.status !== "failed");
      // Continue polling if in progress, even after mutation completes
      // This ensures we keep checking until migration is done
      return isInProgress ? 2000 : false;
    },
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

  // Check if schema status is in progress - check both is_in_progress and status field
  const isSchemaStatusInProgress =
    schemaStatusData?.is_in_progress === true ||
    schemaStatusData?.status === "Migration started" ||
    (schemaStatusData?.current_job?.status &&
      schemaStatusData.current_job.status !== "completed" &&
      schemaStatusData.current_job.status !== "failed");

  // Check if any operation is in progress
  const isAnyOperationInProgress = Boolean(
    isRefreshSchemaInProgress > 0 ||
      isUpdateSchemaInProgress > 0 ||
      isReloadInProgress > 0 ||
      isRefreshDeltaTableInProgress > 0 ||
      hasInProgressStatus ||
      isSchemaStatusInProgress,
  );

  // Determine the message to show based on the active operation
  const statusMessage = getStatusMessage({
    isUpdateSchemaInProgress,
    isRefreshSchemaInProgress,
    isAnyOperationInProgress,
    next_sync_time,
    time_frequency,
    dateTimeFmt: dateTimeFormat,
    schemaStatusData: schemaStatusData as
      | {
          is_in_progress?: boolean;
          status?: string;
          current_job?: {
            job_name: string;
            task_id: string;
            status: string;
            migration_session_id: number;
            connection_name: string | null;
            created_at: string;
            updated_at: string;
          } | null;
          celery_task_status?: {
            state: string;
            ready: boolean;
            successful: boolean | null;
            failed: boolean | null;
          };
        }
      | null
      | undefined,
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
