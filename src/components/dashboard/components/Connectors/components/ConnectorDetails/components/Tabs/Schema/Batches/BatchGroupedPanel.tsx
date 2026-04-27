import { useMemo, useState } from "react";

import {
  Box,
  Button,
  Flex,
  IconButton,
  Skeleton,
  Text,
} from "@chakra-ui/react";

import { GoPlus } from "react-icons/go";
import { MdPlayArrow, MdRefresh } from "react-icons/md";

import { toaster } from "@/components/ui/toaster";
import {
  useFetchBatches,
  useRunBatchNow,
} from "@/queryOptions/connector/schema/useBatches";
import useRefreshSchema from "@/queryOptions/connector/schema/useRefreshSchema";
import { type UnassignedTable } from "@/types/connectors";

import BatchCard from "./BatchCard";
import BatchPickerModal from "./BatchPickerModal";
import NewBatchModal from "./NewBatchModal";

/** Merged row: API wins for `last_synced`; `pending_only` = not yet on server. */
type DisplayUnassignedRow = UnassignedTable & { pending_only?: boolean };

function mergeUnassigned(
  apiRows: UnassignedTable[],
  pendingRows: UnassignedTable[] | undefined,
): DisplayUnassignedRow[] {
  const map = new Map<string, DisplayUnassignedRow>();
  for (const u of apiRows) {
    map.set(u.table_name, { ...u, pending_only: false });
  }
  for (const p of pendingRows ?? []) {
    if (!map.has(p.table_name)) {
      map.set(p.table_name, { ...p, pending_only: true });
    }
  }
  return Array.from(map.values()).sort((a, b) => {
    const s = (a.sequence ?? 0) - (b.sequence ?? 0);
    if (s !== 0) return s;
    return a.table_name.localeCompare(b.table_name);
  });
}

interface BatchGroupedPanelProps {
  connectionId: number;
  /**
   * Tables the user checked on the left but not yet saved, or saved but not in any batch.
   * Merged under API `unassigned_tables` (API wins on duplicates).
   */
  pendingUnassignedTables?: UnassignedTable[];
}

