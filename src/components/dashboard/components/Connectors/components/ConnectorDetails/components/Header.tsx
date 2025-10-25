import { Box, Button, Flex, Image, Text } from "@chakra-ui/react";

import { CiPause1 } from "react-icons/ci";
import { IoMdCheckmark } from "react-icons/io";
import { LuDot } from "react-icons/lu";

import Arrow from "@/assets/images/arrow-cool-down.svg";
import {
  getDestinationImage,
  getSourceImage,
} from "@/components/dashboard/utils/getImage";
import { toaster } from "@/components/ui/toaster";
import useToggleConnectionStatus from "@/queryOptions/connector/useToggleConnectionStatus";
import { type Connector } from "@/types/connectors";

const Header = ({ connector }: { connector: Connector }) => {
  const {
    source_name,
    destination_name,
    status,
    connection_id,
    time_frequency,
  } = connector;

  const { mutate: toggleConnectionStatus, isPending } =
    useToggleConnectionStatus({
      connectorId: connection_id,
    });

  const onToggleSuccess = () => {
    toaster.success({
      title: "Connector status updated",
    });
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
      return minutes === 0 ? `${hours}h` : `${hours}h ${minutes}m`;
    }
    return `${freqNum}m`;
  };

  return (
    <Flex flexDirection="column" gap={4}>
      <Flex
        gap={6}
        alignItems="center"
        flexDirection={{ base: "column", md: "row" }}
        flexWrap="wrap"
      >
        <Flex gap={2} alignItems={"center"}>
          <Box>
            <Image
              src={getSourceImage(source_name)}
              alt={source_name}
              boxSize="50px"
              objectFit="cover"
            />
          </Box>
          <Box>
            <Flex gap={2} alignItems="center">
              <Text>{source_name}</Text>
            </Flex>
            <Text fontSize="sm">Source</Text>
          </Box>
        </Flex>
        <Flex>
          <Image src={Arrow} alt="arrow" />
        </Flex>
        <Flex gap={2} alignItems={"center"}>
          <Box>
            <Image
              src={getDestinationImage(destination_name)}
              alt={destination_name}
              boxSize="50px"
              objectFit="cover"
            />
          </Box>
          <Box>
            <Flex gap={2} alignItems="center">
              <Text>{destination_name}</Text>
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
        <Flex ml="auto" gap={2}>
          {(status === "P" || status === "B") && (
            <Button
              colorPalette="yellow"
              size="xs"
              variant="solid"
              loading={isPending}
              onClick={() =>
                toggleConnectionStatus(undefined, {
                  onSuccess: onToggleSuccess,
                })
              }
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
              onClick={() =>
                toggleConnectionStatus(undefined, {
                  onSuccess: onToggleSuccess,
                })
              }
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
