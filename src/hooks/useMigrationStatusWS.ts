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
      console.warn(
        `[WS Migration Status] ✅ Connected to: ${socketUrl}`,
        `Migration ID: ${migrationId}`,
      );
    },
    onMessage: (event) => {
      const message = JSON.parse(event.data);
      console.warn(
        `[WS Migration Status] 📨 Message received for migration ${migrationId}:`,
        message,
      );

      if (!migrationId) return;

      // Ensure migrationId is treated as a number for consistency with query keys
      const numericMigrationId = Number(migrationId);

      queryClient.setQueryData(
        ["connectorActivityDetails", numericMigrationId, undefined, undefined],
        (oldData: ConnectorActivityDetailResponse | undefined) => {
          const updated = { ...(oldData || { tables: [] }), ...message };

          // Preserve tables if backend didn't send them
          if (!message.tables && oldData?.tables) {
            updated.tables = [...oldData.tables];
          } else if (message.tables) {
            console.warn(
              `[WS Migration Status] 📦 Received full table list update with ${message.tables.length} tables.`,
              message.tables.map(
                (t: { table_name: string; staging_records_count: number }) =>
                  `${t.table_name}: ${t.staging_records_count}`,
              ),
            );
          }

          // Handle partial table updates (if flat structure used)
          if (message.table_name && updated.tables) {
            // ... (rest of logic)
            const tableIndex = updated.tables.findIndex(
              (t: { table_name: string }) =>
                t.table_name.toLowerCase() === message.table_name.toLowerCase(),
            );

            console.warn(
              `[WS Migration Status] 🔍 Searching for table '${message.table_name}' in cache. Found index: ${tableIndex}`,
            );

            if (tableIndex !== -1) {
              const updatedTable = { ...updated.tables[tableIndex] };

              if (message.staging_records_count !== undefined) {
                console.warn(
                  `[WS Migration Status] 🔢 Updating record count for '${message.table_name}' to ${message.staging_records_count}`,
                );
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
            } else {
              console.warn(
                `[WS Migration Status] ⚠️ Table '${message.table_name}' not found in cache. Available tables:`,
                updated.tables.map((t: { table_name: string }) => t.table_name),
              );
            }
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

          console.warn(
            `[WS Migration Status] 💾 Cache updated for migration ${migrationId}:`,
            `Status: ${updated.overall_status}`,
            `Tables: ${updated.tables?.length || 0}`,
            `Logs: ${updated.logs?.length || 0}`,
          );

          return updated;
        },
      );

      console.warn(
        `[WS Migration Status] 🔄 Cache updated for migration ${migrationId}`,
      );
    },
    onError: (error) => {
      console.error(
        `[WS Migration Status] ❌ Error for migration ${migrationId}:`,
        error,
      );
    },
    onClose: (event) => {
      console.warn(
        `[WS Migration Status] 🔌 Connection closed for migration ${migrationId}:`,
        `Code: ${event.code}`,
        `Reason: ${event.reason}`,
      );
    },
    shouldReconnect: () => true,
    reconnectInterval: 3000,
    reconnectAttempts: 10,
    share: true,
    retryOnError: true,
  });
};

export default useMigrationStatusWS;
