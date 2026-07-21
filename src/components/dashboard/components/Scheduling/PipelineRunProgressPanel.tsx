import { Badge, Box, Flex, Progress, Text } from "@chakra-ui/react";

import { type PipelineRunDetail } from "@/types/pipeline";

import {
  computeNodeProgress,
  computeTableProgress,
  pipelineStatusColor,
  resolvePipelineRunStatus,
} from "./pipelineRunHelpers";

type PipelineRunProgressPanelProps = {
  run: PipelineRunDetail;
};

type RunMetricProgressProps = {
  label: string;
  value: number;
  completed: number;
  total: number;
  colorPalette: string;
  animated?: boolean;
  barHeight?: string;
};

const RunMetricProgress = ({
  label,
  value,
  completed,
  total,
  colorPalette,
  animated = false,
  barHeight = "6px",
}: RunMetricProgressProps) => (
  <Flex alignItems="center" gap={2}>
    <Text
      fontSize="2xs"
      fontWeight="medium"
      color="gray.500"
      w="40px"
      flexShrink={0}
      textTransform="uppercase"
      letterSpacing="wider"
    >
      {label}
    </Text>
    <Box flex="1" minW={0}>
      <Progress.Root
        value={value}
        variant="outline"
        shape="full"
        colorPalette={colorPalette}
        striped={animated}
        animated={animated}
      >
        <Progress.Track
          h={barHeight}
          bg="white"
          borderWidth="1px"
          borderColor="gray.200"
          boxShadow="inset 0 1px 2px rgba(15, 23, 42, 0.06)"
        >
          <Progress.Range
            borderRadius="full"
            boxShadow="0 1px 2px rgba(15, 23, 42, 0.12)"
          />
        </Progress.Track>
      </Progress.Root>
    </Box>
    <Text
      fontSize="2xs"
      fontWeight="medium"
      color="gray.600"
      w="36px"
      flexShrink={0}
      textAlign="right"
      fontVariantNumeric="tabular-nums"
    >
      {completed}/{total}
    </Text>
  </Flex>
);

const PipelineRunProgressPanel = ({ run }: PipelineRunProgressPanelProps) => {
  const { overall } = run;
  const displayStatus = resolvePipelineRunStatus(run);
  const nodeProgress = computeNodeProgress(overall);
  const tableProgress = computeTableProgress(overall);
  const statusColor = pipelineStatusColor(displayStatus);
  const isRunning =
    displayStatus === "running" || displayStatus === "in_progress";

  const activeNodeIds = run.current_node_ids?.length
    ? run.current_node_ids
    : run.current_node_id !== null && run.current_node_id !== undefined
      ? [run.current_node_id]
      : [];
  const runningNodes = run.nodes.filter((n) =>
    activeNodeIds.includes(n.node_id),
  );
  const runningLabel =
    isRunning && runningNodes.length
      ? runningNodes.map((n) => n.batch_name).join(", ")
      : null;

  return (
    <Box
      borderWidth={1}
      borderColor="gray.200"
      borderRadius="md"
      px={3}
      py={2.5}
      bg="gray.50"
    >
      <Flex alignItems="center" justifyContent="space-between" gap={3} mb={2}>
        <Flex alignItems="center" gap={2} minW={0} flexWrap="wrap">
          <Text
            fontSize="xs"
            fontWeight="semibold"
            color="gray.700"
            flexShrink={0}
          >
            Run #{run.pipeline_run_id}
          </Text>
          <Badge
            colorPalette={statusColor}
            size="sm"
            variant="subtle"
            flexShrink={0}
          >
            {displayStatus}
          </Badge>
          {runningLabel && (
            <Text
              fontSize="2xs"
              color="gray.600"
              truncate
              maxW="320px"
              title={runningLabel}
            >
              Running: {runningLabel}
            </Text>
          )}
        </Flex>
        <Text
          fontSize="2xs"
          color="gray.500"
          flexShrink={0}
          fontVariantNumeric="tabular-nums"
        >
          {overall.nodes_completed}/{overall.nodes_total} nodes ·{" "}
          {overall.tables_completed + (overall.tables_failed ?? 0)}/
          {overall.tables_total} tables
          {(overall.tables_failed ?? 0) > 0
            ? ` (${overall.tables_failed} failed)`
            : ""}
        </Text>
      </Flex>

      <Flex direction="column" gap={1.5}>
        <RunMetricProgress
          label="Nodes"
          value={nodeProgress}
          completed={overall.nodes_completed}
          total={overall.nodes_total}
          colorPalette={statusColor}
          animated={isRunning}
        />
        {overall.tables_total > 0 && (
          <RunMetricProgress
            label="Tables"
            value={tableProgress}
            completed={overall.tables_completed}
            total={overall.tables_total}
            colorPalette="blue"
            animated={isRunning}
            barHeight="5px"
          />
        )}
      </Flex>

      {run.error && (
        <Text fontSize="2xs" color="red.600" mt={2} truncate title={run.error}>
          Node error: {run.error} - click Execution logs for details
        </Text>
      )}
    </Box>
  );
};

export default PipelineRunProgressPanel;
