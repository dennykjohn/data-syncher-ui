import { Flex } from "@chakra-ui/react";

import PageHeader from "@/components/dashboard/wrapper/PageHeader";
import ClientRoutes from "@/constants/client-routes";

const NewDestination = () => {
  return (
    <Flex direction="column">
      <PageHeader
        breadcrumbs={[
          {
            label: "Destination",
            route: `${ClientRoutes.DASHBOARD}/${ClientRoutes.DESTINATION.ROOT}`,
          },
          { label: "Add destination" },
        ]}
        title="Add destination"
        subtitle="A destination is a data warehouse that store all your data"
      />
    </Flex>
  );
};
export default NewDestination;
