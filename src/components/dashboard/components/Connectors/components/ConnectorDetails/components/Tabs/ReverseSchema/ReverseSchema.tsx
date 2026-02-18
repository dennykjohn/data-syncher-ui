import { useEffect, useMemo, useRef, useState } from "react";

import { Flex, Grid } from "@chakra-ui/react";

import { useOutletContext } from "react-router";

import LoadingSpinner from "@/components/shared/Spinner";
import useFetchReverseSchema from "@/queryOptions/connector/reverseSchema/useFetchReverseSchema";
import useFetchTableStatus from "@/queryOptions/connector/schema/useFetchTableStatus";
import useUpdateSchemaStatus from "@/queryOptions/connector/schema/useUpdateSchemaStatus";
import { type Connector } from "@/types/connectors";

import Actions from "./Actions";
import Destination from "./components/Destination/Destination";
import Mapped, { type MappedRef } from "./components/Mapped/Mapped";
import Source from "./components/Source/Source";
import { useIsMutating, useQueryClient } from "@tanstack/react-query";

const ReverseSchema = () => {
  const context = useOutletContext<Connector>();
  const queryClient = useQueryClient();
  const mappedRef = useRef<MappedRef>(null);

  const [shouldShowDisabledState, setShouldShowDisabledState] = useState(false);

  useEffect(() => {
    // Strict refresh: invalidate on mount to ensure we always get fresh source tables
    queryClient.invalidateQueries({
      queryKey: ["ReverseSchema", context.connection_id],
    });
  }, [context.connection_id, queryClient]);

  const {
    data: reverseSchemaData,
    isLoading,
    isFetching,
  } = useFetchReverseSchema(context.connection_id);

  const { data: tableStatusData } = useFetchTableStatus(
    context.connection_id,
    true,
    false, // Stop aggressive polling, rely on WS
  );

  const { status: schemaStatus } = useUpdateSchemaStatus(
    context.connection_id,
    true,
  );

  const isRefreshSchemaInProgress = useIsMutating({
    mutationKey: ["refreshSchema", context.connection_id],
  });

  const isUpdateSchemaInProgress = useIsMutating({
    mutationKey: ["updateSchema", context.connection_id],
  });

  const isMigrationInProgress = useMemo(() => {
    const hasTableInProgress =
      tableStatusData?.tables?.some(
        (t: { status: string | null }) => t.status === "in_progress",
      ) || false;
    const isSchemaSyncing = schemaStatus?.is_in_progress === true;
    const isRefreshing = isRefreshSchemaInProgress > 0;
    const isUpdating = isUpdateSchemaInProgress > 0;
    const isGlobalRefreshActive =
      tableStatusData?.schema_refresh_in_progress === true;

    return (
      hasTableInProgress ||
      isSchemaSyncing ||
      isRefreshing ||
      isUpdating ||
      isGlobalRefreshActive
    );
  }, [
    tableStatusData,
    schemaStatus,
    isRefreshSchemaInProgress,
    isUpdateSchemaInProgress,
  ]);

  const totalDisabledState = shouldShowDisabledState || isMigrationInProgress;

  const handleDrop = (sourceTable: string, destinationTable: string) => {
    mappedRef.current?.handleDrop(sourceTable, destinationTable);
  };

  if (isLoading && !reverseSchemaData) {
    return <LoadingSpinner />;
  }

  return (
    <Flex flexDirection="column" gap={4} pb={8} w="100%">
      <Actions
        shouldShowDisabledState={totalDisabledState}
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
          isFetching={isFetching}
        />
        <Mapped
          ref={mappedRef}
          reverseSchemaData={reverseSchemaData || null}
          isDisabled={totalDisabledState}
        />
      </Grid>
    </Flex>
  );
};

export default ReverseSchema;
