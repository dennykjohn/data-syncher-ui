import { useCallback, useMemo } from "react";

import useWebSocket from "react-use-websocket";

import { getWebSocketUrl } from "@/helpers/websocket";
import { ConnectorActivityDetailResponse } from "@/types/connectors";

import { useQueryClient } from "@tanstack/react-query";

interface MigrationWSMessage {
  migration_session_id?: number | string;
  connection_id?: number | string;
  table_name?: string;
  status?: string;
  status_icon?: string;
  overall_status?: string;
  overall_status_icon?: string;
  staging_records_count?: number;
  start_time?: string | null;
  end_time?: string | null;
  error_message?: string;
  message?: string;
  timestamp?: string;
  tables?: ConnectorActivityDetailResponse["tables"];
  logs?: ConnectorActivityDetailResponse["logs"];
}

const normalizeMigrationStatus = (status: string | undefined): string => {
  const normalized = (status || "").trim().toLowerCase();

  if (
    normalized === "s" ||
    normalized.includes("success") ||
    normalized.includes("completed")
  ) {
    return "completed";
  }

  if (
    normalized === "e" ||
    normalized === "f" ||
    normalized.includes("failed") ||
    normalized.includes("error")
  ) {
    return "failed";
  }

  if (
    normalized === "i" ||
    normalized === "running" ||
    normalized.includes("progress")
  ) {
    return "in_progress";
  }

  return normalized;
};

export const useMigrationStatusWS = (
  migrationId: number | null,
  connectionId: number | null,
) => {
  const queryClient = useQueryClient();

  const getSocketUrl = useCallback(() => {
    const socketUrl = getWebSocketUrl(
      migrationId ? `/ws/migration_status/${migrationId}/` : "",
    );

    if (!socketUrl) {
      throw new Error("WebSocket authentication token is not available.");
    }

    return socketUrl;
  }, [migrationId]);

  const onMessage = useCallback(
    (event: WebSocketEventMap["message"]) => {
      if (!migrationId || !connectionId) return;

      let message: MigrationWSMessage;
      try {
        message = JSON.parse(event.data) as MigrationWSMessage;
      } catch {
        return;
      }

      const numericMigrationId = Number(migrationId);
      const numericConnectionId = Number(connectionId);

      // Session IDs can collide across connections. The backend currently
      // broadcasts those scoped payloads through one session-only WS group.
      if (Number(message.connection_id) !== numericConnectionId) {
        return;
      }

      if (Number(message.migration_session_id) !== numericMigrationId) {
        return;
      }

      queryClient.setQueryData(
        [
          "connectorActivityDetails",
          numericMigrationId,
          numericConnectionId,
          undefined,
        ],
        (oldData: ConnectorActivityDetailResponse | undefined) => {
          // Spread top-level fields but handle 'tables' separately to avoid overwriting
          const { tables: _wsTablesIgnored, ...messageWithoutTables } = message;
          const updated = {
            ...(oldData || { tables: [] }),
            ...messageWithoutTables,
          };

          // Preserve existing tables from cache; if WS sends a full tables list,
          // deep-merge each entry to retain start_time / end_time from cached data.
          if (message.tables && message.tables.length > 0) {
            const existingTables = oldData?.tables || [];
            updated.tables = message.tables.map((wsTable) => {
              const cached = existingTables.find(
                (t) =>
                  t.table_name.toLowerCase() ===
                  wsTable.table_name.toLowerCase(),
              );
              // Merge: cached data first, then WS data on top — preserving times if WS omits them
              return {
                ...(cached || {}),
                ...wsTable,
                start_time:
                  wsTable.start_time !== undefined &&
                  wsTable.start_time !== null
                    ? wsTable.start_time
                    : (cached?.start_time ?? null),
                end_time:
                  wsTable.end_time !== undefined && wsTable.end_time !== null
                    ? wsTable.end_time
                    : (cached?.end_time ?? null),
              };
            });
          } else if (!message.tables && oldData?.tables) {
            updated.tables = [...oldData.tables];
          }

          if (message.table_name && updated.tables) {
            const tableName = message.table_name;
            const tableIndex = updated.tables.findIndex(
              (t: { table_name: string }) =>
                t.table_name.toLowerCase() === tableName.toLowerCase(),
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
              if (message.status_icon) {
                updatedTable.status_icon = message.status_icon;
              }
              if (message.error_message) {
                updatedTable.error_message = message.error_message;
              }
              // Apply start_time / end_time from WS when explicitly provided
              if (message.start_time !== undefined) {
                updatedTable.start_time = message.start_time;
              }
              if (message.end_time !== undefined) {
                updatedTable.end_time = message.end_time;
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
                status: message.status_icon || message.status || "I",
              };
              updated.logs = [newLog, ...logs];
            }
          }

          // Normalize status
          const derivedStatus = normalizeMigrationStatus(
            message.overall_status ||
              message.overall_status_icon ||
              message.status_icon ||
              message.status,
          );

          if (
            derivedStatus === "completed" ||
            derivedStatus === "failed" ||
            derivedStatus === "in_progress"
          ) {
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

      // When the migration reaches a terminal state, do a fresh fetch after a
      // short delay so the definitive end_time (written by the backend on
      // completion) comes through without requiring a manual page refresh.
      const terminalStatus = normalizeMigrationStatus(
        message.overall_status ||
          message.overall_status_icon ||
          message.status_icon ||
          message.status,
      );
      if (terminalStatus === "completed" || terminalStatus === "failed") {
        setTimeout(() => {
          void queryClient.invalidateQueries({
            queryKey: [
              "connectorActivityDetails",
              numericMigrationId,
              numericConnectionId,
              undefined,
            ],
          });
          void queryClient.invalidateQueries({
            queryKey: ["connectorActivity", numericConnectionId],
            refetchType: "active",
          });
        }, 2000); // 2 s buffer for the backend to commit the final record
      }
    },
    [connectionId, migrationId, queryClient],
  );

  const onError = useCallback(
    (error: WebSocketEventMap["error"]) => {
      if (!migrationId || !connectionId) return;
      console.error(
        `[WS Migration Status] Error for connection ${connectionId}, migration ${migrationId}:`,
        error,
      );
    },
    [connectionId, migrationId],
  );

  const onClose = useCallback(
    (event: WebSocketEventMap["close"]) => {
      if (!migrationId || !connectionId) return;
      // Only log unexpected closes (not normal 1000/1005 no-op closes)
      if (event.code !== 1000 && event.code !== 1005) {
        console.error(
          `[WS Migration Status] Unexpected close for connection ${connectionId}, migration ${migrationId}: Code ${event.code}`,
        );
      }
    },
    [connectionId, migrationId],
  );

  const options = useMemo(
    () => ({
      onOpen: () => {},
      onMessage,
      onError,
      onClose,
      shouldReconnect: (closeEvent: CloseEvent) => closeEvent.code !== 1000,
      reconnectInterval: 3000,
      reconnectAttempts: 10,
      share: true,
      retryOnError: true,
    }),
    [onMessage, onError, onClose],
  );

  useWebSocket(migrationId && connectionId ? getSocketUrl : null, options);
};

export default useMigrationStatusWS;
