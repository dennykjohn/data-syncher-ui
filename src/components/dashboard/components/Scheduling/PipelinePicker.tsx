import { Fragment, useMemo } from "react";

import { Box, Button, Flex, Menu, Portal, Text } from "@chakra-ui/react";

import { MdDriveFileRenameOutline, MdExpandMore } from "react-icons/md";

import { Tooltip } from "@/components/ui/tooltip";
import { type PipelineDetail } from "@/types/pipeline";

type PipelinePickerProps = {
  pipelines: PipelineDetail[];
  selectedPipelineId: number | null;
  onSelect: (_pipelineId: number) => void;
  /** Prefetch runs when hovering a pipeline in the menu. */
  onPipelineHover?: (_pipelineId: number) => void;
  onRename?: () => void;
  renameDisabled?: boolean;
  /** Trigger button width; grows up to maxWidth for long names. */
  width?: string | number;
  maxWidth?: string | number;
};

type PipelineListGroup = "running" | "active" | "paused";

const SECTION_LABELS: Record<PipelineListGroup, string> = {
  running: "Running now",
  active: "Active",
  paused: "Paused",
};

const DEFAULT_WIDTH = "min(420px, 48vw)";
const DEFAULT_MAX_WIDTH = "min(520px, 60vw)";
const MENU_MIN_WIDTH = "360px";

export const isPipelineRunning = (pipeline: PipelineDetail) =>
  pipeline.latest_run_status === "running";

export const getPipelineListGroup = (
  pipeline: PipelineDetail,
): PipelineListGroup => {
  if (isPipelineRunning(pipeline)) return "running";
  if (pipeline.status === "paused") return "paused";
  return "active";
};

const GROUP_ORDER: Record<PipelineListGroup, number> = {
  running: 0,
  active: 1,
  paused: 2,
};

export const sortPipelinesForPicker = (
  pipelines: PipelineDetail[],
): PipelineDetail[] =>
  [...pipelines].sort((a, b) => {
    const groupDiff =
      GROUP_ORDER[getPipelineListGroup(a)] -
      GROUP_ORDER[getPipelineListGroup(b)];
    if (groupDiff !== 0) return groupDiff;
    return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
  });

/** Green/orange dot = schedule enabled (Active) or schedule paused (Paused). */
const ScheduleStatusDot = ({ paused }: { paused: boolean }) => (
  <Box
    as="span"
    w="6px"
    h="6px"
    borderRadius="full"
    flexShrink={0}
    bg={paused ? "orange.500" : "green.600"}
    title={paused ? "Schedule paused" : "Schedule active"}
  />
);

const PulsingLiveDot = () => (
  <Box
    as="span"
    position="relative"
    w="7px"
    h="7px"
    flexShrink={0}
    display="inline-block"
  >
    <Box
      as="span"
      position="absolute"
      inset={0}
      borderRadius="full"
      bg="blue.400"
      opacity={0.45}
      css={{
        animation: "pipelineLivePing 1.4s cubic-bezier(0, 0, 0.2, 1) infinite",
        "@keyframes pipelineLivePing": {
          "0%, 100%": { transform: "scale(1)", opacity: 0.45 },
          "50%": { transform: "scale(1.85)", opacity: 0 },
        },
      }}
    />
    <Box
      as="span"
      position="absolute"
      inset="1px"
      borderRadius="full"
      bg="blue.500"
      boxShadow="0 0 0 1px rgba(59, 130, 246, 0.35)"
    />
  </Box>
);

/** Execution in progress — separate from schedule Active/Paused. */
const RunningLiveBadge = ({ compact = false }: { compact?: boolean }) => (
  <Flex
    alignItems="center"
    gap={1}
    px={compact ? 1.25 : 1.5}
    py={0.5}
    borderRadius="full"
    bg="blue.50"
    borderWidth="1px"
    borderColor="blue.200"
    flexShrink={0}
    title="Flow execution in progress"
    css={{
      animation: "pipelineLiveGlow 2.2s ease-in-out infinite",
      "@keyframes pipelineLiveGlow": {
        "0%, 100%": { boxShadow: "0 0 0 0 rgba(59, 130, 246, 0)" },
        "50%": { boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.12)" },
      },
    }}
  >
    <PulsingLiveDot />
    <Text
      as="span"
      fontSize="2xs"
      fontWeight="semibold"
      color="blue.700"
      letterSpacing="0.04em"
      textTransform="uppercase"
    >
      Live
    </Text>
  </Flex>
);

