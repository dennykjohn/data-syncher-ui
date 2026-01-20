import { Box, Flex, Image, Text } from "@chakra-ui/react";

import { FaPauseCircle } from "react-icons/fa";

import { format } from "date-fns";

import CheckIcon from "@/assets/icons/check-icon.svg";
import ErrorIcon from "@/assets/icons/error-icon.svg";
import SandtimeIcon from "@/assets/icons/sand-time-icon.svg";
import { type ConnectorActivityLog } from "@/types/connectors";

const Item = ({
  log,
  onClick,
  pointerEvent,
  selectedLog,
}: {
  log: ConnectorActivityLog;
  onClick: () => void;
  pointerEvent: "pointer" | "not-allowed";
  selectedLog: number | null;
}) => {
  const {
    message,
    user,
    user_name,
    timestamp,
    session_id,
    migration_id,
    status,
  } = log;

  // Use migration_id for selection if available, fallback to session_id for legacy or if mixed
  const idToCompare = migration_id ?? session_id;
  const isSelected = idToCompare && idToCompare === selectedLog;

  const msg = message.toLowerCase();
  let currentStatus = "pending";

  if (status === "E" || msg.includes("error") || msg.includes("failed")) {
    currentStatus = "error";
  } else if (msg.includes("paused")) {
    currentStatus = "paused";
  } else if (msg.includes("progress") || msg.includes("started")) {
    currentStatus = "progress";
  } else if (
    status === "S" ||
    msg.includes("completed") ||
    msg.includes("activated")
  ) {
    currentStatus = "success";
  }

  const displayUser = user_name || user;

  return (
    <Flex
      gap={2}
      py={1}
      px={2}
      borderBottom="1px solid #E2E8F0"
      bg={isSelected ? "blue.50" : "white"}
      _hover={{ bg: isSelected ? "blue.100" : "gray.50" }}
      cursor={pointerEvent}
      onClick={onClick}
      borderRadius="md"
      transition="background-color 0.2s"
    >
      <Box pt={0.5}>
        {currentStatus === "success" && (
          <Image src={CheckIcon} w="16px" h="16px" objectFit="contain" />
        )}
        {currentStatus === "progress" && (
          <Image src={SandtimeIcon} w="16px" h="16px" objectFit="contain" />
        )}
        {currentStatus === "paused" && (
          <FaPauseCircle color="#DD6B20" size={16} />
        )}
        {currentStatus === "error" && (
          <Image src={ErrorIcon} w="16px" h="16px" objectFit="contain" />
        )}
        {currentStatus === "pending" && (
          <Image src={SandtimeIcon} w="16px" h="16px" objectFit="contain" />
        )}
      </Box>
      <Flex direction="column" flex={1} gap={0.5}>
        <Text
          fontSize="sm"
          fontWeight="medium"
          color="gray.700"
          lineHeight="short"
          lineClamp={2}
        >
          {message}
        </Text>
        <Flex gap={4} alignItems="center">
          <Text fontSize="xs" color="gray.500">
            {timestamp
              ? format(new Date(timestamp), "yyyy-MM-dd, HH:mm:ss")
              : ""}
          </Text>
          <Text fontSize="xs" color="gray.500">
            {displayUser}
          </Text>
        </Flex>
      </Flex>
    </Flex>
  );
};

export default Item;
