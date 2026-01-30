import { Suspense, useState } from "react";

import { Flex } from "@chakra-ui/react";

import { Outlet, useParams } from "react-router";

import LoadingSpinner from "@/components/shared/Spinner";
import useConnectionTableStatusWS from "@/hooks/useConnectionTableStatusWS";
import useUpdateSchemaStatusWS from "@/hooks/useUpdateSchemaStatusWS";
import { useFetchConnectorById } from "@/queryOptions/connector/useFetchConnectorDetailsById";

import Header from "./components/Header";
import Tabs from "./components/Tabs/Tabs";

const ConnectorDetails = () => {
  const { connectionId } = useParams<{ connectionId: string }>();
  const { data: connector, isLoading } = useFetchConnectorById(
    Number(connectionId) || 0,
  );

  // Initialize WebSockets at the parent level to persist across tabs
  useConnectionTableStatusWS(Number(connectionId));
  useUpdateSchemaStatusWS(Number(connectionId));

  const [filterDays, setFilterDays] = useState<number>(1);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!connector) {
    return <Flex>Connector not found</Flex>;
  }

  return (
    <Flex flexDirection="column" gap={0} h="100%">
      <Flex direction="column" gap={4}>
        <Header connector={connector} />
        <Tabs connector={connector} />
      </Flex>
      <Suspense fallback={<LoadingSpinner />}>
        <Flex overflowX="auto" flexGrow={1} justifyContent={"center"} pt={2}>
          <Outlet context={{ ...connector, filterDays, setFilterDays }} />
        </Flex>
      </Suspense>
    </Flex>
  );
};

export default ConnectorDetails;
