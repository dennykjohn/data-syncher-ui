import { Box, Flex, Image, Table } from "@chakra-ui/react";

import { format } from "date-fns";

import CheckIcon from "@/assets/icons/check-icon.svg";
import ErrorIcon from "@/assets/icons/error-icon.svg";
import SandtimeIcon from "@/assets/icons/sand-time-icon.svg";
import { type ConnectorActivityDetailResponse } from "@/types/connectors";

const MigrationProgressTable = ({
  logs,
}: {
  logs: ConnectorActivityDetailResponse["tables"];
}) => {
  return (
    <Box w="100%">
      <Table.Root borderBottomWidth={1} borderColor="gray.200">
        <Table.Header bg="gray.100">
          <Table.Row>
            <Table.ColumnHeader
              width="10%"
              textAlign="center"
              fontWeight="bold"
              color="gray.600"
              borderColor="gray.300"
              borderRightWidth={1}
              borderLeftWidth={1}
              py={2}
            >
              Status
            </Table.ColumnHeader>
            <Table.ColumnHeader
              fontWeight="bold"
              color="gray.600"
              borderColor="gray.300"
              borderRightWidth={1}
              width="25%"
              py={2}
            >
              Table Name
            </Table.ColumnHeader>
            <Table.ColumnHeader
              fontWeight="bold"
              color="gray.600"
              borderColor="gray.300"
              borderRightWidth={1}
              width="25%"
              py={2}
            >
              Start Time
            </Table.ColumnHeader>
            <Table.ColumnHeader
              fontWeight="bold"
              color="gray.600"
              borderColor="gray.300"
              borderRightWidth={1}
              width="25%"
              py={2}
            >
              End Time
            </Table.ColumnHeader>
            <Table.ColumnHeader
              fontWeight="bold"
              color="gray.600"
              textAlign="left"
              borderColor="gray.300"
              borderRightWidth={1}
              width="15%"
              py={2}
            >
              New Records
            </Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {logs?.map((log, index) => {
            const statusLower = log.status.toLowerCase();
            const isSuccess =
              statusLower === "success" || statusLower === "completed";
            const isFailed =
              statusLower === "failed" || statusLower === "error";
            const isPending = !isSuccess && !isFailed;

            // Format times if available
            const startTime = log.start_time
              ? format(new Date(log.start_time), "h:mm:ss a")
              : "--";
            const endTime = log.end_time
              ? format(new Date(log.end_time), "h:mm:ss a")
              : "--";

            // Display new records count
            const newRecordsDisplay =
              log.new_rec !== undefined && log.new_rec !== null
                ? log.new_rec
                : "--";

            return (
              <Table.Row key={index} bg="white" _hover={{ bg: "gray.50" }}>
                <Table.Cell
                  borderColor="gray.200"
                  borderRightWidth={1}
                  borderLeftWidth={1}
                  borderBottomWidth={1}
                  textAlign="center"
                  py={2}
                >
                  <Flex alignItems="center" justifyContent="center">
                    {/* Status Icons */}
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
                  </Flex>
                </Table.Cell>
                <Table.Cell
                  borderColor="gray.200"
                  borderRightWidth={1}
                  borderBottomWidth={1}
                  fontWeight="medium"
                  color="gray.800"
                  py={2}
                >
                  {log.table_name}
                </Table.Cell>
                <Table.Cell
                  borderColor="gray.200"
                  borderRightWidth={1}
                  borderBottomWidth={1}
                  color="gray.700"
                  py={2}
                >
                  {startTime}
                </Table.Cell>
                <Table.Cell
                  borderColor="gray.200"
                  borderRightWidth={1}
                  borderBottomWidth={1}
                  color="gray.700"
                  py={2}
                >
                  {endTime}
                </Table.Cell>
                <Table.Cell
                  textAlign="left"
                  color="gray.700"
                  borderColor="gray.200"
                  borderRightWidth={1}
                  borderBottomWidth={1}
                  py={2}
                >
                  {newRecordsDisplay}
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
