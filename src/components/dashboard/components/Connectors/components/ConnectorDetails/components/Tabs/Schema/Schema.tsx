import { Flex } from "@chakra-ui/react";

import { useOutletContext } from "react-router";

import LoadingSpinner from "@/components/shared/Spinner";
import useFetchConnectorTableById from "@/queryOptions/connector/schema/useFetchTable";
import { type Connector } from "@/types/connectors";

const Schema = () => {
  const context = useOutletContext<Connector>();
  const { data: tables, isLoading } = useFetchConnectorTableById(
    context.connection_id,
  );

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <Flex flexDirection="column" gap={4}>
      {tables?.map((table) => (
        <div key={table.table}>{table.table}</div>
      ))}
    </Flex>
  );
};

export default Schema;
