import { Flex } from "@chakra-ui/react";

import PageHeader from "@/components/dashboard/wrapper/PageHeader";
import ClientRoutes from "@/constants/client-routes";

const ConnectorConfiguration = ({
  source,
  destination,
  configuration,
  onConfigurationChange,
}: {
  source: any;
  destination: any;
  configuration: Record<string, any>;
  onConfigurationChange: (field: string, value: any) => void;
}) => {
  return (
    <Flex direction="column">
      <PageHeader
        breadcrumbs={[
          {
            label: "Connector",
            route: `${ClientRoutes.DASHBOARD}/${ClientRoutes.CONNECTORS.ROOT}`,
          },
          { label: "Configure" },
        ]}
        title="Select source type"
        subtitle="Select your source type you want to create your connectors from"
      />
    </Flex>
  );
};
export default ConnectorConfiguration;
