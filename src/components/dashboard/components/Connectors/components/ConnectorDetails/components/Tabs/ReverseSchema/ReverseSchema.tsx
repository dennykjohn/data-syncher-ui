import { useRef, useState } from "react";

import { Flex, Grid } from "@chakra-ui/react";

import { useOutletContext } from "react-router";

import LoadingSpinner from "@/components/shared/Spinner";
import useFetchReverseSchema from "@/queryOptions/connector/reverseSchema/useFetchReverseSchema";
import { type Connector } from "@/types/connectors";

import Actions from "./Actions";
import Destination from "./components/Destination/Destination";
import Mapped, { type MappedRef } from "./components/Mapped/Mapped";
import Source from "./components/Source/Source";

const ReverseSchema = () => {
  const context = useOutletContext<Connector>();
  const mappedRef = useRef<MappedRef>(null);

  const [shouldShowDisabledState, setShouldShowDisabledState] = useState(false);

  const { data: reverseSchemaData, isLoading } = useFetchReverseSchema(
    context.connection_id,
  );

  const handleDrop = (sourceTable: string, destinationTable: string) => {
    mappedRef.current?.handleDrop(sourceTable, destinationTable);
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <Flex flexDirection="column" gap={4} pb={8} w="100%">
      <Actions
        shouldShowDisabledState={shouldShowDisabledState}
        setShouldShowDisabledState={setShouldShowDisabledState}
      />
      <Grid
        templateColumns={["1fr", "1fr 1fr 1fr"]}
        gap={4}
        style={{ overflow: "visible" }}
        w="100%"
      >
        <Source reverseSchemaData={reverseSchemaData || null} />
        <Destination
          onDrop={handleDrop}
          reverseSchemaData={reverseSchemaData || null}
        />
        <Mapped ref={mappedRef} reverseSchemaData={reverseSchemaData || null} />
      </Grid>
    </Flex>
  );
};

export default ReverseSchema;
