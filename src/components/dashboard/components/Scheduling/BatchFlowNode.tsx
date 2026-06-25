import { memo } from "react";

import { Badge, Box, Flex, IconButton, Text } from "@chakra-ui/react";

import { MdClose } from "react-icons/md";

import { Handle, type NodeProps, Position } from "@xyflow/react";

export type BatchFlowNodeData = {
  batchId: number;
  connectionId: number;
  batchName: string;
  connectionName: string;
  tableCount: number;
  executionOrder: "parallel" | "sequential";
  borderColor: string;
  bgColor: string;
  selected?: boolean;
  isRoot?: boolean;
  parentBatchName?: string | null;
  scheduleLabel?: string | null;
  onDelete?: (_nodeId: string) => void;
};

const BatchFlowNode = ({ id, data }: NodeProps) => {
  const nodeData = data as BatchFlowNodeData;

  return (
    <>
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        style={{ background: "#805AD5", width: 10, height: 10 }}
      />
      <Box
        borderWidth={2}
        borderColor={nodeData.selected ? "brand.500" : nodeData.borderColor}
        bg={nodeData.bgColor}
        borderRadius="md"
        p={3}
        minW="200px"
        maxW="260px"
        boxShadow={nodeData.selected ? "md" : "sm"}
        cursor="pointer"
      >
        <Flex justifyContent="space-between" alignItems="flex-start" gap={2}>
          <Box flex="1" minW={0}>
            <Text
              fontSize="sm"
              fontWeight="bold"
              truncate
              title={nodeData.batchName}
            >
              {nodeData.batchName}
            </Text>
            <Text
              fontSize="xs"
              color="gray.600"
              truncate
              title={nodeData.connectionName}
            >
              {nodeData.connectionName}
            </Text>
          </Box>
          {nodeData.onDelete && (
            <IconButton
              aria-label="Remove batch from pipeline"
              size="xs"
              variant="ghost"
              colorPalette="red"
              onClick={(e) => {
                e.stopPropagation();
                nodeData.onDelete?.(id);
              }}
            >
              <MdClose />
            </IconButton>
          )}
        </Flex>
        <Flex mt={2} gap={2} alignItems="center" flexWrap="wrap">
          {nodeData.isRoot ? (
            <Badge size="sm" colorPalette="purple" variant="subtle">
              Scheduled
            </Badge>
          ) : nodeData.parentBatchName ? (
            <Badge size="sm" colorPalette="gray" variant="subtle" maxW="100%">
              After: {nodeData.parentBatchName}
            </Badge>
          ) : null}
          <Badge size="sm" colorPalette="gray">
            {nodeData.tableCount} table{nodeData.tableCount === 1 ? "" : "s"}
          </Badge>
          <Badge
            size="sm"
            colorPalette={
              nodeData.executionOrder === "sequential" ? "orange" : "blue"
            }
          >
            {nodeData.executionOrder}
          </Badge>
        </Flex>
        {nodeData.isRoot && nodeData.scheduleLabel && (
          <Text
            fontSize="xs"
            color="gray.600"
            mt={2}
            truncate
            title={nodeData.scheduleLabel}
          >
            {nodeData.scheduleLabel}
          </Text>
        )}
      </Box>
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        style={{ background: "#805AD5", width: 10, height: 10 }}
      />
    </>
  );
};

export default memo(BatchFlowNode);
