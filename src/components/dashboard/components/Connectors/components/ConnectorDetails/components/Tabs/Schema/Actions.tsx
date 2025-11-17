import { Button, Flex, Text } from "@chakra-ui/react";

import { MdRefresh } from "react-icons/md";

import { toaster } from "@/components/ui/toaster";
import { Tooltip } from "@/components/ui/tooltip";
import useRefreshSchema from "@/queryOptions/connector/schema/useRefreshSchema";
import useUpdateSchema from "@/queryOptions/connector/schema/useUpdateSchema";

const Actions = ({
  connection_id,
  target_database,
  target_schema,
  shouldShowDisabledState,
  setShouldShowDisabledState,
}: {
  connection_id: number;
  target_database: string;
  target_schema: string;
  shouldShowDisabledState: boolean;
  setShouldShowDisabledState: (_value: boolean) => void;
}) => {
  const { mutate: refreshSchema, isPending: isRefreshing } = useRefreshSchema({
    connectorId: connection_id,
  });
  const { mutate: updateSchema, isPending: isUpdating } = useUpdateSchema({
    connectorId: connection_id,
  });

  return (
    <Flex direction="column" gap={2} mb={2} minW="xl">
      <Flex w="100%">
        <Text fontWeight="semibold" flexGrow={1} w="100%">
          Target Details
        </Text>
      </Flex>
      <Flex
        justifyContent="space-between"
        alignItems="center"
        flexWrap="wrap"
        gap={4}
      >
        <Flex gap={4}>
          <Flex gap={2}>
            <Text>Target database:</Text>
            <Text fontWeight="semibold">{target_database}</Text>
          </Flex>
          <Flex gap={2}>
            <Text>Target Schema:</Text>
            <Text fontWeight="semibold">{target_schema}</Text>
          </Flex>
        </Flex>
        <Flex gap={4}>
          <Tooltip
            content={
              shouldShowDisabledState || isUpdating
                ? "Another migration is in progress. Please wait until it is complete."
                : ""
            }
            disabled={!shouldShowDisabledState && !isUpdating}
          >
            <Button
              variant="outline"
              colorPalette="brand"
              onClick={() => {
                // Check if any operation is active (shared state OR other button is pending)
                if (shouldShowDisabledState || isUpdating) {
                  toaster.warning({
                    title: "Operation in progress",
                    description:
                      "Another migration is in progress. Please wait until it is complete.",
                  });
                  return;
                }
                // Immediately set state to prevent other buttons from being clicked
                setShouldShowDisabledState(true);
                refreshSchema(undefined);
              }}
              loading={isRefreshing}
              disabled={shouldShowDisabledState || isUpdating || isRefreshing}
              opacity={shouldShowDisabledState || isUpdating ? 0.5 : 1}
              cursor={
                shouldShowDisabledState || isUpdating
                  ? "not-allowed"
                  : "pointer"
              }
            >
              <MdRefresh />
              Refresh schema
            </Button>
          </Tooltip>
          <Tooltip
            content={
              shouldShowDisabledState || isRefreshing
                ? "Another migration is in progress. Please wait until it is complete."
                : ""
            }
            disabled={!shouldShowDisabledState && !isRefreshing}
          >
            <Button
              variant="outline"
              colorPalette="brand"
              loading={isUpdating}
              onClick={() => {
                // Check if any operation is active (shared state OR other button is pending)
                if (shouldShowDisabledState || isRefreshing) {
                  toaster.warning({
                    title: "Operation in progress",
                    description:
                      "Another migration is in progress. Please wait until it is complete.",
                  });
                  return;
                }
                // Immediately set state to prevent other buttons from being clicked
                setShouldShowDisabledState(true);
                updateSchema(undefined);
              }}
              disabled={shouldShowDisabledState || isRefreshing || isUpdating}
              opacity={shouldShowDisabledState || isRefreshing ? 0.5 : 1}
              cursor={
                shouldShowDisabledState || isRefreshing
                  ? "not-allowed"
                  : "pointer"
              }
            >
              <MdRefresh />
              Update schema
            </Button>
          </Tooltip>
        </Flex>
      </Flex>
    </Flex>
  );
};

export default Actions;
