export const syncFrequenciesOptions = [
  { value: "None", label: "None" },
  { value: "1", label: "1 minute" },
  { value: "5", label: "5 minutes" },
  { value: "15", label: "15 minutes" },
  { value: "30", label: "30 minutes" },
  { value: "60", label: "1 hour" },
  { value: "120", label: "2 hours" },
  { value: "180", label: "3 hours" },
  { value: "360", label: "6 hours" },
  { value: "480", label: "8 hours" },
  { value: "720", label: "12 hours" },
  { value: "1440", label: "24 hours" },
];

export const safetyIntervalOptions = [
  { value: "None", label: "None" },
  { value: "1", label: "1 minute" },
  { value: "5", label: "5 minutes" },
  { value: "15", label: "15 minutes" },
  { value: "30", label: "30 minutes" },
  { value: "60", label: "1 hour" },
  { value: "120", label: "2 hours" },
  { value: "180", label: "3 hours" },
  { value: "360", label: "6 hours" },
  { value: "480", label: "8 hours" },
  { value: "720", label: "12 hours" },
  { value: "1440", label: "24 hours" },
];

export const executionOrderOptions = [
  { value: "parallel", label: "Parallel" },
  { value: "sequential", label: "Sequential" },
];

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

export function toLocalDateTimeInput(isoUtc?: string | null): string {
  if (!isoUtc) return "";

  // Parse UTC date and add IST offset
  const utcDate = new Date(isoUtc);
  const istTime = utcDate.getTime() + IST_OFFSET_MS;
  const istDate = new Date(istTime);

  // Format as YYYY-MM-DDTHH:mm:ss using UTC methods to get IST components

  const pad = (n: number) => String(n).padStart(2, "0");
  const YYYY = istDate.getUTCFullYear();
  const MM = pad(istDate.getUTCMonth() + 1);
  const DD = pad(istDate.getUTCDate());
  const hh = pad(istDate.getUTCHours());
  const mm = pad(istDate.getUTCMinutes());
  const ss = pad(istDate.getUTCSeconds());

  return `${YYYY}-${MM}-${DD}T${hh}:${mm}:${ss}`;
}

export function fromLocalDateTimeInput(localValue: string): string | null {
  if (!localValue || !localValue.trim()) return null;

  // Parse input as IST
  const istDate = new Date(localValue + "Z");
  const utcTime = istDate.getTime() - IST_OFFSET_MS;
  const utcDate = new Date(utcTime);

  // Format as UTC ISO string without milliseconds
  return utcDate.toISOString().slice(0, 19) + "Z";
}
