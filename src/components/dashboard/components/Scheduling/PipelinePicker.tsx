import { Box, Button, Flex, Menu, Portal, Text } from "@chakra-ui/react";

import { MdExpandMore } from "react-icons/md";

import { type PipelineDetail } from "@/types/pipeline";

type PipelinePickerProps = {
  pipelines: PipelineDetail[];
  selectedPipelineId: number | null;
  onSelect: (_pipelineId: number | null) => void;
  /** Trigger button width; use a smaller value on compact tab bars. */
  width?: string | number;
};

const StatusDot = ({ paused }: { paused: boolean }) => (
  <Box
    as="span"
    w="6px"
    h="6px"
    borderRadius="full"
    flexShrink={0}
    bg={paused ? "orange.500" : "green.600"}
    title={paused ? "Paused" : "Active"}
  />
);

const PipelinePicker = ({
  pipelines,
  selectedPipelineId,
  onSelect,
  width = "240px",
}: PipelinePickerProps) => {
  const selected = pipelines.find((p) => p.id === selectedPipelineId) ?? null;
  const selectedPaused = selected?.status === "paused";

  return (
    <Menu.Root positioning={{ sameWidth: true }}>
      <Menu.Trigger asChild>
        <Button
          size="sm"
          variant="outline"
          width={width}
          maxW="100%"
          flexShrink={0}
          justifyContent="space-between"
          fontWeight="normal"
          px={2.5}
          h="32px"
          bg="white"
          borderColor="gray.200"
          borderRadius="md"
          color="gray.800"
          _hover={{ bg: "gray.50", borderColor: "gray.300" }}
          _expanded={{ bg: "gray.50", borderColor: "gray.400" }}
        >
          <Flex alignItems="center" gap={2} minW={0} flex="1">
            {selected && <StatusDot paused={selectedPaused} />}
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
              <Text
                as="span"
                fontSize="2xs"
                color={selectedPaused ? "orange.700" : "green.700"}
                flexShrink={0}
                w="48px"
                textAlign="left"
                letterSpacing="0.02em"
              >
                {selectedPaused ? "Paused" : "Active"}
              </Text>
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
      </Menu.Trigger>
      <Portal>
        <Menu.Positioner>
          <Menu.Content
            minW={width}
            maxH="280px"
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
            {pipelines.map((p) => {
              const isSelected = p.id === selectedPipelineId;
              const paused = p.status === "paused";
              return (
                <Menu.Item
                  key={p.id}
                  value={String(p.id)}
                  onClick={() => onSelect(p.id)}
                  px={3}
                  py={2}
                  bg={isSelected ? "gray.50" : undefined}
                  borderLeftWidth={isSelected ? "2px" : "0"}
                  borderLeftColor={isSelected ? "gray.700" : "transparent"}
                  _highlighted={{ bg: "gray.50" }}
                >
                  <Flex
                    alignItems="center"
                    justifyContent="space-between"
                    gap={3}
                    w="100%"
                    minW={0}
                  >
                    <Flex alignItems="center" gap={2} minW={0} flex="1">
                      <StatusDot paused={paused} />
                      <Text
                        truncate
                        fontSize="sm"
                        fontWeight={isSelected ? "medium" : "normal"}
                        color="gray.800"
                      >
                        {p.name}
                      </Text>
                    </Flex>
                    <Text
                      as="span"
                      fontSize="2xs"
                      color={paused ? "orange.700" : "green.700"}
                      flexShrink={0}
                      w="48px"
                      textAlign="left"
                      letterSpacing="0.02em"
                    >
                      {paused ? "Paused" : "Active"}
                    </Text>
                  </Flex>
                </Menu.Item>
              );
            })}
          </Menu.Content>
        </Menu.Positioner>
      </Portal>
    </Menu.Root>
  );
};

export default PipelinePicker;