const ScheduleStatusLabel = ({ paused }: { paused: boolean }) => (
  <Text
    as="span"
    fontSize="2xs"
    color={paused ? "orange.700" : "green.700"}
    flexShrink={0}
    w="48px"
    textAlign="right"
    letterSpacing="0.02em"
    title={paused ? "Schedule paused" : "Schedule active"}
  >
    {paused ? "Paused" : "Active"}
  </Text>
);

const PipelineRightStatus = ({
  pipeline,
  showScheduleLabel = true,
}: {
  pipeline: PipelineDetail;
  showScheduleLabel?: boolean;
}) => {
  if (isPipelineRunning(pipeline)) {
    return <RunningLiveBadge />;
  }
  if (!showScheduleLabel) return null;
  return <ScheduleStatusLabel paused={pipeline.status === "paused"} />;
};

const PipelinePicker = ({
  pipelines,
  selectedPipelineId,
  onSelect,
  onPipelineHover,
  onRename,
  renameDisabled = false,
  width = DEFAULT_WIDTH,
  maxWidth = DEFAULT_MAX_WIDTH,
}: PipelinePickerProps) => {
  const selected = pipelines.find((p) => p.id === selectedPipelineId) ?? null;
  const selectedPaused = selected?.status === "paused";
  const selectedRunning = selected ? isPipelineRunning(selected) : false;
  const scheduleHint = selectedPaused ? "Schedule paused" : "Schedule active";

  const groupedPipelines = useMemo(() => {
    const sorted = sortPipelinesForPicker(pipelines);
    const sections: Array<{
      key: PipelineListGroup;
      label: string;
      items: PipelineDetail[];
    }> = [];

    for (const pipeline of sorted) {
      const key = getPipelineListGroup(pipeline);
      const last = sections[sections.length - 1];
      if (!last || last.key !== key) {
        sections.push({ key, label: SECTION_LABELS[key], items: [pipeline] });
      } else {
        last.items.push(pipeline);
      }
    }

    return sections;
  }, [pipelines]);

  const triggerButton = (
    <Button
      size="sm"
      variant="outline"
      width={width}
      maxW={maxWidth}
      minW="220px"
      flexShrink={1}
      justifyContent="space-between"
      fontWeight="normal"
      px={2.5}
      h="32px"
      bg={selectedRunning ? "blue.50" : "white"}
      borderColor={selectedRunning ? "blue.300" : "gray.200"}
      borderRadius="md"
      color="gray.800"
      _hover={{
        bg: selectedRunning ? "blue.100" : "gray.50",
        borderColor: selectedRunning ? "blue.400" : "gray.300",
      }}
      _expanded={{
        bg: selectedRunning ? "blue.100" : "gray.50",
        borderColor: selectedRunning ? "blue.400" : "gray.400",
      }}
    >
      <Flex alignItems="center" gap={2} minW={0} flex="1">
        {selected && <ScheduleStatusDot paused={selectedPaused} />}
        <Text
          truncate
          fontSize="sm"
          color={selected ? "gray.800" : "gray.500"}
          flex="1"
          minW={0}
          textAlign="left"
        >
          {selected?.name ?? "Select pipeline…"}
        </Text>
        {selected && (
          <PipelineRightStatus pipeline={selected} showScheduleLabel={false} />
        )}
      </Flex>
      <Box
        as="span"
        color="gray.400"
        display="inline-flex"
        flexShrink={0}
        ml={1}
      >
        <MdExpandMore size={18} />
      </Box>
    </Button>
  );

  return (
    <Menu.Root positioning={{ sameWidth: true }}>
      <Menu.Trigger asChild>
        {selected ? (
          <Tooltip
            content={
              <Box maxW="420px" wordBreak="break-word">
                <Text fontWeight="medium">{selected.name}</Text>
                <Text fontSize="xs" color="gray.300" mt={0.5}>
                  {scheduleHint}
                  {selectedRunning ? " · Run in progress" : ""}
                </Text>
              </Box>
            }
            openDelay={400}
            showArrow
          >
            <Box as="span" display="inline-flex" minW={0} maxW={maxWidth}>
              {triggerButton}
            </Box>
          </Tooltip>
        ) : (
          triggerButton
        )}
      </Menu.Trigger>
      <Portal>
        <Menu.Positioner>
          <Menu.Content
            minW={MENU_MIN_WIDTH}
            maxW={DEFAULT_MAX_WIDTH}
            maxH="360px"
            overflowY="auto"
            py={1}
            bg="white"
            borderWidth={1}
            borderColor="gray.200"
            borderRadius="md"
            boxShadow="sm"
          >
            <Menu.Item
              value="__none__"
              onClick={() => onSelect(null)}
              px={3}
              py={2}
              color="gray.500"
              fontSize="sm"
              _highlighted={{ bg: "gray.50" }}
            >
              Select pipeline…
            </Menu.Item>
            {groupedPipelines.map((section, sectionIndex) => (
              <Fragment key={section.key}>
                {sectionIndex > 0 && (
                  <Box
                    mx={3}
                    my={1}
                    borderTopWidth="1px"
                    borderColor="gray.100"
                  />
                )}
                <Box px={3} pt={sectionIndex === 0 ? 1 : 2} pb={1}>
                  <Text
                    fontSize="2xs"
                    fontWeight="semibold"
                    color={section.key === "running" ? "blue.600" : "gray.500"}
                    textTransform="uppercase"
                    letterSpacing="0.08em"
                  >
                    {section.label}
                  </Text>
                </Box>
                {section.items.map((p) => {
                  const isSelected = p.id === selectedPipelineId;
                  const paused = p.status === "paused";
                  const running = isPipelineRunning(p);
                  return (
                    <Menu.Item
                      key={p.id}
                      value={String(p.id)}
                      onClick={() => onSelect(p.id)}
                      onMouseEnter={() => onPipelineHover?.(p.id)}
                      px={3}
                      py={2}
                      bg={
                        isSelected
                          ? running
                            ? "blue.50"
                            : "gray.50"
                          : undefined
                      }
                      borderLeftWidth="2px"
                      borderLeftColor={
                        isSelected
                          ? "gray.700"
                          : running
                            ? "blue.400"
                            : "transparent"
                      }
                      _highlighted={{ bg: running ? "blue.50" : "gray.50" }}
                    >
                      <Flex
                        alignItems="flex-start"
                        justifyContent="space-between"
                        gap={3}
                        w="100%"
                        minW={0}
                      >
                        <Flex alignItems="flex-start" gap={2} minW={0} flex="1">
                          <Box pt="5px">
                            <ScheduleStatusDot paused={paused} />
                          </Box>
                          <Text
                            fontSize="sm"
                            fontWeight={isSelected ? "medium" : "normal"}
                            color="gray.800"
                            whiteSpace="normal"
                            wordBreak="break-word"
                            lineHeight="short"
                          >
                            {p.name}
                          </Text>
                        </Flex>
                        <Box pt="2px" flexShrink={0}>
                          <PipelineRightStatus pipeline={p} />
                        </Box>
                      </Flex>
                    </Menu.Item>
                  );
                })}
              </Fragment>
            ))}
            {onRename && selected && (
              <>
                <Box
                  mx={3}
                  my={1}
                  borderTopWidth="1px"
                  borderColor="gray.100"
                />
                <Menu.Item
                  value="__rename__"
                  onClick={onRename}
                  disabled={renameDisabled}
                  px={3}
                  py={2.5}
                  color="gray.700"
                  _highlighted={{ bg: "gray.50" }}
                  _disabled={{ opacity: 0.5, cursor: "not-allowed" }}
                >
                  <Flex alignItems="center" gap={2} minW={0}>
                    <Box
                      as="span"
                      color="gray.500"
                      display="inline-flex"
                      flexShrink={0}
                    >
                      <MdDriveFileRenameOutline size={16} />
                    </Box>
                    <Text fontSize="sm" fontWeight="medium" flexShrink={0}>
                      Rename pipeline
                    </Text>
                    <Text
                      fontSize="xs"
                      color="gray.500"
                      truncate
                      minW={0}
                      title={selected.name}
                    >
                      · {selected.name}
                    </Text>
                  </Flex>
                </Menu.Item>
              </>
            )}
          </Menu.Content>
        </Menu.Positioner>
      </Portal>
    </Menu.Root>
  );
};

export default PipelinePicker;
