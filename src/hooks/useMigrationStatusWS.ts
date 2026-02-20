import { useCallback, useMemo } from "react";

import useWebSocket from "react-use-websocket";

import { getWebSocketUrl } from "@/helpers/websocket";
import { ConnectorActivityDetailResponse } from "@/types/connectors";

import { useQueryClient } from "@tanstack/react-query";

export const useMigrationStatusWS = (migrationId: number | null) => {
  const queryClient = useQueryClient();

  const socketUrl = getWebSocketUrl(
    migrationId ? `/ws/migration_status/${migrationId}/` : "",
  );

  const onMessage = useCallback(
    (event: WebSocketEventMap["message"]) => {
      if (!migrationId) return;

      const message = JSON.parse(event.data);
      const numericMigrationId = Number(migrationId);

      queryClient.setQueryData(
        ["connectorActivityDetails", numericMigrationId, undefined, undefined],
        (oldData: ConnectorActivityDetailResponse | undefined) => {
          const updated = { ...(oldData || { tables: [] }), ...message };

          if (!message.tables && oldData?.tables) {
            updated.tables = [...oldData.tables];
          }

          if (message.table_name && updated.tables) {
            const tableIndex = updated.tables.findIndex(
              (t: { table_name: string }) =>
                t.table_name.toLowerCase() === message.table_name.toLowerCase(),
            );

            if (tableIndex !== -1) {
              const updatedTable = { ...updated.tables[tableIndex] };

              if (message.staging_records_count !== undefined) {
                updatedTable.staging_records_count =
                  message.staging_records_count;
              }
              if (message.status) {
                updatedTable.status = message.status;
              }
              if (message.error_message) {
                updatedTable.error_message = message.error_message;
              }

              updated.tables = [
                ...updated.tables.slice(0, tableIndex),
                updatedTable,
                ...updated.tables.slice(tableIndex + 1),
              ];
            }
            // Table not found in cache — skip update
          }

          if (message.message && !message.logs) {
            const logs = oldData?.logs || [];
            const isDuplicate = logs.some(
              (l) =>
                l.message === message.message &&
                l.timestamp === message.timestamp,
            );

            if (!isDuplicate) {
              const newLog = {
                message: message.message,
                timestamp: message.timestamp || new Date().toISOString(),
                table: message.table_name || "",
                status: (message.status as string) || "I",
              };
              updated.logs = [newLog, ...logs];
            }
          }

          // Normalize status
          const rawStatus = (
            message.overall_status ||
            message.status ||
            ""
          ).toLowerCase();

          let derivedStatus: string | undefined;

          if (
            rawStatus.includes("success") ||
            rawStatus.includes("completed")
          ) {
            derivedStatus = "completed";
          } else if (
            rawStatus.includes("failed") ||
            rawStatus.includes("error")
          ) {
            derivedStatus = "failed";
          } else if (rawStatus.includes("progress")) {
            derivedStatus = "in_progress";
          }

          if (derivedStatus) {
            const isImplicitUpdate = !message.overall_status;
            const currentIsFailed = oldData?.overall_status === "failed";

            if (
              isImplicitUpdate &&
              currentIsFailed &&
              derivedStatus === "in_progress"
            ) {
              updated.overall_status = "failed";
            } else {
              updated.overall_status = derivedStatus;
            }
          }

          return updated;
        },
      );
    },
    [migrationId, queryClient],
  );

  const onError = useCallback(
    (error: WebSocketEventMap["error"]) => {
      if (!migrationId) return;
      console.error(
        `[WS Migration Status] Error for migration ${migrationId}:`,
        error,
      );
    },
    [migrationId],
  );

  const onClose = useCallback(
    (event: WebSocketEventMap["close"]) => {
      if (!migrationId) return;
      // Only log unexpected closes (not normal 1000/1005 no-op closes)
      if (event.code !== 1000 && event.code !== 1005) {
        console.error(
          `[WS Migration Status] Unexpected close for migration ${migrationId}: Code ${event.code}`,
        );
      }
    },
    [migrationId],
  );

  const options = useMemo(
    () => ({
      onOpen: () => {},
      onMessage,
      onError,
      onClose,
      shouldReconnect: () => false,
      reconnectAttempts: 0,
      share: true,
    }),
    [onMessage, onError, onClose],
  );

  useWebSocket(socketUrl, options);
};

export default useMigrationStatusWS;
