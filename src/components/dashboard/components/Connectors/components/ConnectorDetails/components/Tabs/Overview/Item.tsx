import { Flex, Text } from "@chakra-ui/react";

//import { FaPauseCircle } from "react-icons/fa";
import { FcOk } from "react-icons/fc";
import { MdArrowRight } from "react-icons/md";

//import { MdArrowRight, MdHourglassTop, MdRefresh } from "react-icons/md";

import { format } from "date-fns";

import { type ConnectorActivityLog } from "@/types/connectors";

const Item = ({
  log,
  isSelected,
  onClick,
}: {
  log: ConnectorActivityLog;
  isSelected: boolean;
  onClick: () => void;
}) => {
  const { message, user, timestamp } = log;

  return (
    <Flex
      alignItems="center"
      cursor="pointer"
      gap={2}
      padding={2}
      borderBottom="1px solid #E2E8F0"
      bgColor={isSelected ? "blue.100" : "white"}
      onClick={onClick}
      direction={{ base: "column", md: "row" }}
    >
      <Flex>
        <FcOk />
        {/* <MdHourglassTop color="#2684FC" />
        <FaPauseCircle color="#EAAB00" />
        <MdRefresh color="#6E2FD5" /> */}
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
      <MdArrowRight size={20} />
    </Flex>
  );
};

export default Item;
