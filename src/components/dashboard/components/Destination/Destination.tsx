import { Flex } from "@chakra-ui/react";

import ClientRoutes from "@/constants/client-routes";
import TableComponent from "@/shared/Table/Table";

import PageHeader from "../../wrapper/PageHeader";
import TableFilter from "../../wrapper/TableFilter";

const Destination = () => {
  return (
    <Flex flexDirection="column" height="100%" gap={8}>
      <PageHeader
        breadcrumbs={[
          {
            label: "Destinations",
            route: `${ClientRoutes.DASHBOARD}/${ClientRoutes.DESTINATION}`,
          },
          { label: "Destinations", route: "" },
        ]}
        buttonLabel="Add Destination"
        //onCreateClick={() => console.log("Add Destination clicked")}
      />
      <TableFilter />
      <Flex>
        <TableComponent />
      </Flex>
    </Flex>
  );
};

export default Destination;
