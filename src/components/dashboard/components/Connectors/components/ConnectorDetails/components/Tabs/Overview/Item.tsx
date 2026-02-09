import { Box, Flex, Image, Text } from "@chakra-ui/react";

import {
  FaExclamationTriangle,
  FaPauseCircle,
  FaPlayCircle,
} from "react-icons/fa";

import { format } from "date-fns";

import CheckIcon from "@/assets/icons/check-icon.svg";
import ErrorIcon from "@/assets/icons/error-icon.svg";
import SandtimeIcon from "@/assets/icons/sand-time-icon.svg";
import { dateTimeFormat } from "@/constants/common";
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
    ui_state,
    trigger_type,
  } = log;

  // Prioritize log_id for uniqueness, fallback to migration_id or session_id
  const idToCompare = log.log_id ?? migration_id ?? session_id;
  const isSelected = idToCompare && idToCompare === selectedLog;

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
        {ui_state === "success" && (
          <Image src={CheckIcon} w="16px" h="16px" objectFit="contain" />
        )}
        {ui_state === "in_progress" && (
          <Image src={SandtimeIcon} w="16px" h="16px" objectFit="contain" />
        )}
        {ui_state === "paused" && <FaPauseCircle color="#DD6B20" size={16} />}
        {ui_state === "active" && <FaPlayCircle color="#38A169" size={16} />}
        {ui_state === "error" && (
          <Image src={ErrorIcon} w="16px" h="16px" objectFit="contain" />
        )}
        {ui_state === "warning" && (
          <FaExclamationTriangle color="#DD6B20" size={16} />
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
            {timestamp ? format(new Date(timestamp), dateTimeFormat) : ""}
          </Text>
          <Text fontSize="xs" color="gray.500">
            {displayUser}
          </Text>
          {trigger_type && (
            <Text fontSize="xs" color="gray.500">
              {trigger_type}
            </Text>
          )}
        </Flex>
      </Flex>
    </Flex>
  );
};

export default Item;
