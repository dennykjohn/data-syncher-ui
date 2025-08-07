import { Box, Button, Flex, Image, Text } from "@chakra-ui/react";

import { IoIosSettings } from "react-icons/io";
import { LuDot } from "react-icons/lu";
import { MdOutlinePauseCircleOutline } from "react-icons/md";

import Arrow from "@/assets/images/arrow-cool-down.svg";
import {
  getDestinationImage,
  getSourceImage,
} from "@/components/dashboard/utils/getImage";
import { type Connector } from "@/types/connectors";

const Header = ({ connector }: { connector: Connector }) => {
  const { source_name, destination_name } = connector;

  return (
    <Flex flexDirection="column" gap={4}>
      <Flex
        gap={6}
        alignItems="center"
        flexDirection={{ base: "column", md: "row" }}
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
              <IoIosSettings size={20} />
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
              <IoIosSettings size={20} />
            </Flex>
            <Flex flexWrap={"wrap"} gap={1} alignItems="center">
              <Text fontSize="sm">Destination</Text>
              <LuDot size={24} />
              <Text fontSize="sm">Loads every 5 minutes</Text>
            </Flex>
          </Box>
        </Flex>
      </Flex>
      <Flex justifyContent="flex-end" gap={2}>
        <Button colorPalette="green" size="xs" variant="solid">
          Active
        </Button>
        <Button
          colorPalette="gray"
          size="xs"
          variant="outline"
          onClick={() => {
            // Handle action
          }}
        >
          <MdOutlinePauseCircleOutline size={20} />
          Pause
        </Button>
      </Flex>
    </Flex>
  );
};

export default Header;
