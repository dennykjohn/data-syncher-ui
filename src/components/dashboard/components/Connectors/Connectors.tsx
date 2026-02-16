import { startTransition, useEffect, useState } from "react";

import { Badge, Flex, HStack, Image, Text } from "@chakra-ui/react";

import { format } from "date-fns";
import { useNavigate } from "react-router";

import TableWrapper from "@/components/dashboard/wrapper/TableWrapper";
import ClientRoutes from "@/constants/client-routes";
import { dateTimeFormat } from "@/constants/common";
import usePermissions from "@/hooks/usePermissions";
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
    render: (_, { source_name, display_name }) => (
      <HStack gap={1} align="center">
        <Image
          src={getSourceImage(source_name)}
          alt={source_name}
          boxSize="24px"
          objectFit="contain"
        />
        <Text fontSize="sm">{display_name || source_name}</Text>
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
      return format(d, dateTimeFormat);
    },
  },
  {
    header: "Next sync in",
    accessor: "next_sync_time",
    render: (_, { next_sync_time }) => {
      if (!next_sync_time || next_sync_time === "None") return "--";
      const d = new Date(next_sync_time);
      if (Number.isNaN(d.getTime())) return next_sync_time;
      return format(d, dateTimeFormat);
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
  const { can } = usePermissions();

  const canCreate = can("can_create_connectors");

  const { data, isLoading, refetch } = useFetchConnectorsListByPage({
    page: currentPage,
    size: SIZE,
    searchTerm,
  });

  useEffect(() => {
    startTransition(() => {
      setCurrentPage(1);
    });
  }, [searchTerm]);

  useEffect(() => {
    refetch();
  }, [currentPage, refetch]);

  const updateCurrentPage = (page: number) => {
    setCurrentPage(page);
  };

  //if (data?.totalElements === 0) return <NoConnections />;
  return (
    <Flex flexDirection="column" gap={4} h="100%">
      <PageHeader
        breadcrumbs={[
          {
            label: "Connectors",
            route: `${ClientRoutes.DASHBOARD}/${ClientRoutes.CONNECTORS.ROOT}`,
          },
        ]}
        title="Connectors"
        buttonLabel={canCreate ? "Add Connector" : undefined}
        onCreateClick={
          canCreate ? () => navigate(ClientRoutes.CONNECTORS.ADD) : undefined
        }
      />

      {data?.totalElements === 0 && !searchTerm && <NoConnections />}
      <TableFilter
        handleSearchInputChange={(e) => setSearchTerm(e.target.value)}
      />
      <TableWrapper>
        <Table<ConnectorTableItem>
          data={data?.content || []}
          columns={columns}
          totalElements={data?.totalElements || 0}
          pageSize={SIZE}
          updateCurrentPage={updateCurrentPage}
          isLoading={isLoading}
          onRowClick={(row) =>
            navigate(`${ClientRoutes.CONNECTORS.EDIT}/${row.connection_id}`)
          }
        />
      </TableWrapper>
    </Flex>
  );
};

export default Connectors;
