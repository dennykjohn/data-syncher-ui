import { useState } from "react";

import { Flex } from "@chakra-ui/react";

import { useNavigate } from "react-router";

import ClientRoutes from "@/constants/client-routes";
import { useFetchDestinationListByPage } from "@/queryOptions/destination/useFetchDestinationListByPage";
import Table, { type Column } from "@/shared/Table";
import { type DestinationTableItem } from "@/types/destination";

import PageHeader from "../../wrapper/PageHeader";
import TableFilter from "../../wrapper/TableFilter";

const columns: Column<DestinationTableItem>[] = [
  { header: "Name", accessor: "name" },
  { header: "Source", accessor: "dst" },
  { header: "Destination", accessor: "dst" },
  { header: "Status", accessor: "dst" },
  { header: "Created At", accessor: "created_at" },
  { header: "Updated At", accessor: "updated_at" },
  { header: "Sync Frequency", accessor: "dst" },
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
