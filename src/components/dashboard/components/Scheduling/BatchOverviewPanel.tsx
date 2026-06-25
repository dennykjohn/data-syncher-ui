import { useMemo, useState } from "react";

import {
  Badge,
  Box,
  Button,
  Flex,
  IconButton,
  Skeleton,
  Text,
} from "@chakra-ui/react";

import { MdClose, MdPlayArrow } from "react-icons/md";

import { toaster } from "@/components/ui/toaster";
import { useFetchBatchDetail } from "@/queryOptions/connector/schema/useBatches";
import {
  usePatchPipeline,
  useRunPipeline,
  useUpdatePipelineNode,
} from "@/queryOptions/pipeline/usePipeline";
import { type PipelineDetail } from "@/types/pipeline";

import ScheduleEditor from "./ScheduleEditor";
import { computeRootNodeIds, getParentBatchName } from "./pipelineLayout";
import {
  type ScheduleValue,
  fromPipelineSchedule,
  pipelineScheduleLabel,
  toApiSchedule,
} from "./scheduleOptions";

type BatchOverviewPanelProps = {
  pipeline: PipelineDetail;
  nodeId: number;
  connectionId: number;
  batchId: number;
  connectionName: string;
  onClose: () => void;
};

const BatchOverviewPanel = ({
  pipeline,
  nodeId,
  connectionId,
  batchId,
  connectionName,
  onClose,
}: BatchOverviewPanelProps) => {
  const { data: batch, isLoading } = useFetchBatchDetail(connectionId, batchId);
  const patchPipeline = usePatchPipeline(pipeline.id);
  const updateNode = useUpdatePipelineNode(pipeline.id);
  const runPipeline = useRunPipeline();

  const rootNodeIds = useMemo(
    () =>
      pipeline.root_node_ids ??
      computeRootNodeIds(pipeline.nodes, pipeline.edges),
    [pipeline],
  );
  const isRoot = rootNodeIds.includes(nodeId);
  const parentBatchName = useMemo(
    () => getParentBatchName(nodeId, pipeline.nodes, pipeline.edges),
    [nodeId, pipeline.nodes, pipeline.edges],
  );

  const pipelineNode = pipeline.nodes.find((n) => n.id === nodeId);

  const [scheduleDraft, setScheduleDraft] = useState<ScheduleValue>(() => {
    const base = fromPipelineSchedule(pipeline);
    return {
      ...base,
      execution_order: pipelineNode?.execution_order ?? "parallel",
    };
  });

  const handleSaveSchedule = async () => {
    try {
      const apiSchedule = toApiSchedule(scheduleDraft);
      await patchPipeline.mutateAsync({
        ...apiSchedule,
        sync_start_date: scheduleDraft.sync_start_date,
      });
      if (
        pipelineNode &&
        scheduleDraft.execution_order !== pipelineNode.execution_order
      ) {
        await updateNode.mutateAsync({
          nodeId,
          payload: { execution_order: scheduleDraft.execution_order },
        });
      }
      toaster.success({ title: "Pipeline schedule saved" });
    } catch {
      toaster.error({ title: "Could not save schedule" });
    }
  };

  const handleRunPipeline = async () => {
    try {
      const result = await runPipeline.mutateAsync(pipeline.id);
      toaster.success({
        title: "Pipeline started",
        description: result.message,
      });
    } catch {
      toaster.error({ title: "Failed to run pipeline" });
    }
  };

  const scheduleSummary = pipelineScheduleLabel(pipeline);
  const pipelinePaused = pipeline.status === "paused";

  return (
    <Flex
      direction="column"
      h="100%"
      borderWidth={1}
      borderRadius="lg"
      bg="white"
      overflow="hidden"
      minH={0}
    >
      <Flex
        alignItems="center"
        justifyContent="space-between"
        px={4}
        py={3}
        borderBottomWidth={1}
        borderColor="gray.200"
        flexShrink={0}
      >
        <Text fontSize="sm" fontWeight="semibold">
          Batch overview
        </Text>
        <IconButton
          aria-label="Close overview"
          size="xs"
          variant="ghost"
          onClick={onClose}
        >
          <MdClose />
        </IconButton>
      </Flex>

      <Box flex="1" overflowY="auto" p={4} minH={0}>
        {isLoading && (
          <Flex direction="column" gap={3}>
            <Skeleton height={6} />
            <Skeleton height={4} />
            <Skeleton height={24} />
          </Flex>
        )}

        {!isLoading && batch && (
          <Flex direction="column" gap={4}>
            <Box>
              <Text fontSize="lg" fontWeight="bold">
                {batch.name}
              </Text>
              <Text fontSize="sm" color="gray.600" mt={1}>
                {connectionName}
              </Text>
            </Box>

            <Flex gap={2} flexWrap="wrap">
              {isRoot ? (
                <Badge colorPalette="purple" variant="subtle">
                  Root task
                </Badge>
              ) : (
                <Badge colorPalette="gray" variant="subtle">
                  After: {parentBatchName ?? "parent"}
                </Badge>
              )}
              <Badge colorPalette="gray" variant="subtle">
                {batch.table_count} table{batch.table_count === 1 ? "" : "s"}
              </Badge>
              <Badge
                colorPalette={
                  (pipelineNode?.execution_order ?? batch.execution_order) ===
                  "sequential"
                    ? "orange"
                    : "blue"
                }
                variant="subtle"
              >
                {pipelineNode?.execution_order ?? batch.execution_order}
              </Badge>
              {pipelinePaused && (
                <Badge colorPalette="orange" variant="subtle">
                  Pipeline paused
                </Badge>
              )}
            </Flex>

            {isRoot ? (
              <Flex direction="column" gap={3}>
                <Box>
                  <Text
                    fontSize="xs"
                    color="gray.500"
                    textTransform="uppercase"
                    mb={1}
                  >
                    Pipeline schedule (root cron)
                  </Text>
                  <Text fontSize="sm" fontWeight="medium">
                    {scheduleSummary || "Not configured"}
                  </Text>
                </Box>
                <ScheduleEditor
                  value={scheduleDraft}
                  onChange={setScheduleDraft}
                  disabled={pipelinePaused}
                />
                <Button
                  size="sm"
                  colorPalette="brand"
                  onClick={handleSaveSchedule}
                  loading={patchPipeline.isPending || updateNode.isPending}
                  disabled={pipelinePaused}
                >
                  Save schedule
                </Button>
              </Flex>
            ) : (
              <Box
                borderWidth={1}
                borderColor="gray.200"
                borderRadius="md"
                p={3}
                bg="gray.50"
              >
                <Text fontSize="sm" color="gray.700">
                  Runs after{" "}
                  <Text as="span" fontWeight="semibold">
                    {parentBatchName ?? "parent batch"}
                  </Text>{" "}
                  completes. Schedule is set on the pipeline root task only.
                </Text>
              </Box>
            )}

            <Flex direction="column" gap={2} minH={0}>
              <Text fontSize="xs" color="gray.500" textTransform="uppercase">
                Tables
              </Text>
              {batch.tables.length === 0 ? (
                <Text fontSize="sm" color="gray.500">
                  No tables in this batch.
                </Text>
              ) : (
                <Box
                  borderWidth={1}
                  borderColor="gray.200"
                  borderRadius="md"
                  maxH="220px"
                  overflowY="auto"
                >
                  {batch.tables
                    .slice()
                    .sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0))
                    .map((t, index) => (
                      <Flex
                        key={t.table_name}
                        px={3}
                        py={2}
                        gap={2}
                        alignItems="center"
                        bg={index % 2 === 0 ? "gray.50" : "white"}
                        borderBottomWidth={
                          index < batch.tables.length - 1 ? 1 : 0
                        }
                        borderColor="gray.100"
                      >
                        <Text fontSize="sm" flex="1" title={t.table_name}>
                          {t.table_name}
                        </Text>
                        {t.last_synced && (
                          <Text
                            fontSize="xs"
                            color="gray.500"
                            whiteSpace="nowrap"
                          >
                            {t.last_synced}
                          </Text>
                        )}
                      </Flex>
                    ))}
                </Box>
              )}
            </Flex>

            <Button
              size="sm"
              colorPalette="brand"
              onClick={handleRunPipeline}
              loading={runPipeline.isPending}
              disabled={pipeline.nodes.length === 0}
            >
              <MdPlayArrow />
              Run pipeline now
            </Button>
          </Flex>
        )}
      </Box>
    </Flex>
  );
};

export default BatchOverviewPanel;
