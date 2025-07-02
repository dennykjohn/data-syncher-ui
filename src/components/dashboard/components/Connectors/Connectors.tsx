import { Flex } from "@chakra-ui/react";

import ClientRoutes from "@/constants/client-routes";

import PageHeader from "../../wrapper/PageHeader";
import NoConnections from "./components/NoConnections";

const Connectors = () => {
  return (
    <Flex flexDirection="column" gap={8} h="100%">
      <PageHeader
        breadcrumbs={[
          {
            label: "Connectors",
            route: `${ClientRoutes.DASHBOARD}/${ClientRoutes.CONNECTORS}`,
          },
          { label: "Connectors", route: "" },
        ]}
        buttonLabel="Add Connector"
        onCreateClick={() => console.log("Add Connector clicked")}
      />
      <NoConnections />
    </Flex>
  );
};

export default Connectors;
