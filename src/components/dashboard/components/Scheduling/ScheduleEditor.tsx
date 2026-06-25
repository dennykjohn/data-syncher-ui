import { Box, Flex, Grid, Input, RadioGroup, Text } from "@chakra-ui/react";

import { FREQUENCY_OPTIONS, type ScheduleValue } from "./scheduleOptions";

interface ScheduleEditorProps {
  value: ScheduleValue;
  onChange: (_next: ScheduleValue) => void;
  showStartDate?: boolean;
  showExecutionMode?: boolean;
  disabled?: boolean;
}

const REPEAT_OPTIONS = [
  { value: "interval", label: "Every X minutes" },
  { value: "cron:daily", label: "Daily" },
  { value: "cron:weekdays", label: "Weekdays" },
  { value: "cron:weekly", label: "Weekly" },
  { value: "cron:monthly", label: "Monthly" },
] as const;

const ScheduleEditor = ({
  value,
  onChange,
  showStartDate = true,
  showExecutionMode = true,
  disabled = false,
}: ScheduleEditorProps) => {
  const isInterval = value.schedule_type === "interval";

  return (
    <Flex direction="column" gap={4}>
      <Flex direction="column" gap={2}>
        <Text fontSize="sm" fontWeight="semibold">
          Repeat
        </Text>
        <Grid templateColumns="repeat(2, 1fr)" gap={2}>
          {REPEAT_OPTIONS.map((opt) => {
            const isSelected =
              opt.value === "interval"
                ? value.schedule_type === "interval"
                : value.schedule_type === "cron" &&
                  opt.value === `cron:${value.schedule_config.cron_type}`;
            return (
              <Box
                key={opt.value}
                as="button"
                aria-disabled={disabled}
                onClick={() => {
                  if (disabled) return;
                  if (opt.value === "interval") {
                    onChange({ ...value, schedule_type: "interval" });
                    return;
                  }
                  const cronType = opt.value.replace("cron:", "") as
                    | "daily"
                    | "weekdays"
                    | "weekly"
                    | "monthly";
                  onChange({
                    ...value,
                    schedule_type: "cron",
                    schedule_config: {
                      ...value.schedule_config,
                      cron_type: cronType,
                    },
                  });
                }}
                px={3}
                py={2}
                borderRadius="md"
                borderWidth={1}
                borderColor={isSelected ? "brand.500" : "gray.300"}
                bgColor={isSelected ? "brand.50" : "white"}
                color={isSelected ? "brand.700" : "gray.700"}
                fontSize="sm"
                fontWeight={isSelected ? "semibold" : "normal"}
                cursor={disabled ? "not-allowed" : "pointer"}
                opacity={disabled ? 0.6 : 1}
              >
                {opt.label}
              </Box>
            );
          })}
        </Grid>
      </Flex>

      <Flex direction="column" gap={2}>
        <Text fontSize="sm" fontWeight="semibold">
          {isInterval ? "Frequency" : "Schedule time"}
        </Text>
        {isInterval ? (
          <Grid templateColumns="repeat(3, 1fr)" gap={2}>
            {FREQUENCY_OPTIONS.map((opt) => {
              const isSelected = Number(value.time_frequency) === opt.value;
              return (
                <Box
                  key={opt.value}
                  as="button"
                  aria-disabled={disabled}
                  onClick={() =>
                    !disabled &&
                    onChange({ ...value, time_frequency: opt.value })
                  }
                  px={3}
                  py={2}
                  borderRadius="md"
                  borderWidth={1}
                  borderColor={isSelected ? "brand.500" : "gray.300"}
                  bgColor={isSelected ? "brand.50" : "white"}
                  color={isSelected ? "brand.700" : "gray.700"}
                  fontSize="sm"
                  fontWeight={isSelected ? "semibold" : "normal"}
                  cursor={disabled ? "not-allowed" : "pointer"}
                  opacity={disabled ? 0.6 : 1}
                  _hover={{
                    borderColor: disabled ? "gray.300" : "brand.500",
                  }}
                >
                  {opt.label}
                </Box>
              );
            })}
          </Grid>
        ) : (
          <Flex gap={2} alignItems="center" wrap="wrap">
            <Input
              type="time"
              size="sm"
              maxW="160px"
              disabled={disabled}
              value={value.schedule_config.time}
              onChange={(e) =>
                onChange({
                  ...value,
                  schedule_config: {
                    ...value.schedule_config,
                    time: e.target.value,
                  },
                })
              }
            />
            {value.schedule_config.cron_type === "weekly" && (
              <Input
                as="select"
                size="sm"
                maxW="180px"
                disabled={disabled}
                value={value.schedule_config.day_of_week}
                onChange={(e) =>
                  onChange({
                    ...value,
                    schedule_config: {
                      ...value.schedule_config,
                      day_of_week: e.target.value,
                    },
                  })
                }
              >
                <option value="mon">Monday</option>
                <option value="tue">Tuesday</option>
                <option value="wed">Wednesday</option>
                <option value="thu">Thursday</option>
                <option value="fri">Friday</option>
                <option value="sat">Saturday</option>
                <option value="sun">Sunday</option>
              </Input>
            )}
            {value.schedule_config.cron_type === "monthly" && (
              <Input
                type="number"
                min={1}
                max={31}
                size="sm"
                maxW="120px"
                disabled={disabled}
                value={value.schedule_config.day}
                onChange={(e) =>
                  onChange({
                    ...value,
                    schedule_config: {
                      ...value.schedule_config,
                      day: Number(e.target.value || 1),
                    },
                  })
                }
              />
            )}
            <Input
              size="sm"
              maxW="220px"
              placeholder="Timezone (e.g. Asia/Kolkata)"
              disabled={disabled}
              value={value.schedule_config.timezone}
              onChange={(e) =>
                onChange({
                  ...value,
                  schedule_config: {
                    ...value.schedule_config,
                    timezone: e.target.value,
                  },
                })
              }
            />
          </Flex>
        )}
      </Flex>

      {showExecutionMode && (
        <Flex direction="column" gap={2}>
          <Text fontSize="sm" fontWeight="semibold">
            Execution mode (tables in batch)
          </Text>
          <RadioGroup.Root
            value={value.execution_order}
            onValueChange={({ value: v }) =>
              !disabled &&
              v &&
              onChange({
                ...value,
                execution_order: v as "parallel" | "sequential",
              })
            }
            disabled={disabled}
          >
            <Flex gap={4}>
              <RadioGroup.Item value="parallel">
                <RadioGroup.ItemHiddenInput />
                <RadioGroup.ItemIndicator />
                <RadioGroup.ItemText>Parallel</RadioGroup.ItemText>
              </RadioGroup.Item>
              <RadioGroup.Item value="sequential">
                <RadioGroup.ItemHiddenInput />
                <RadioGroup.ItemIndicator />
                <RadioGroup.ItemText>Sequential</RadioGroup.ItemText>
              </RadioGroup.Item>
            </Flex>
          </RadioGroup.Root>
        </Flex>
      )}

      {showStartDate && (
        <Flex direction="column" gap={2}>
          <Text fontSize="sm" fontWeight="semibold">
            Start date (optional)
          </Text>
          <Input
            type="datetime-local"
            size="sm"
            disabled={disabled}
            value={value.sync_start_date ?? ""}
            onChange={(e) =>
              onChange({
                ...value,
                sync_start_date: e.target.value || null,
              })
            }
          />
        </Flex>
      )}
    </Flex>
  );
};

export default ScheduleEditor;
