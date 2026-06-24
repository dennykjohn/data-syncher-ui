import { type BatchScheduleConfig } from "@/types/connectors";

export type FrequencyOption = {
  value: number;
  label: string;
};

export const FREQUENCY_OPTIONS: FrequencyOption[] = [
  { value: 5, label: "5 min" },
  { value: 15, label: "15 min" },
  { value: 30, label: "30 min" },
  { value: 60, label: "1 hour" },
  { value: 360, label: "6 hours" },
  { value: 1440, label: "Daily" },
];

export const frequencyLabel = (minutes: number | string): string => {
  const value = Number(minutes);
  const match = FREQUENCY_OPTIONS.find((opt) => opt.value === value);
  if (match) return match.label;
  if (!Number.isFinite(value)) return String(minutes);
  if (value % 1440 === 0) {
    const days = value / 1440;
    return days === 1 ? "Daily" : `Every ${days} days`;
  }
  if (value % 60 === 0) {
    const hours = value / 60;
    return hours === 1 ? "1 hour" : `Every ${hours} hours`;
  }
  return `${value} min`;
};

type CronType = "daily" | "weekdays" | "weekly" | "monthly";

export interface ScheduleConfigDraft {
  cron_type: CronType;
  time: string; // HH:mm
  timezone: string;
  day_of_week: string; // mon...sun
  day: number; // 1..31
}

export interface ScheduleValue {
  time_frequency: number;
  execution_order: "parallel" | "sequential";
  sync_start_date: string | null;
  schedule_type: "interval" | "cron";
  schedule_config: ScheduleConfigDraft;
}

export const DEFAULT_SCHEDULE_CONFIG: ScheduleConfigDraft = {
  cron_type: "weekdays",
  time: "09:00",
  timezone: "UTC",
  day_of_week: "mon",
  day: 1,
};

export const defaultScheduleValue = (): ScheduleValue => ({
  time_frequency: 15,
  execution_order: "parallel",
  sync_start_date: null,
  schedule_type: "interval",
  schedule_config: { ...DEFAULT_SCHEDULE_CONFIG },
});

export const fromBatchSchedule = (batch: {
  time_frequency?: string | number;
  execution_order?: "parallel" | "sequential";
  sync_start_date?: string | null;
  schedule_type?: string;
  schedule_config?: BatchScheduleConfig | null;
}): ScheduleValue => {
  const base = defaultScheduleValue();
  const cfg = (batch.schedule_config ?? {}) as Record<string, unknown>;
  const cronType = String(cfg.cron_type ?? "weekdays") as CronType;
  const hour = Number(cfg.hour ?? 9);
  const minute = Number(cfg.minute ?? 0);
  return {
    time_frequency: Number(batch.time_frequency) || 15,
    execution_order: batch.execution_order ?? "parallel",
    sync_start_date: batch.sync_start_date ?? null,
    schedule_type: batch.schedule_type === "cron" ? "cron" : "interval",
    schedule_config: {
      ...base.schedule_config,
      cron_type: cronType,
      time: `${String(Number.isFinite(hour) ? hour : 9).padStart(2, "0")}:${String(
        Number.isFinite(minute) ? minute : 0,
      ).padStart(2, "0")}`,
      timezone: String(cfg.timezone ?? "UTC"),
      day_of_week: String(cfg.day_of_week ?? "mon"),
      day: Number(cfg.day ?? 1),
    },
  };
};

export const toApiSchedule = (value: ScheduleValue) => {
  if (value.schedule_type === "interval") {
    return {
      time_frequency: String(value.time_frequency),
      schedule_type: "interval" as const,
      schedule_config: {},
    };
  }

  const [h, m] = (value.schedule_config.time || "09:00").split(":");
  const hour = Number(h);
  const minute = Number(m);
  const cfg: Record<string, string | number> = {
    cron_type: value.schedule_config.cron_type,
    hour: Number.isFinite(hour) ? hour : 9,
    minute: Number.isFinite(minute) ? minute : 0,
    timezone: value.schedule_config.timezone || "UTC",
  };
  if (value.schedule_config.cron_type === "weekly") {
    cfg.day_of_week = value.schedule_config.day_of_week || "mon";
  } else if (value.schedule_config.cron_type === "monthly") {
    const day = Number(value.schedule_config.day);
    cfg.day = Number.isFinite(day) ? Math.min(Math.max(day, 1), 31) : 1;
  }
  return {
    // Keep legacy field populated for backward compatibility paths.
    time_frequency: "1440",
    schedule_type: "cron" as const,
    schedule_config: cfg,
  };
};

export const batchScheduleLabel = (batch: {
  time_frequency?: string | number;
  schedule_type?: string;
  schedule_config?: BatchScheduleConfig | null;
}): string => {
  if (batch.schedule_type !== "cron") {
    return frequencyLabel(batch.time_frequency ?? 15);
  }
  const cfg = batch.schedule_config ?? {};
  const cronType = String(cfg.cron_type ?? "weekdays");
  const hour = Number(cfg.hour ?? 0);
  const minute = Number(cfg.minute ?? 0);
  const hh = String(Number.isFinite(hour) ? hour : 0).padStart(2, "0");
  const mm = String(Number.isFinite(minute) ? minute : 0).padStart(2, "0");
  const at = `${hh}:${mm}`;
  if (cronType === "weekly") {
    const day = String(cfg.day_of_week ?? "mon");
    return `Weekly (${day}) ${at}`;
  }
  if (cronType === "monthly") {
    const day = Number(cfg.day ?? 1);
    return `Monthly (day ${day}) ${at}`;
  }
  if (cronType === "daily") {
    return `Daily ${at}`;
  }
  return `Weekdays ${at}`;
};
