import { Flex } from "@chakra-ui/react";

import ClientRoutes from "@/constants/client-routes";
import Table, { type Column } from "@/shared/Table";

import PageHeader from "../../wrapper/PageHeader";
import TableFilter from "../../wrapper/TableFilter";

type DestinationItem = {
  id: number;
  name: string;
  source: string;
  destination: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  syncFrequency: string;
};

const items: DestinationItem[] = [
  {
    id: 1,
    name: "Test Connection",
    source: "Microsoft Dynamic",
    destination: "AT_PROD_TEST",
    status: "Active",
    createdAt: "2023-10-01",
    updatedAt: "2023-10-02",
    syncFrequency: "Daily",
  },
  {
    id: 2,
    name: "Test Connection",
    source: "Microsoft Dynamic",
    destination: "AT_PROD_TEST",
    status: "Active",
    createdAt: "2023-10-01",
    updatedAt: "2023-10-02",
    syncFrequency: "Daily",
  },
  {
    id: 3,
    name: "Test Connection",
    source: "Microsoft Dynamic",
    destination: "AT_PROD_TEST",
    status: "Active",
    createdAt: "2023-10-01",
    updatedAt: "2023-10-02",
    syncFrequency: "Daily",
  },
];

const Destination = () => {
  const columns: Column<DestinationItem>[] = [
    { header: "Name", accessor: "name" },
    { header: "Source", accessor: "source" },
    { header: "Destination", accessor: "destination" },
    { header: "Status", accessor: "status" },
    { header: "Created At", accessor: "createdAt" },
    { header: "Updated At", accessor: "updatedAt" },
    { header: "Sync Frequency", accessor: "syncFrequency" },
  ];

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
      <Flex h="100%">
        <Table<DestinationItem>
          data={items}
          columns={columns}
          totalNumberOfPages={1}
          updateCurrentPage={() => {}}
        />
      </Flex>
    </Flex>
  );
};

export default Destination;
