import { startTransition, useEffect, useState } from "react";

import { Badge, Flex, HStack, Image, Text } from "@chakra-ui/react";

import { format } from "date-fns";
import { useNavigate } from "react-router";

import TableWrapper from "@/components/dashboard/wrapper/TableWrapper";
import ClientRoutes from "@/constants/client-routes";
import { dateTimeFormat } from "@/constants/common";
import { VIEW_CONFIG } from "@/constants/view-config";
import { useFetchDestinationListByPage } from "@/queryOptions/destination/useFetchDestinationListByPage";
import Table, { type Column } from "@/shared/Table";
import { type DestinationTableItem } from "@/types/destination";

import { getDestinationImage } from "../../utils/getImage";
import PageHeader from "../../wrapper/PageHeader";
import TableFilter from "../../wrapper/TableFilter";
import NoDestinations from "./components/NoDestination";

const columns: Column<DestinationTableItem>[] = [
  { header: "Name", accessor: "name" },
  {
    header: "Destination",
    accessor: "dst",
    render: (_, { dst }) => (
      <HStack gap={1} align="center">
        <Image
          src={getDestinationImage(dst)}
          alt={dst}
          boxSize="24px"
          objectFit="contain"
        />
        <Text fontSize="sm">{dst}</Text>
      </HStack>
    ),
  },
  {
    header: "Created At",
    accessor: "created_at",
    render: (_, { created_at }) => format(new Date(created_at), dateTimeFormat),
  },
  {
    header: "Updated At",
    accessor: "updated_at",
    render: (_, { updated_at }) => format(new Date(updated_at), dateTimeFormat),
  },
  {
    header: "Status",
    accessor: "is_active",
    render: (_, { is_active }) => (
      <Badge
        colorPalette={is_active ? "green" : "red"}
        variant="solid"
        size="sm"
      >
        {is_active ? "Active" : "Paused"}
      </Badge>
    ),
  },
];
const SIZE = 10;

const Destination = () => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");

  const { data, isLoading, refetch } = useFetchDestinationListByPage({
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
  const totalNumberOfPages = data ? Math.ceil(data.totalElements / SIZE) : 0;
  const updateCurrentPage = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <Flex flexDirection="column" height="100%" gap={VIEW_CONFIG.pageGap}>
      <PageHeader
        breadcrumbs={[{ label: "Destinations", route: "" }]}
        title="Destinations"
        buttonLabel="Add Destination"
        onCreateClick={() => navigate(ClientRoutes.DESTINATION.ADD)}
      />
      {data?.totalElements === 0 && !searchTerm && <NoDestinations />}
      <TableFilter
        handleSearchInputChange={(e) => setSearchTerm(e.target.value)}
      />
      <TableWrapper>
        <Table<DestinationTableItem>
          data={data?.content || []}
          columns={columns}
          totalNumberOfPages={totalNumberOfPages}
          updateCurrentPage={updateCurrentPage}
          isLoading={isLoading}
          onRowClick={(row) =>
            navigate(`${ClientRoutes.DESTINATION.EDIT}/${row.dst_config_id}`)
          }
        />
      </TableWrapper>
    </Flex>
  );
};

export default Destination;
