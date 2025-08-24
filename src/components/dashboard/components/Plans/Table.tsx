import { Flex } from "@chakra-ui/react";

import Table, { type Column } from "@/shared/Table";

import { TableData, type TableRow } from "./tableData";

const columns: Column<TableRow>[] = [
  { accessor: "records", header: "Records" },
  { accessor: "units", header: "Units" },
  { accessor: "price", header: "Price/Units" },
  { accessor: "lowAmount1", header: "Low Amounts ($)" },
  { accessor: "lowAmount2", header: "Low Amounts ($)" },
];

const DataTable = () => {
  return (
    <Flex h="100%">
      <Table
        columns={columns}
        data={TableData}
        totalNumberOfPages={1}
        updateCurrentPage={() => {}}
        hidePagination={true}
      />
    </Flex>
  );
};

export default DataTable;
