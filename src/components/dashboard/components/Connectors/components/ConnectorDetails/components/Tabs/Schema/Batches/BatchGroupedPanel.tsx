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

import { useFetchBatches } from "@/queryOptions/connector/schema/useBatches";
import { type UnassignedTable } from "@/types/connectors";

import BatchCard from "./BatchCard";
import BatchPickerModal from "./BatchPickerModal";
import NewBatchModal from "./NewBatchModal";

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
  pendingUnassignedTables?: UnassignedTable[];
}

const BatchGroupedPanel = ({
  connectionId,
  pendingUnassignedTables = [],
}: BatchGroupedPanelProps) => {
  const { data, isLoading, isFetching } = useFetchBatches(connectionId);

  const [isNewBatchOpen, setIsNewBatchOpen] = useState(false);
  const [pickerTables, setPickerTables] = useState<string[] | null>(null);

  const batches = useMemo(() => data?.batches ?? [], [data]);
  const apiUnassigned = useMemo<UnassignedTable[]>(
    () => data?.unassigned_tables ?? [],
    [data],
  );

  const displayUnassigned = useMemo(
    () => mergeUnassigned(apiUnassigned, pendingUnassignedTables),
    [apiUnassigned, pendingUnassignedTables],
  );

  const showEmptyState =
    !isLoading &&
    !isFetching &&
    batches.length === 0 &&
    displayUnassigned.length === 0;

  const unassignedSection =
    displayUnassigned.length > 0 ? (
      <Box
        borderWidth={1}
        borderStyle="dashed"
        borderColor="gray.400"
        borderRadius="lg"
        bgColor="gray.50"
        display="flex"
        flexDirection="column"
        maxH="44vh"
        minH={0}
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
        <Flex
          direction="column"
          gap={1}
          p={2}
          flex="1"
          minH={0}
          overflowY="auto"
        >
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
        maxH="72vh"
        minW={0}
        overflow="hidden"
      >
        <Flex
          justifyContent="space-between"
          alignItems="center"
          px={4}
          py={3}
          borderBottomWidth={1}
          borderColor="gray.200"
          flexShrink={0}
        >
          <Text fontSize="sm" fontWeight="semibold">
            Migration Batches
            {batches.length > 0 && (
              <Text as="span" ml={2} color="gray.500" fontWeight="normal">
                ({batches.length})
              </Text>
            )}
          </Text>
        </Flex>

        <Flex
          direction="column"
          gap={3}
          p={3}
          overflowY="auto"
          flex="1"
          minH={0}
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

        <Flex
          direction="column"
          alignItems="center"
          gap={1}
          borderTopWidth={1}
          borderColor="gray.200"
          p={2}
          bgColor="white"
          flexShrink={0}
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
          <Text fontSize="xs" color="gray.500" textAlign="center" px={2}>
            Open Scheduling to build task chains and set cron on the root batch.
          </Text>
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
