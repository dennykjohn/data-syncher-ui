import { useEffect, useState } from "react";

import { Box, Button, Text } from "@chakra-ui/react";

import { toaster } from "@/components/ui/toaster";
import { usePatchPipeline } from "@/queryOptions/pipeline/usePipeline";
import { type PipelineDetail } from "@/types/pipeline";

import ScheduleEditor from "./ScheduleEditor";
import {
  type ScheduleValue,
  fromPipelineSchedule,
  pipelineScheduleLabel,
  toApiSchedule,
  weeklySelectionValid,
} from "./scheduleOptions";

type BatchSchedulePanelProps = {
  pipeline: PipelineDetail;
  disabled?: boolean;
  embedded?: boolean;
};

const BatchSchedulePanel = ({
  pipeline,
  disabled = false,
  embedded = false,
}: BatchSchedulePanelProps) => {
  const patchPipeline = usePatchPipeline(pipeline.id);

  const [scheduleDraft, setScheduleDraft] = useState<ScheduleValue>(() =>
    fromPipelineSchedule(pipeline),
  );

  const scheduleSummary = pipelineScheduleLabel(pipeline);

  useEffect(() => {
    setScheduleDraft(fromPipelineSchedule(pipeline));
  }, [pipeline]);

  const handleSaveSchedule = async () => {
    if (!weeklySelectionValid(scheduleDraft)) {
      toaster.error({ title: "Select at least one day for weekly schedule" });
      return;
    }
    try {
      const apiSchedule = toApiSchedule(scheduleDraft);
      await patchPipeline.mutateAsync({
        ...apiSchedule,
        sync_start_date: scheduleDraft.sync_start_date,
        sync_end_date:
          scheduleDraft.end_mode === "on_date"
            ? scheduleDraft.sync_end_date
            : null,
      });
      toaster.success({ title: "Pipeline schedule saved" });
    } catch {
      toaster.error({ title: "Could not save schedule" });
    }
  };

  return (
    <Box>
      {!embedded && (
        <>
          <Text
            fontSize="2xs"
            color="gray.500"
            textTransform="uppercase"
            mb={1}
          >
            Current schedule
          </Text>
          <Text fontSize="sm" fontWeight="medium" color="gray.800" mb={3}>
            {scheduleSummary || "Not configured"}
          </Text>
        </>
      )}
      {embedded && scheduleSummary && (
        <Text fontSize="xs" color="brand.700" fontWeight="medium" mb={2}>
          Active: {scheduleSummary}
        </Text>
      )}
      <ScheduleEditor
        value={scheduleDraft}
        onChange={setScheduleDraft}
        disabled={disabled}
        showExecutionMode={false}
      />
      <Button
        size="sm"
        colorPalette="brand"
        mt={embedded ? 3 : 4}
        w="full"
        onClick={handleSaveSchedule}
        loading={patchPipeline.isPending}
        disabled={disabled}
      >
        Save schedule
      </Button>
    </Box>
  );
};

export default BatchSchedulePanel;
