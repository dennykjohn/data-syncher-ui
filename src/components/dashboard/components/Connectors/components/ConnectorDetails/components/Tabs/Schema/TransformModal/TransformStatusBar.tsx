import { Badge, Button, Flex, Menu, Text } from "@chakra-ui/react";

import { FiChevronDown } from "react-icons/fi";

import { type EntityTransformHistoryItem } from "@/queryOptions/connector/schema/transform/useEntityTransform";

import { confirmCopy, showAppliedBadge, showDraftBadge } from "./confirmCopy";

type TransformStatusBarProps = {
  hasServerDraft: boolean;
  isDirty: boolean;
  hasActive: boolean;
  publishedVersion: number | null;
  draftSaveLabel: string | null;
  history: EntityTransformHistoryItem[];
  onSelectVersion: (_version: number) => void;
};

function formatHistoryDate(value: string | null): string {
  if (!value) return "";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

export default function TransformStatusBar({
  hasServerDraft,
  isDirty,
  hasActive,
  publishedVersion,
  draftSaveLabel,
  history,
  onSelectVersion,
}: TransformStatusBarProps) {
  const draftVisible = showDraftBadge({ hasServerDraft, isDirty });
  const appliedVisible = showAppliedBadge({ hasActive, publishedVersion });

  const validatedHistory = history.filter((item) => item.status !== "draft");

  return (
    <Flex ml="auto" gap={2} align="center" flexWrap="wrap">
      {draftVisible && (
        <Badge colorPalette="orange" variant="subtle">
          {confirmCopy.draftBadge}
        </Badge>
      )}
      {appliedVisible && publishedVersion !== null && (
        <Menu.Root
          // Menu lives inside TransformModal Dialog — do not Portal to body
          // (Dialog focus trap dismisses portaled menus). Use fixed strategy
          // so the list is not clipped by overflow on the dialog content.
          positioning={{
            placement: "bottom-end",
            strategy: "fixed",
            hideWhenDetached: true,
          }}
        >
          <Menu.Trigger asChild>
            <Button
              size="xs"
              variant="subtle"
              colorPalette="green"
              h="22px"
              px={2}
              fontWeight="medium"
              aria-label={`${confirmCopy.validatedBadge(publishedVersion)}, show versions`}
            >
              {confirmCopy.validatedBadge(publishedVersion)}
              <FiChevronDown />
            </Button>
          </Menu.Trigger>
          <Menu.Positioner zIndex="popover">
            <Menu.Content minW="240px" maxH="280px" overflowY="auto">
              {validatedHistory.length === 0 ? (
                <Text fontSize="sm" color="gray.500" px={3} py={2}>
                  No saved versions yet.
                </Text>
              ) : (
                validatedHistory.map((item) => (
                  <Menu.Item
                    key={item.id}
                    value={`v-${item.version}`}
                    cursor="pointer"
                    onSelect={() => onSelectVersion(item.version)}
                    onClick={() => onSelectVersion(item.version)}
                  >
                    <Flex
                      w="100%"
                      align="center"
                      justify="space-between"
                      gap={3}
                    >
                      <Flex direction="column" align="flex-start" gap={0}>
                        <Text fontSize="sm">v{item.version}</Text>
                        <Text fontSize="xs" color="gray.500">
                          {formatHistoryDate(item.created_at)}
                        </Text>
                      </Flex>
                      {item.is_active && (
                        <Badge colorPalette="green" variant="subtle" size="sm">
                          {confirmCopy.versionViewer.activeTag}
                        </Badge>
                      )}
                    </Flex>
                  </Menu.Item>
                ))
              )}
            </Menu.Content>
          </Menu.Positioner>
        </Menu.Root>
      )}
      {!draftVisible && !appliedVisible && (
        <Badge colorPalette="gray" variant="subtle">
          No validated version
        </Badge>
      )}

      {draftSaveLabel && draftVisible && (
        <Text fontSize="xs" color="gray.500">
          {draftSaveLabel}
        </Text>
      )}
    </Flex>
  );
}
