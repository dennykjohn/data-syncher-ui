import { useEffect, useState } from "react";

import { Badge, Flex, HStack, Image, Text } from "@chakra-ui/react";

import { format } from "date-fns";
import { useNavigate } from "react-router";

import ClientRoutes from "@/constants/client-routes";
import { VIEW_CONFIG } from "@/constants/view-config";
import { useFetchConnectorsListByPage } from "@/queryOptions/connector/useFetchConnectorsListByPage";
import Table, { type Column } from "@/shared/Table";
import {
  type ConnectorStatus,
  type ConnectorTableItem,
} from "@/types/connectors";

import { getDestinationImage, getSourceImage } from "../../utils/getImage";
import PageHeader from "../../wrapper/PageHeader";
import TableFilter from "../../wrapper/TableFilter";
import NoConnections from "./components/NoConnections";

const getStatusColor = (status: ConnectorStatus) => {
  switch (status) {
    case "A":
      return "green";
    case "P":
      return "yellow";
    case "B":
      return "red";
    default:
      return "gray";
  }
};

const columns: Column<ConnectorTableItem>[] = [
  { header: "Name", accessor: "connector_name" },
  {
    header: "Source",
    accessor: "source_name",
    render: (_, { source_name }) => (
      <HStack gap={1} align="center">
        <Image
          src={getSourceImage(source_name)}
          alt={source_name}
          boxSize="24px"
          objectFit="contain"
        />
        <Text fontSize="sm">{source_name}</Text>
      </HStack>
    ),
  },
  {
    header: "Destination",
    accessor: "destination_name",
    render: (_, { destination_name }) => (
      <HStack gap={1} align="center">
        <Image
          src={getDestinationImage(destination_name)}
          alt={destination_name}
          boxSize="24px"
          objectFit="contain"
        />
        <Text fontSize="sm">{destination_name}</Text>
      </HStack>
    ),
  },
  {
    header: "Last sync",
    accessor: "last_synced_new",
    render: (_, { last_synced_new }) => {
      const d = new Date(last_synced_new as string | number);
      if (Number.isNaN(d.getTime())) return String(last_synced_new ?? "");
      return format(d, "hh:mm a, dd MMMM");
    },
  },
  {
    header: "Status",
    accessor: "status",
    render: (_, { status }) => (
      <Badge colorPalette={getStatusColor(status)} variant="solid" size="sm">
        {(() => {
          switch (status) {
            case "A":
              return "Active";
            case "P":
              return "Paused";
            case "B":
              return "Broken";
            default:
              return "Unknown";
          }
        })()}
      </Badge>
    ),
  },
];
const SIZE = 10;

const Connectors = () => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");

  const { data, isLoading, refetch } = useFetchConnectorsListByPage({
    page: currentPage,
    size: SIZE,
    searchTerm,
  });

  useEffect(() => {
    refetch();
  }, [searchTerm, refetch]);

  const totalNumberOfPages = data ? Math.ceil(data.totalElements / SIZE) : 0;
  const updateCurrentPage = (page: number) => {
    setCurrentPage(page);
  };

  //if (data?.totalElements === 0) return <NoConnections />;
  return (
    <Flex flexDirection="column" gap={VIEW_CONFIG.pageGap} h="100%">
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
      {data?.totalElements === 0 && !searchTerm && <NoConnections />}
      <TableFilter
        handleSearchInputChange={(e) => setSearchTerm(e.target.value)}
      />
      <Flex h="100%">
        <Table<ConnectorTableItem>
          data={data?.content || []}
          columns={columns}
          totalNumberOfPages={totalNumberOfPages}
          updateCurrentPage={updateCurrentPage}
          isLoading={isLoading}
          onRowClick={(row) =>
            navigate(`${ClientRoutes.CONNECTORS.EDIT}/${row.connection_id}`)
          }
        />
      </Flex>
    </Flex>
  );
};

export default Connectors;
