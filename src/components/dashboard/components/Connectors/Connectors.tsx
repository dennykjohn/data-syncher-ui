import { Flex } from "@chakra-ui/react";

import { useNavigate } from "react-router";

import ClientRoutes from "@/constants/client-routes";

import PageHeader from "../../wrapper/PageHeader";
import NoConnections from "./components/NoConnections";

const Connectors = () => {
  const navigate = useNavigate();

  return (
    <Flex flexDirection="column" gap={8} h="100%">
      <PageHeader
        breadcrumbs={[
          {
            label: "Connectors",
            route: `${ClientRoutes.DASHBOARD}/${ClientRoutes.CONNECTORS.ROOT}`,
          },
        ]}
        title="Connectors"
        buttonLabel="Add Connector"
        onCreateClick={() => navigate(ClientRoutes.CONNECTORS.ADD)}
      />
      <NoConnections />
    </Flex>
  );
};

export default Connectors;
