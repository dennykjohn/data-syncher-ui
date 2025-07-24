import { Flex } from "@chakra-ui/react";

import { useNavigate } from "react-router";

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

  const navigate = useNavigate();

  return (
    <Flex flexDirection="column" height="100%" gap={8}>
      <PageHeader
        breadcrumbs={[{ label: "Destinations", route: "" }]}
        buttonLabel="Add Destination"
        onCreateClick={() => navigate(ClientRoutes.DESTINATION.ADD)}
      />
      <TableFilter />
      <Flex h="100%">
        <Table<DestinationItem>
          data={items}
          columns={columns}
          totalNumberOfPages={100}
          updateCurrentPage={() => {}}
        />
      </Flex>
    </Flex>
  );
};

export default Destination;
