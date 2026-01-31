import useWebSocket from "react-use-websocket";

import { ConnectorActivityDetailResponse } from "@/types/connectors";

import { useQueryClient } from "@tanstack/react-query";

export const useMigrationStatusWS = (migrationId: number | null) => {
  const queryClient = useQueryClient();

  const socketUrl = migrationId
    ? `wss://qa.datasyncher.com/ws/migration_status/${migrationId}/`
    : null;

  useWebSocket(socketUrl, {
    onOpen: () => {
      // Connected
    },
    onMessage: (event) => {
      try {
        const message = JSON.parse(event.data);

        if (!migrationId) return;

        // Update Detailed Progress Cache
        queryClient.setQueryData(
          ["connectorActivityDetails", migrationId],
          (oldData: ConnectorActivityDetailResponse | undefined) => {
            const updated = { ...(oldData || { tables: [] }), ...message };

            // Preserve tables if not in message
            if (!message.tables && oldData?.tables) {
              updated.tables = [...oldData.tables];
            }

            // Sync with Activity Logs if message exists
            if (message.message && !message.logs) {
              const logs = oldData?.logs || [];
              const isDuplicate = logs.some(
                (l: { message: string; timestamp: string }) =>
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

            // Status Normalization
            const rawStatus = (
              message.overall_status ||
              message.status ||
              ""
            ).toLowerCase();
            if (
              rawStatus.includes("success") ||
              rawStatus.includes("completed")
            ) {
              updated.overall_status = "completed";
            } else if (
              rawStatus.includes("failed") ||
              rawStatus.includes("error")
            ) {
              updated.overall_status = "failed";
            } else if (rawStatus.includes("progress")) {
              updated.overall_status = "in_progress";
            }

            return updated;
          },
        );
      } catch {
        // console.warn("[WS Migration Status] Parse error");
      }
    },
    shouldReconnect: () => true,
    reconnectInterval: 3000,
    share: true,
    retryOnError: true,
  });
};

export default useMigrationStatusWS;
