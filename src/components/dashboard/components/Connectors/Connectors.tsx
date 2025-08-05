import { useState } from "react";

import { Badge, Flex } from "@chakra-ui/react";

import { useNavigate } from "react-router";

import ClientRoutes from "@/constants/client-routes";
import { useFetchConnectorsListByPage } from "@/queryOptions/connector/useFetchConnectorsListByPage";
import Table, { type Column } from "@/shared/Table";
import { type ConnectorTableItem } from "@/types/connectors";

import PageHeader from "../../wrapper/PageHeader";
import TableFilter from "../../wrapper/TableFilter";
import NoConnections from "./components/NoConnections";

const columns: Column<ConnectorTableItem>[] = [
  { header: "Name", accessor: "connector_name" },
  { header: "Source", accessor: "source_name" },
  {
    header: "Destination",
    accessor: "destination_name",
  },
  {
    header: "Last sync",
    accessor: "last_synced_new",
  },
  {
    header: "Status",
    accessor: "status",
    render: (_, { status }) => (
      <Badge colorPalette={status ? "green" : "red"} variant="solid" size="sm">
        {status ? "Active" : "Paused"}
      </Badge>
    ),
  },
];
const SIZE = 10;

const Connectors = () => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const { data, isLoading } = useFetchConnectorsListByPage({
    page: currentPage,
    size: SIZE,
  });

  const totalNumberOfPages = data ? Math.ceil(data.totalElements / SIZE) : 0;
  const updateCurrentPage = (page: number) => {
    setCurrentPage(page);
  };

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
      {data?.totalElements === 0 && <NoConnections />}
      <TableFilter />
      <Flex h="100%">
        <Table<ConnectorTableItem>
          data={data?.content || []}
          columns={columns}
          totalNumberOfPages={totalNumberOfPages}
          updateCurrentPage={updateCurrentPage}
          isLoading={isLoading}
          onRowClick={(row) =>
            navigate(`${ClientRoutes.CONNECTORS.EDIT}/${row.source_name}`)
          }
        />
      </Flex>
    </Flex>
  );
};

export default Connectors;
