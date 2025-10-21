import { Flex, Text } from "@chakra-ui/react";

import { FaPauseCircle } from "react-icons/fa";
import { FcOk } from "react-icons/fc";
import { MdArrowRight, MdHourglassTop, MdRefresh } from "react-icons/md";

import { format } from "date-fns";

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
  const { message, user, timestamp, session_id } = log;
  const isSelected = session_id && session_id === selectedLog;

  const InProgress =
    message.toLowerCase().includes("progress") ||
    message.toLowerCase().includes("started");
  const Paused = message.toLowerCase().includes("paused");
  const Refreshed = message.toLowerCase().includes("refreshed");
  const Completed =
    message.toLowerCase().includes("completed") ||
    message.toLowerCase().includes("activated");

  return (
    <Flex
      alignItems="center"
      cursor={pointerEvent}
      gap={2}
      padding={2}
      borderBottom="1px solid #E2E8F0"
      bgColor={isSelected ? "blue.100" : "white"}
      onClick={onClick}
      direction={{ base: "column", md: "row" }}
    >
      <Flex>
        {Completed && <FcOk />}
        {InProgress && <MdHourglassTop color="#2684FC" />}
        {Paused && <FaPauseCircle color="#EAAB00" />}
        {Refreshed && <MdRefresh color="#6E2FD5" />}
      </Flex>
      <Flex direction="column" ml={2} flex={1}>
        <Text fontSize="sm" fontWeight="semibold">
          {message}
        </Text>
        <Text fontSize="xs">{user}</Text>
      </Flex>
      <Flex>
        <Text fontSize="xs">{format(timestamp, "PPpp")}</Text>
      </Flex>
      {session_id && <MdArrowRight size={20} />}
    </Flex>
  );
};

export default Item;
