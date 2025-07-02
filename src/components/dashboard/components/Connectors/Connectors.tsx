import { Flex } from "@chakra-ui/react";

import ClientRoutes from "@/constants/client-routes";

import PageHeader from "../../wrapper/PageHeader";

const Connectors = () => {
  return (
    <Flex flexDirection="column" gap={8}>
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
      <Flex>
        <h1>Connectors Page</h1>
        <p>This is where you can manage your connectors.</p>
      </Flex>
    </Flex>
  );
};

export default Connectors;
