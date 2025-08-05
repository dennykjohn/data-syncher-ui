import { useState } from "react";

import { Badge, Flex } from "@chakra-ui/react";

import { format } from "date-fns";
import { useNavigate } from "react-router";

import ClientRoutes from "@/constants/client-routes";
import { useFetchDestinationListByPage } from "@/queryOptions/destination/useFetchDestinationListByPage";
import Table, { type Column } from "@/shared/Table";
import { type DestinationTableItem } from "@/types/destination";

import PageHeader from "../../wrapper/PageHeader";
import TableFilter from "../../wrapper/TableFilter";

const columns: Column<DestinationTableItem>[] = [
  { header: "Name", accessor: "name" },
  { header: "Destination", accessor: "dst" },
  {
    header: "Created At",
    accessor: "created_at",
    render: (_, { created_at }) =>
      format(new Date(created_at), "hh:mm a, dd MMMM"),
  },
  {
    header: "Updated At",
    accessor: "updated_at",
    render: (_, { updated_at }) =>
      format(new Date(updated_at), "hh:mm a, dd MMMM"),
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
  const { data, isLoading } = useFetchDestinationListByPage({
    page: currentPage,
    size: SIZE,
  });

  const totalNumberOfPages = data ? Math.ceil(data.totalElements / SIZE) : 0;
  const updateCurrentPage = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <Flex flexDirection="column" height="100%" gap={8}>
      <PageHeader
        breadcrumbs={[{ label: "Destinations", route: "" }]}
        buttonLabel="Add Destination"
        onCreateClick={() => navigate(ClientRoutes.DESTINATION.ADD)}
      />
      <TableFilter />
      <Flex h="100%">
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
      </Flex>
    </Flex>
  );
};

export default Destination;
