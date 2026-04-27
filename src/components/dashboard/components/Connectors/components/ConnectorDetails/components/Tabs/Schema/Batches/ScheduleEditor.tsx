import { Box, Flex, Grid, Input, RadioGroup, Text } from "@chakra-ui/react";

import { type BatchExecutionOrder } from "@/types/connectors";

import { FREQUENCY_OPTIONS } from "./scheduleOptions";

export interface ScheduleValue {
  time_frequency: number;
  execution_order: BatchExecutionOrder;
  sync_start_date: string | null;
}

interface ScheduleEditorProps {
  value: ScheduleValue;
  onChange: (_next: ScheduleValue) => void;
  showStartDate?: boolean;
  disabled?: boolean;
}

const ScheduleEditor = ({
  value,
  onChange,
  showStartDate = true,
  disabled = false,
}: ScheduleEditorProps) => {
  return (
    <Flex direction="column" gap={4}>
      <Flex direction="column" gap={2}>
        <Text fontSize="sm" fontWeight="semibold">
          Frequency
        </Text>
        <Grid templateColumns="repeat(3, 1fr)" gap={2}>
          {FREQUENCY_OPTIONS.map((opt) => {
            const isSelected = Number(value.time_frequency) === opt.value;
            return (
              <Box
                key={opt.value}
                as="button"
                aria-disabled={disabled}
                onClick={() =>
                  !disabled && onChange({ ...value, time_frequency: opt.value })
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
      </Flex>

      <Flex direction="column" gap={2}>
        <Text fontSize="sm" fontWeight="semibold">
          Execution mode
        </Text>
        <RadioGroup.Root
          value={value.execution_order}
          onValueChange={({ value: v }) =>
            !disabled &&
            v &&
            onChange({
              ...value,
              execution_order: v as BatchExecutionOrder,
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
