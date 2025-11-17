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

  const createButtonProps = (isPending: boolean, onAction: () => void) => {
    const isDisabled = shouldShowDisabledState && !isPending;

    return {
      onClick: () => {
        if (isDisabled) {
          toaster.warning({
            title: "Operation in progress",
            description:
              "Another migration is in progress. Please wait until it is complete.",
          });
          return;
        }
        setShouldShowDisabledState(true);
        onAction();
      },
      loading: isPending,
      disabled: isDisabled,
      opacity: isDisabled ? 0.5 : 1,
      cursor: isDisabled ? "not-allowed" : "pointer",
    };
  };

  // Helper function to create tooltip props
  const createTooltipProps = (isPending: boolean) => {
    const isDisabled = shouldShowDisabledState && !isPending;
    return {
      content: isDisabled
        ? "Another migration is in progress. Please wait until it is complete."
        : "",
      disabled: !shouldShowDisabledState || isPending,
    };
  };

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
          <Tooltip {...createTooltipProps(isRefreshing)}>
            <Button
              variant="outline"
              colorPalette="brand"
              {...createButtonProps(isRefreshing, () => {
                refreshSchema(undefined, {
                  onSettled: () => {
                    setShouldShowDisabledState(false);
                  },
                });
              })}
            >
              <MdRefresh />
              Refresh schema
            </Button>
          </Tooltip>

          <Tooltip {...createTooltipProps(isUpdating)}>
            <Button
              variant="outline"
              colorPalette="brand"
              {...createButtonProps(isUpdating, () => {
                updateSchema(undefined, {
                  onSettled: () => {
                    setShouldShowDisabledState(false);
                  },
                });
              })}
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
