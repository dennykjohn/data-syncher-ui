import useWebSocket from "react-use-websocket";

import { ConnectorActivityDetailResponse } from "@/types/connectors";

import { useQueryClient } from "@tanstack/react-query";

export const useMigrationStatusWS = (migrationId: number | null) => {
  const queryClient = useQueryClient();

  const socketUrl = migrationId
    ? `wss://qa.datasyncher.com/ws/migration_status/${migrationId}/`
    : null;

  useWebSocket(socketUrl, {
    onMessage: (event) => {
      const message = JSON.parse(event.data);

      if (!migrationId) return;

      queryClient.setQueryData(
        ["connectorActivityDetails", migrationId, undefined, undefined],
        (oldData: ConnectorActivityDetailResponse | undefined) => {
          const updated = { ...(oldData || { tables: [] }), ...message };

          // Preserve tables if backend didn't send them
          if (!message.tables && oldData?.tables) {
            updated.tables = [...oldData.tables];
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
    },
    share: true,
  });
};

export default useMigrationStatusWS;
