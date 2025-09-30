import { Button, Flex, Text } from "@chakra-ui/react";

import { MdOutlineEdit } from "react-icons/md";

import { useParams } from "react-router";

import useFetchConnectorSettings from "@/queryOptions/connector/useFetchConnectorSettings";

import Form from "./Form";

const Settings = () => {
  const { connectionId } = useParams<{ connectionId: string }>();
  const { data: connectorSettings } = useFetchConnectorSettings(
    connectionId || "",
  );

  return (
    <Flex flexDirection="column" gap={4}>
      <Text fontSize="md" fontWeight="semibold">
        Connection details
      </Text>
      <Flex justifyContent={"space-between"} alignItems="center">
        <Flex gap={4}>
          <Flex>
            <Text fontSize="sm">Connected by:</Text>
            <Text fontSize="sm" fontWeight="semibold">
              {connectorSettings?.company_name}
            </Text>
          </Flex>
          <Flex>
            <Text fontSize="sm">Connected on:</Text>
            <Text fontSize="sm" fontWeight="semibold">
              {connectorSettings?.destination_name}
            </Text>
          </Flex>
        </Flex>
        <Button variant="outline" colorPalette={"brand"} color={"brand.500"}>
          <MdOutlineEdit color="brand.500" />
          Edit connection
        </Button>
      </Flex>
      <Form />
    </Flex>
  );
};

export default Settings;
