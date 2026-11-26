import {
  Badge,
  Box,
  Button,
  Dialog,
  Flex,
  Portal,
  Text,
  VStack,
} from "@chakra-ui/react";

import { type EntityTransformDetail } from "@/types/connectors";

import { confirmCopy } from "./confirmCopy";

type VersionDetailDialogProps = {
  open: boolean;
  onClose: () => void;
  detail: EntityTransformDetail | null | undefined;
  isLoading: boolean;
  activeVersion: number | null;
};

function mappingColumnCount(detail: EntityTransformDetail): number {
  const mapping = detail.mapping_json;
  if (!mapping || typeof mapping !== "object") return 0;
  const fields = (mapping as { field_mapping?: unknown }).field_mapping;
  return Array.isArray(fields) ? fields.length : 0;
}

export default function VersionDetailDialog({
  open,
  onClose,
  detail,
  isLoading,
  activeVersion,
}: VersionDetailDialogProps) {
  const destination =
    detail?.destination_table_name?.trim() ||
    detail?.json_table_name?.trim() ||
    null;
  const mapped = detail ? mappingColumnCount(detail) : 0;
  const script = (detail?.script_text || "").trim();
  const createdLabel = detail?.created_at
    ? new Date(detail.created_at).toLocaleString()
    : null;

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(details) => {
        if (!details.open) onClose();
      }}
      size="lg"
      // Stack above the parent TransformModal dialog.
      lazyMount
      unmountOnExit
    >
      <Portal>
        <Dialog.Backdrop bg="blackAlpha.700" zIndex="modal" />
        <Dialog.Positioner zIndex="modal">
          <Dialog.Content borderRadius="xl" maxW="720px" maxH="85vh">
            <Dialog.Header>
              <Flex align="center" gap={2} flexWrap="wrap">
                <Dialog.Title fontSize="md">
                  {detail
                    ? `Version ${detail.version}`
                    : isLoading
                      ? "Loading version…"
                      : "Version"}
                </Dialog.Title>
                {createdLabel && (
                  <Text fontSize="sm" color="gray.500">
                    {createdLabel}
                  </Text>
                )}
                <Badge colorPalette="gray" variant="subtle">
                  {confirmCopy.versionViewer.readOnly}
                </Badge>
              </Flex>
            </Dialog.Header>
            <Dialog.Body overflowY="auto" px={6} py={4}>
              {isLoading && !detail ? (
                <Text fontSize="sm" color="gray.500">
                  Loading…
                </Text>
              ) : detail ? (
                <VStack align="stretch" gap={4}>
                  <Text fontSize="sm" color="gray.700">
                    {confirmCopy.versionViewer.mappingSummary(
                      mapped,
                      destination,
                    )}
                  </Text>
                  <Box>
                    <Text fontSize="xs" fontWeight="semibold" mb={2}>
                      {confirmCopy.versionViewer.mappingHeading}
                    </Text>
                    <Box
                      as="pre"
                      fontFamily="mono"
                      fontSize="xs"
                      bg="gray.900"
                      color="gray.100"
                      p={4}
                      borderRadius="md"
                      overflow="auto"
                      maxH="240px"
                      whiteSpace="pre-wrap"
                      tabIndex={0}
                      aria-readonly="true"
                    >
                      {detail.mapping_json
                        ? JSON.stringify(detail.mapping_json, null, 2)
                        : confirmCopy.versionViewer.noMapping}
                    </Box>
                  </Box>
                  <Box>
                    <Text fontSize="xs" fontWeight="semibold" mb={2}>
                      {confirmCopy.versionViewer.scriptHeading}
                    </Text>
                    <Box
                      as="pre"
                      fontFamily="mono"
                      fontSize="xs"
                      bg="gray.900"
                      color="gray.100"
                      p={4}
                      borderRadius="md"
                      overflow="auto"
                      maxH="320px"
                      whiteSpace="pre-wrap"
                      tabIndex={0}
                      aria-readonly="true"
                    >
                      {script || confirmCopy.versionViewer.noScript}
                    </Box>
                  </Box>
                </VStack>
              ) : (
                <Text fontSize="sm" color="red.600">
                  Could not load this version.
                </Text>
              )}
            </Dialog.Body>
            <Dialog.Footer
              justifyContent="space-between"
              gap={3}
              flexWrap="wrap"
            >
              <Text fontSize="xs" color="gray.500">
                {activeVersion !== null && activeVersion !== undefined
                  ? confirmCopy.versionViewer.viewingNote(activeVersion)
                  : "Viewing only."}
              </Text>
              <Button variant="outline" onClick={onClose}>
                {confirmCopy.versionViewer.closeLabel}
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