const BatchGroupedPanel = ({
  connectionId,
  pendingUnassignedTables = [],
}: BatchGroupedPanelProps) => {
  const { data, isLoading } = useFetchBatches(connectionId);
  const { mutate: refreshSchema, isPending: isRefreshingSchema } =
    useRefreshSchema({ connectorId: connectionId });
  const { mutateAsync: runBatch } = useRunBatchNow(connectionId);

  const [isNewBatchOpen, setIsNewBatchOpen] = useState(false);
  const [pickerTables, setPickerTables] = useState<string[] | null>(null);
  const [isRunningAll, setIsRunningAll] = useState(false);

  const batches = useMemo(() => data?.batches ?? [], [data]);
  const apiUnassigned = useMemo<UnassignedTable[]>(
    () => data?.unassigned_tables ?? [],
    [data],
  );

  const displayUnassigned = useMemo(
    () => mergeUnassigned(apiUnassigned, pendingUnassignedTables),
    [apiUnassigned, pendingUnassignedTables],
  );

  const runnableBatches = useMemo(
    () =>
      batches.filter(
        (b) => b.status === "active" && (b.tables?.length ?? 0) > 0,
      ),
    [batches],
  );

  const showEmptyState =
    !isLoading && batches.length === 0 && displayUnassigned.length === 0;

  const handleRunAll = async () => {
    if (runnableBatches.length === 0) {
      toaster.warning({
        title: "Nothing to run",
        description: "No active batches with tables.",
      });
      return;
    }
    setIsRunningAll(true);
    const results = await Promise.allSettled(
      runnableBatches.map((b) => runBatch(b.id)),
    );
    setIsRunningAll(false);

    const ok = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.length - ok;
    if (ok > 0) {
      toaster.success({
        title: `Started ${ok} batch${ok === 1 ? "" : "es"}`,
      });
    }
    if (failed > 0) {
      toaster.error({
        title: `${failed} batch${failed === 1 ? "" : "es"} failed to start`,
      });
    }
  };

  const unassignedSection =
    displayUnassigned.length > 0 ? (
      <Box
        borderWidth={1}
        borderStyle="dashed"
        borderColor="gray.400"
        borderRadius="lg"
        bgColor="gray.50"
        overflow="hidden"
      >
        <Flex
          alignItems="center"
          gap={2}
          px={3}
          py={2}
          borderBottomWidth={1}
          borderColor="gray.200"
          borderStyle="dashed"
        >
          <Text fontSize="sm" fontWeight="semibold">
            Unassigned
          </Text>
          <Text fontSize="xs" color="gray.500">
            ({displayUnassigned.length})
          </Text>
          <Box flex="1" />
          {displayUnassigned.length > 1 && (
            <Button
              size="xs"
              variant="ghost"
              onClick={() =>
                setPickerTables(displayUnassigned.map((u) => u.table_name))
              }
            >
              Move all
            </Button>
          )}
        </Flex>
        <Flex direction="column" gap={1} p={2}>
          {displayUnassigned.map((t, index) => (
            <Flex
              key={t.table_name}
              alignItems="center"
              gap={2}
              bgColor={index % 2 === 0 ? "white" : "gray.100"}
              px={2}
              py={1.5}
              borderRadius="sm"
            >
              <Text fontSize="sm" flex="1" title={t.table_name}>
                {t.table_name}
              </Text>
              {t.pending_only && (
                <Text fontSize="xs" color="orange.600" whiteSpace="nowrap">
                  Save selection
                </Text>
              )}
              {t.last_synced && (
                <Text fontSize="xs" color="gray.500">
                  {t.last_synced}
                </Text>
              )}
              <IconButton
                aria-label={`Move ${t.table_name} to batch`}
                size="xs"
                variant="outline"
                onClick={() => setPickerTables([t.table_name])}
              >
                <GoPlus />
              </IconButton>
            </Flex>
          ))}
        </Flex>
      </Box>
    ) : null;

  return (
    <>
      <Flex
        direction="column"
        borderWidth={1}
        borderColor="gray.300"
        borderRadius="lg"
        bgColor="white"
        minH="200px"
        overflow="hidden"
      >
        {/* Header */}
        <Flex
          justifyContent="space-between"
          alignItems="center"
          px={4}
          py={3}
          borderBottomWidth={1}
          borderColor="gray.200"
        >
          <Text fontSize="sm" fontWeight="semibold">
            Migration Batches
            {batches.length > 0 && (
              <Text as="span" ml={2} color="gray.500" fontWeight="normal">
                ({batches.length})
              </Text>
            )}
          </Text>
          <Flex gap={2}>
            <Button
              size="xs"
              variant="outline"
              onClick={() => refreshSchema()}
              loading={isRefreshingSchema}
            >
              <MdRefresh />
              Refresh schema
            </Button>
            <Button
              size="xs"
              colorPalette="brand"
              variant="outline"
              onClick={handleRunAll}
              loading={isRunningAll}
              disabled={runnableBatches.length === 0}
            >
              <MdPlayArrow />
              Run all now
            </Button>
          </Flex>
        </Flex>

        {/* Body: Unassigned first, then batch cards */}
        <Flex
          direction="column"
          gap={3}
          p={3}
          overflowY="auto"
          flex="1"
          maxH="70vh"
        >
          {isLoading && (
            <>
              <Skeleton height={16} />
              <Skeleton height={16} />
              <Skeleton height={16} />
            </>
          )}

          {showEmptyState && (
            <Flex
              direction="column"
              alignItems="center"
              gap={2}
              color="gray.600"
              py={10}
            >
              <Text fontSize="sm">No tables selected yet.</Text>
              <Text fontSize="xs">
                Pick tables in the schema list to get started.
              </Text>
            </Flex>
          )}

          {!isLoading && unassignedSection}

          {!isLoading &&
            batches.map((b) => (
              <BatchCard key={b.id} batch={b} connectionId={connectionId} />
            ))}
        </Flex>

        {/* Sticky footer */}
        <Flex
          justifyContent="center"
          borderTopWidth={1}
          borderColor="gray.200"
          p={2}
          bgColor="white"
        >
          <Button
            size="sm"
            colorPalette="brand"
            variant="outline"
            onClick={() => setIsNewBatchOpen(true)}
          >
            <GoPlus />
            New batch
          </Button>
        </Flex>
      </Flex>

      <NewBatchModal
        open={isNewBatchOpen}
        onClose={() => setIsNewBatchOpen(false)}
        connectionId={connectionId}
        defaultName={`Batch ${batches.length + 1}`}
      />

      <BatchPickerModal
        open={!!pickerTables && pickerTables.length > 0}
        onClose={() => setPickerTables(null)}
        connectionId={connectionId}
        tables={pickerTables ?? []}
        batches={batches}
      />
    </>
  );
};

export default BatchGroupedPanel;
