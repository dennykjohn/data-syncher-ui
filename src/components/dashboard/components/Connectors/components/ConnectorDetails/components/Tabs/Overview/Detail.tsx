import { Flex, Text } from "@chakra-ui/react";

import { MdCompareArrows } from "react-icons/md";

import { format } from "date-fns";

import { type ConnectorActivityDetailResponse } from "@/types/connectors";

const Detail = ({
  detail,
}: {
  detail: ConnectorActivityDetailResponse["logs"][number];
}) => {
  const { message, timestamp } = detail;
  return (
    <Flex
      direction={{ base: "column", md: "row" }}
      borderBottom="1px solid #E2E8F0"
      paddingY={2}
      gap={2}
    >
      <MdCompareArrows color="#00832D" size={28} />
      <Text fontSize="sm" fontWeight="semibold">
        {message}
      </Text>
      <Text fontSize="xs">{format(new Date(timestamp), "PPpp")}</Text>
    </Flex>
  );
};

export default Detail;
