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
