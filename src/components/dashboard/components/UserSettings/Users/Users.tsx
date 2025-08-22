import { useState } from "react";

import { Flex } from "@chakra-ui/react";

import { useNavigate } from "react-router";

import PageHeader from "@/components/dashboard/wrapper/PageHeader";
import TableFilter from "@/components/dashboard/wrapper/TableFilter";
import ClientRoutes from "@/constants/client-routes";
import { useFetchUsersListByPage } from "@/queryOptions/user/useFetchUsersListByPage";
import Table, { type Column } from "@/shared/Table";
import { type UserTableItem } from "@/types/user";

import NoUsers from "./NoUsers";

const columns: Column<UserTableItem>[] = [
  { header: "First Name", accessor: "first_name" },
  { header: "Last Name", accessor: "last_name" },
  { header: "Email", accessor: "email" },
  { header: "Company Email", accessor: "company_email" },
  { header: "Company Name", accessor: "company_name" },
];
const SIZE = 10;

const Users = () => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const { data, isLoading } = useFetchUsersListByPage({
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
        onCreateClick={() => navigate(ClientRoutes.CONNECTORS.ADD)}
      />
      {data?.totalElements === 0 && <NoUsers />}
      <TableFilter />
      <Flex h="100%">
        <Table<UserTableItem>
          data={data?.content || []}
          columns={columns}
          totalNumberOfPages={totalNumberOfPages}
          updateCurrentPage={updateCurrentPage}
          isLoading={isLoading}
          onRowClick={(row) =>
            navigate(
              `${ClientRoutes.USER_SETTINGS}/${ClientRoutes.USER_SETTINGS.USERS}${ClientRoutes.USER_SETTINGS.USER_EDIT}/${row.first_name}`,
            )
          }
        />
      </Flex>
    </Flex>
  );
};

export default Users;
