import { Box, Flex, Image, Table, Text } from "@chakra-ui/react";

import { LuCopy } from "react-icons/lu";

import { format } from "date-fns";

import CheckIcon from "@/assets/icons/check-icon.svg";
import ErrorIcon from "@/assets/icons/error-icon.svg";
import SandtimeIcon from "@/assets/icons/sand-time-icon.svg";
import { toaster } from "@/components/ui/toaster";
import { Tooltip } from "@/components/ui/tooltip";
import { dateTimeFormat } from "@/constants/common";
import useMigrationStatusWS from "@/hooks/useMigrationStatusWS";
import { type ConnectorActivityDetailResponse } from "@/types/connectors";

const MigrationProgressTable = ({
  tables,
  migrationId,
}: {
  tables: ConnectorActivityDetailResponse["tables"];
  migrationId: number | null;
}) => {
  // Real-time Migration Status Updates
  useMigrationStatusWS(migrationId);

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

  return (
    <Box w="100%">
      <Table.Root>
        <Table.Header bg="gray.50">
          <Table.Row>
            <Table.ColumnHeader
              width="10%"
              textAlign="center"
              fontWeight="bold"
              color="gray.600"
              borderRightWidth={1}
              borderColor="gray.200"
              py={2}
            >
              Status
            </Table.ColumnHeader>
            <Table.ColumnHeader
              fontWeight="bold"
              color="gray.600"
              width="25%"
              borderRightWidth={1}
              borderColor="gray.200"
              py={2}
            >
              Table Name
            </Table.ColumnHeader>
            <Table.ColumnHeader
              fontWeight="bold"
              color="gray.600"
              width="25%"
              borderRightWidth={1}
              borderColor="gray.200"
              py={2}
            >
              Start Time
            </Table.ColumnHeader>
            <Table.ColumnHeader
              fontWeight="bold"
              color="gray.600"
              width="25%"
              borderRightWidth={1}
              borderColor="gray.200"
              py={2}
            >
              End Time
            </Table.ColumnHeader>
            <Table.ColumnHeader
              fontWeight="bold"
              color="gray.600"
              textAlign="left"
              width="15%"
              py={2}
            >
              Records
            </Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {tables?.map((table, index: number) => {
            const statusLower = table.status.toLowerCase();
            const isSuccess =
              statusLower === "success" || statusLower === "completed";
            const isFailed =
              statusLower === "failed" || statusLower === "error";
            const isPending = !isSuccess && !isFailed;

            // Format times if available
            const startTime = table.start_time
              ? format(new Date(table.start_time), dateTimeFormat)
              : "--";
            const endTime = table.end_time
              ? format(new Date(table.end_time), dateTimeFormat)
              : "--";

            // Display staging records count
            const stagingRecordsDisplay =
              table.staging_records_count !== undefined &&
              table.staging_records_count !== null
                ? table.staging_records_count
                : "--";

            return (
              <Table.Row key={index} bg="white" _hover={{ bg: "gray.50" }}>
                <Table.Cell
                  textAlign="center"
                  py={2}
                  borderRightWidth={1}
                  borderColor="gray.200"
                >
                  <Flex alignItems="center" justifyContent="center">
                    <Tooltip
                      content={
                        <Flex alignItems="center" gap={2}>
                          <Box
                            bg="red.500"
                            borderRadius="full"
                            p={1}
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
                          <Text fontSize="xs" fontWeight="medium" flex={1}>
                            Error: {table.error_message}
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
                      disabled={!table.error_message}
                      showArrow
                      contentProps={{
                        bg: "gray.800",
                        color: "white",
                        p: 3,
                        borderRadius: "md",
                        maxW: "300px",
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
                  py={2}
                  borderRightWidth={1}
                  borderColor="gray.200"
                >
                  {table.table_name}
                </Table.Cell>
                <Table.Cell
                  color="gray.700"
                  py={2}
                  borderRightWidth={1}
                  borderColor="gray.200"
                >
                  {startTime}
                </Table.Cell>
                <Table.Cell
                  color="gray.700"
                  py={2}
                  borderRightWidth={1}
                  borderColor="gray.200"
                >
                  {endTime}
                </Table.Cell>
                <Table.Cell textAlign="left" color="gray.700" py={2}>
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
