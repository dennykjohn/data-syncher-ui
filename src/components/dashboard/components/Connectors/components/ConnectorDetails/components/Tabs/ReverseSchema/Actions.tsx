import { Button, Flex } from "@chakra-ui/react";

import { MdRefresh } from "react-icons/md";

import { useOutletContext } from "react-router";

import { toaster } from "@/components/ui/toaster";
import { Tooltip } from "@/components/ui/tooltip";
import useRefreshSchema from "@/queryOptions/connector/schema/useRefreshSchema";
import useUpdateSchema from "@/queryOptions/connector/schema/useUpdateSchema";
import { type Connector } from "@/types/connectors";

const Actions = ({
  shouldShowDisabledState,
  setShouldShowDisabledState,
  onUpdateSchemaStart,
}: {
  shouldShowDisabledState: boolean;
  setShouldShowDisabledState: (_value: boolean) => void;
  onUpdateSchemaStart?: () => void;
}) => {
  const context = useOutletContext<Connector>();
  const { connection_id } = context;

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
    };
  };

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
    <Flex
      justifyContent="flex-end"
      alignItems="center"
      flexWrap="wrap"
      gap={4}
      mt={-6}
      mb={2}
      w="100%"
    >
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
            onUpdateSchemaStart?.();
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
  );
};

export default Actions;
