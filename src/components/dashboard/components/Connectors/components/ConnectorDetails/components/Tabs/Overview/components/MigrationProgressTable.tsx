import { Box, Flex, Image, Table, Text } from "@chakra-ui/react";

import { LuCopy } from "react-icons/lu";
import { MdWarning } from "react-icons/md";

import { format } from "date-fns";

import CheckIcon from "@/assets/icons/check-icon.svg";
import ErrorIcon from "@/assets/icons/error-icon.svg";
import SandtimeIcon from "@/assets/icons/sand-time-icon.svg";
import { toaster } from "@/components/ui/toaster";
import { Tooltip } from "@/components/ui/tooltip";
import { dateTimeFormat } from "@/constants/common";
import { getUiState } from "@/helpers/log";
import { type ConnectorActivityDetailResponse } from "@/types/connectors";

const MigrationProgressTable = ({
  tables,
}: {
  tables: ConnectorActivityDetailResponse["tables"];
}) => {
  if (!tables || tables.length === 0) {
    return (
      <Flex
        direction="column"
        alignItems="center"
        justifyContent="center"
        padding={8}
        h="full"
      >
        <Text color="gray.500">No migration details recorded yet.</Text>
      </Flex>
    );
  }

  const anyInProgress = tables.some((table) => {
    const statusRaw = (table.status_icon || table.status || "").toLowerCase();
    const uiState = getUiState(
      table.status_icon,
      table.status,
      table.message || table.error_message || "",
    );
    const normalizedState = (uiState || statusRaw).toLowerCase();
    return (
      normalizedState === "in_progress" ||
      normalizedState === "pending" ||
      normalizedState === "i" ||
      normalizedState === "running" ||
      ![
        "success",
        "completed",
        "s",
        "failed",
        "error",
        "f",
        "e",
        "warning",
        "p",
        "w",
        "skipped",
      ].includes(normalizedState)
    );
  });
  const recordsColumnHeader = anyInProgress
    ? "Records Staging"
    : "Records Migrated";

  return (
    <Box w="100%" overflowX="auto">
      <Table.Root>
        <Table.Header bg="gray.50">
          <Table.Row>
            <Table.ColumnHeader
              width="50px"
              textAlign="center"
              fontWeight="bold"
              color="gray.600"
              borderRightWidth={1}
              borderColor="gray.200"
              py={1}
            >
              Status
            </Table.ColumnHeader>
            <Table.ColumnHeader
              fontWeight="bold"
              color="gray.600"
              borderRightWidth={1}
              borderColor="gray.200"
              py={1}
            >
              Table Name
            </Table.ColumnHeader>
            <Table.ColumnHeader
              fontWeight="bold"
              color="gray.600"
              borderRightWidth={1}
              borderColor="gray.200"
              py={1}
              whiteSpace="nowrap"
              minW="200px"
            >
              Start Time
            </Table.ColumnHeader>
            <Table.ColumnHeader
              fontWeight="bold"
              color="gray.600"
              borderRightWidth={1}
              borderColor="gray.200"
              py={1}
              whiteSpace="nowrap"
              minW="200px"
            >
              End Time
            </Table.ColumnHeader>
            <Table.ColumnHeader
              fontWeight="bold"
              color="gray.600"
              textAlign="left"
              whiteSpace="nowrap"
              minW="140px"
              py={1}
            >
              {recordsColumnHeader}
            </Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {tables?.map((table, index: number) => {
            const statusRaw = (
              table.status_icon ||
              table.status ||
              ""
            ).toLowerCase();
            const uiState = getUiState(
              table.status_icon,
              table.status,
              table.message || table.error_message || "",
            );
            const normalizedState = (uiState || statusRaw).toLowerCase();
            const isSuccess = ["success", "completed", "s"].includes(
              normalizedState,
            );
            const isFailed = ["failed", "error", "f", "e"].includes(
              normalizedState,
            );
            const isWarning = ["warning", "p", "w"].includes(normalizedState);
            const isSkipped = ["skipped"].includes(normalizedState);
            const isPending =
              normalizedState === "in_progress" ||
              normalizedState === "pending" ||
              normalizedState === "i" ||
              normalizedState === "running" ||
              (!isSuccess && !isFailed && !isWarning && !isSkipped);

            // Format times if available
            const startTime = table.start_time
              ? format(new Date(table.start_time), dateTimeFormat)
              : "--";
            const endTime = table.end_time
              ? format(new Date(table.end_time), dateTimeFormat)
              : "--";

            // In progress: staging records. Completed/failed-after-transfer: migrated
            // records (data_transfer / record_count).
            const isTerminal =
              isSuccess ||
              isFailed ||
              ["completed", "success", "failed", "s", "f", "e"].includes(
                normalizedState,
              );
            const stagingRecordsDisplay = (() => {
              if (isTerminal) {
                if (
                  table.record_count !== undefined &&
                  table.record_count !== null
                ) {
                  return table.record_count;
                }
              }
              if (
                table.staging_records_count !== undefined &&
                table.staging_records_count !== null
              ) {
                return table.staging_records_count;
              }
              if (
                table.record_count !== undefined &&
                table.record_count !== null
              ) {
                return table.record_count;
              }
              return "--";
            })();

            return (
              <Table.Row key={index} bg="white" _hover={{ bg: "gray.50" }}>
                <Table.Cell
                  textAlign="center"
                  py={0.5}
                  borderRightWidth={1}
                  borderColor="gray.200"
                >
                  <Flex alignItems="center" justifyContent="center">
                    <Tooltip
                      content={
                        <Flex alignItems="flex-start" gap={2}>
                          <Box
                            bg="red.500"
                            borderRadius="full"
                            p={1}
                            mt={0.5}
                            minW="16px"
                            h="16px"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                          >
                            <Text
                              fontSize="xs"
                              fontWeight="bold"
                              lineHeight={1}
                            >
                              !
                            </Text>
                          </Box>
                          <Text
                            fontSize="xs"
                            fontWeight="medium"
                            flex={1}
                            wordBreak="break-word"
                          >
                            {isSkipped
                              ? table.error_message ||
                                "Skipped — table refresh/reload is in progress"
                              : `Error: ${table.error_message || "Unknown error"}`}
                          </Text>
                          <Box
                            as="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (table.error_message) {
                                navigator.clipboard.writeText(
                                  table.error_message,
                                );
                                toaster.success({
                                  title: "Copied to clipboard",
                                  description: "Error message copied",
                                });
                              }
                            }}
                            _hover={{
                              color: "gray.300",
                              bg: "whiteAlpha.200",
                            }}
                            cursor="pointer"
                            p={1}
                            borderRadius="md"
                            transition="all 0.2s"
                            title="Copy error message"
                            color="white"
                          >
                            <LuCopy size={16} />
                          </Box>
                        </Flex>
                      }
                      interactive={true}
                      closeOnPointerDown={false}
                      disabled={!table.error_message && !isSkipped}
                      showArrow
                      contentProps={{
                        bg: "gray.800",
                        color: "white",
                        p: 3,
                        borderRadius: "md",
                        maxW: "500px",
                      }}
                    >
                      <Box cursor={table.error_message ? "pointer" : "default"}>
                        {isSuccess && (
                          <Image
                            src={CheckIcon}
                            boxSize="20px"
                            objectFit="contain"
                          />
                        )}
                        {isFailed && (
                          <Image
                            src={ErrorIcon}
                            boxSize="20px"
                            objectFit="contain"
                          />
                        )}
                        {isWarning && (
                          <Box color="orange.500">
                            <MdWarning size={20} />
                          </Box>
                        )}
                        {isSkipped && (
                          <Box
                            color="gray.500"
                            title={table.error_message || "Skipped"}
                          >
                            <MdWarning size={20} />
                          </Box>
                        )}
                        {isPending && (
                          <Image
                            src={SandtimeIcon}
                            boxSize="20px"
                            objectFit="contain"
                          />
                        )}
                      </Box>
                    </Tooltip>
                  </Flex>
                </Table.Cell>
                <Table.Cell
                  fontWeight="medium"
                  color="gray.800"
                  py={0.5}
                  borderRightWidth={1}
                  borderColor="gray.200"
                >
                  {table.table_name}
                </Table.Cell>
                <Table.Cell
                  color="gray.700"
                  py={0.5}
                  borderRightWidth={1}
                  borderColor="gray.200"
                >
                  <Text whiteSpace="nowrap" fontSize="xs">
                    {startTime}
                  </Text>
                </Table.Cell>
                <Table.Cell
                  color="gray.700"
                  py={0.5}
                  borderRightWidth={1}
                  borderColor="gray.200"
                >
                  <Text whiteSpace="nowrap" fontSize="xs">
                    {endTime}
                  </Text>
                </Table.Cell>
                <Table.Cell textAlign="right" color="gray.700" py={0.5}>
                  {stagingRecordsDisplay}
                </Table.Cell>
              </Table.Row>
            );
          })}
        </Table.Body>
      </Table.Root>
    </Box>
  );
};

export default MigrationProgressTable;
