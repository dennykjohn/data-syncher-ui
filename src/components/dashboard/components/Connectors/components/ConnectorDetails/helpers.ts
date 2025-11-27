import { format, isValid } from "date-fns";

import { dateTimeFormat } from "@/constants/common";

type StatusParams = {
  isUpdateSchemaInProgress: number;
  isRefreshSchemaInProgress: number;
  isAnyOperationInProgress: boolean;
  next_sync_time?: string | null;
  time_frequency: string;
  // allow passing alternate format but default to project constant
  dateTimeFmt?: string;
  // Schema status from update-schema-status API
  schemaStatusData?: {
    is_in_progress?: boolean;
    status?: string; // e.g., "Migration started"
    current_job?: {
      job_name: string;
      task_id: string;
      status: string;
      migration_session_id: number;
      connection_name: string | null;
      created_at: string;
      updated_at: string;
    } | null;
    celery_task_status?: {
      state: string;
      ready: boolean;
      successful: boolean | null;
      failed: boolean | null;
    };
  } | null;
};

export const formatTimeFrequency = (freq: string) => {
  const freqNum = Number(freq);
  if (isNaN(freqNum) || freqNum <= 0) {
    return "None";
  }
  if (freqNum >= 60) {
    const hours = Math.floor(freqNum / 60);
    const minutes = freqNum % 60;
    return minutes === 0
      ? `${hours} ${hours === 1 ? "hr" : "hrs"}`
      : `${hours} ${hours === 1 ? "hr" : "hrs"} ${minutes} ${minutes === 1 ? "min" : "mins"}`;
  }
  return `${freqNum} ${freqNum === 1 ? "minute" : "minutes"}`;
};

/**
 * Get status message from schema status data
 * Returns the formatted message if schema is in progress, null otherwise
 */
export const getSchemaStatusMessage = (
  schemaStatusData?: StatusParams["schemaStatusData"],
): string | null => {
  const isInProgress =
    schemaStatusData?.is_in_progress === true ||
    schemaStatusData?.status === "Migration started" ||
    (schemaStatusData?.current_job?.status &&
      schemaStatusData.current_job.status !== "completed" &&
      schemaStatusData.current_job.status !== "failed");

  if (isInProgress) {
    return schemaStatusData?.current_job?.job_name
      ? `Fetching tables... (${schemaStatusData.current_job.job_name})`
      : schemaStatusData?.status || "Fetching tables...";
  }
  return null;
};

/**
 * Check if schema status is in progress
 */
export const isSchemaStatusInProgress = (
  schemaStatusData?: StatusParams["schemaStatusData"],
): boolean => {
  return !!(
    schemaStatusData?.is_in_progress === true ||
    schemaStatusData?.status === "Migration started" ||
    (schemaStatusData?.current_job?.status &&
      schemaStatusData.current_job.status !== "completed" &&
      schemaStatusData.current_job.status !== "failed")
  );
};

export const getStatusMessage = ({
  isUpdateSchemaInProgress,
  isRefreshSchemaInProgress,
  isAnyOperationInProgress,
  next_sync_time,
  time_frequency,
  dateTimeFmt,
  schemaStatusData,
}: StatusParams) => {
  // Check schema status first (highest priority)
  const schemaStatusMessage = getSchemaStatusMessage(schemaStatusData);
  if (schemaStatusMessage) {
    return schemaStatusMessage;
  }

  if (isUpdateSchemaInProgress > 0) {
    return "Updating schema...";
  }
  if (isRefreshSchemaInProgress > 0) {
    return "Refreshing schema...";
  }
  if (isAnyOperationInProgress) {
    return "Sync in progress";
  }
  if (next_sync_time) {
    const date = new Date(next_sync_time);
    if (isValid(date)) {
      const fmt = dateTimeFmt ?? dateTimeFormat;
      const formattedDate = format(date, fmt);
      return `Next Sync at: ${formattedDate}`;
    } else {
      console.error("Invalid next_sync_time format:", next_sync_time);
      return `Next Sync in: ${formatTimeFrequency(time_frequency)}`;
    }
  }
  return "Next Sync in: None";
};
