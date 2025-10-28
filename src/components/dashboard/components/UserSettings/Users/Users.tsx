import { useEffect, useState } from "react";

import { Flex } from "@chakra-ui/react";

import { useNavigate } from "react-router";

import PageHeader from "@/components/dashboard/wrapper/PageHeader";
import TableFilter from "@/components/dashboard/wrapper/TableFilter";
import ClientRoutes from "@/constants/client-routes";
import { VIEW_CONFIG } from "@/constants/view-config";
import { useFetchUsersListByPage } from "@/queryOptions/user/useFetchUsersListByPage";
import Table, { type Column } from "@/shared/Table";
import { type UserTableItem } from "@/types/user";

import NoUsers from "./NoUsers";

const columns: Column<UserTableItem>[] = [
  { header: "First Name", accessor: "first_name" },
  { header: "Last Name", accessor: "last_name" },
  { header: "Role", accessor: "role" },
  { header: "Company Email", accessor: "company_email" },
  { header: "Company Name", accessor: "company_name" },
];
const SIZE = 10;

const Users = () => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");

  const { data, isLoading, refetch } = useFetchUsersListByPage({
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

  return (
    <Flex flexDirection="column" gap={VIEW_CONFIG.pageGap} h="100%">
      <PageHeader
        breadcrumbs={[
          {
            label: "User settings",
            route: "",
          },
          {
            label: "Users & permissions",
            route: "",
          },
        ]}
        title="Users & permissions"
        buttonLabel="Add Member"
        onCreateClick={() => navigate(`${ClientRoutes.USER_SETTINGS.USER_ADD}`)}
      />
      {data?.totalElements === 0 && !searchTerm && <NoUsers />}
      <TableFilter
        handleSearchInputChange={(e) => {
          setSearchTerm(e.target.value);
        }}
      />
      <Flex h="100%">
        <Table<UserTableItem>
          data={data?.content || []}
          columns={columns}
          totalNumberOfPages={totalNumberOfPages}
          updateCurrentPage={updateCurrentPage}
          isLoading={isLoading}
          onRowClick={({ user_id }) =>
            navigate(`${ClientRoutes.USER_SETTINGS.USER_EDIT}/${user_id}`)
          }
        />
      </Flex>
    </Flex>
  );
};

export default Users;
