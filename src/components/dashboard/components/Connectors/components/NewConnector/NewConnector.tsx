import { Flex } from "@chakra-ui/react";

import PageHeader from "@/components/dashboard/wrapper/PageHeader";
import ClientRoutes from "@/constants/client-routes";

const NewConnector = () => {
  return (
    <Flex direction="column">
      <PageHeader
        breadcrumbs={[
          {
            label: "Connector",
            route: `${ClientRoutes.DASHBOARD}/${ClientRoutes.CONNECTORS.ROOT}`,
          },
          { label: "Configure", route: "" },
        ]}
        title="Select source type"
        subtitle="Select your source type want to create your connectors from"
      />
    </Flex>
  );
};
export default NewConnector;
