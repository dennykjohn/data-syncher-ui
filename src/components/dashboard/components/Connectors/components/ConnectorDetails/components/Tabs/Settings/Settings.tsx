import { Button, Flex, Text } from "@chakra-ui/react";

import { MdOutlineEdit } from "react-icons/md";

import { useNavigate, useOutletContext } from "react-router";

import ClientRoutes from "@/constants/client-routes";
import { type Connector } from "@/types/connectors";

import Form from "./Form";

const Settings = () => {
  const connector = useOutletContext<Connector>();
  const navigate = useNavigate();

  const handleEditConnectorClick = () => {
    navigate(
      `${ClientRoutes.DASHBOARD}/${ClientRoutes.CONNECTORS.ROOT}/${ClientRoutes.CONNECTORS.EDIT_CONFIGURATION}/${
        connector.connection_id
      }`,
    );
  };

  return (
    <Flex flexDirection="column" gap={4} w="100%">
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
        <Button
          variant="outline"
          colorPalette={"brand"}
          color={"brand.500"}
          onClick={handleEditConnectorClick}
        >
          <MdOutlineEdit color="brand.500" />
          Edit connection
        </Button>
      </Flex>
      <Form {...connector} />
    </Flex>
  );
};

export default Settings;
