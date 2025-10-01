import { Button, Flex, Text } from "@chakra-ui/react";

import { MdOutlineEdit } from "react-icons/md";

import { useOutletContext } from "react-router";

import { type Connector } from "@/types/connectors";

import Form from "./Form";

const Settings = () => {
  const connector = useOutletContext<Connector>();

  return (
    <Flex flexDirection="column" gap={4}>
      <Text fontSize="md" fontWeight="semibold">
        Connection details
      </Text>
      <Flex
        justifyContent={{ base: "space-between", md: "space-between" }}
        alignItems={{ base: "flex-start", md: "center" }}
        direction={{ base: "column", md: "row" }}
        gap={4}
      >
        <Flex gap={4}>
          <Flex>
            <Text fontSize="sm">Connected by:</Text>
            <Text fontSize="sm" fontWeight="semibold">
              {connector?.company_name}
            </Text>
          </Flex>
          <Flex>
            <Text fontSize="sm">Connected on:</Text>
            <Text fontSize="sm" fontWeight="semibold">
              {connector?.destination_name}
            </Text>
          </Flex>
        </Flex>
        <Button variant="outline" colorPalette={"brand"} color={"brand.500"}>
          <MdOutlineEdit color="brand.500" />
          Edit connection
        </Button>
      </Flex>
      <Form {...connector} />
    </Flex>
  );
};

export default Settings;
