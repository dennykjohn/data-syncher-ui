import { Suspense } from "react";

import { Flex } from "@chakra-ui/react";

import { Outlet, useParams } from "react-router";

import LoadingSpinner from "@/components/shared/Spinner";
import { VIEW_CONFIG } from "@/constants/view-config";
import { useFetchConnectorById } from "@/queryOptions/connector/useFetchConnectorDetailsById";

import Header from "./components/Header";
import Tabs from "./components/Tabs/Tabs";

const ConnectorDetails = () => {
  const { connectionId } = useParams<{ connectionId: string }>();
  const { data: connector, isLoading } = useFetchConnectorById(
    connectionId || "",
  );

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!connector) {
    return <Flex>Connector not found</Flex>;
  }

  return (
    <Flex flexDirection="column" gap={VIEW_CONFIG.pageGap} h="100%">
      <Header connector={connector} />
      <Tabs />
      <Suspense fallback={<LoadingSpinner />}>
        <Outlet context={{ connector }} />
      </Suspense>
    </Flex>
  );
};

export default ConnectorDetails;
