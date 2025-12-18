import { format, isValid } from "date-fns";

import { dateTimeFormat } from "@/constants/common";
import { type SchemaStatusResponse } from "@/types/connectors";

type StatusParams = {
  isUpdateSchemaInProgress: number;
  isRefreshSchemaInProgress: number;
  isAnyOperationInProgress: boolean;
  next_sync_time?: string | null;
  time_frequency: string;
  // allow passing alternate format but default to project constant
  dateTimeFmt?: string;
  schemaStatus?: SchemaStatusResponse | null;
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

export const getStatusMessage = ({
  isUpdateSchemaInProgress,
  isRefreshSchemaInProgress,
  isAnyOperationInProgress,
  next_sync_time,
  time_frequency,
  dateTimeFmt,
  schemaStatus,
}: StatusParams) => {
  // Show progress if schema update is in progress with table counts
  if (schemaStatus?.is_in_progress) {
    if (
      schemaStatus.tables_fetched !== undefined &&
      schemaStatus.total_tables !== undefined
    ) {
      return `Fetching tables (${schemaStatus.tables_fetched}/${schemaStatus.total_tables})...`;
    }
    return "Updating schema...";
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
