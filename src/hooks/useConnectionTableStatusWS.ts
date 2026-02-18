import useWebSocket from "react-use-websocket";

import { ConnectorSelectedTable } from "@/types/connectors";

import { useQueryClient } from "@tanstack/react-query";

interface TableStatusCache {
  tables: ConnectorSelectedTable[];
  schema_refresh_in_progress?: boolean;
  readable_time_frequency?: string | null;
  next_sync_time?: string | null;
  last_updated?: string;
  _updateId?: number;
}

interface RawTableStatus {
  table_name: string;
  status: string;
}

interface WSMessage {
  table_statuses?: RawTableStatus[];
  schema_refresh_in_progress?: boolean;
  readable_time_frequency?: string | null;
  next_sync_time?: string | null;
}

export const useConnectionTableStatusWS = (connectionId: number | null) => {
  const queryClient = useQueryClient();

  const isValidId =
    connectionId !== null && !isNaN(connectionId) && connectionId !== 0;

  const socketUrl = isValidId
    ? `wss://qa.datasyncher.com/ws/connection_table_status/${connectionId}/`
    : null;

  useWebSocket(socketUrl, {
    onOpen: () => {
      console.warn(
        `[WS Table Status] ✅ Connected to: ${socketUrl}`,
        `Connection ID: ${connectionId}`,
      );
    },
    onMessage: (event) => {
      try {
        const data = JSON.parse(event.data) as WSMessage;
        console.warn(
          `[WS Table Status] 📨 Message received for connection ${connectionId}:`,
          data,
        );

        if (!connectionId) return;

        if (
          data.table_statuses ||
          data.schema_refresh_in_progress !== undefined ||
          data.next_sync_time !== undefined ||
          data.readable_time_frequency !== undefined
        ) {
          queryClient.setQueryData(
            ["TableStatus", connectionId],
            (oldData: TableStatusCache | undefined) => {
              const currentTables = oldData?.tables || [];
              const newTables = data.table_statuses
                ? data.table_statuses.map((item, index: number) => ({
                    tbl_id: index,
                    table: item.table_name,
                    sequence: index,
                    status:
                      (item.status as "in_progress" | "completed" | "failed") ||
                      null,
                  }))
                : currentTables;

              const newData = {
                ...(oldData || { tables: [] }),
                tables: newTables,
                schema_refresh_in_progress:
                  data.schema_refresh_in_progress ??
                  oldData?.schema_refresh_in_progress ??
                  false,
                readable_time_frequency:
                  data.readable_time_frequency !== undefined
                    ? data.readable_time_frequency
                    : oldData?.readable_time_frequency,
                next_sync_time:
                  data.next_sync_time !== undefined
                    ? data.next_sync_time
                    : oldData?.next_sync_time,
                last_updated: new Date().toISOString(),
                _updateId: Math.random(),
              };

              console.warn(
                `[WS Table Status] 💾 Cache updated for connection ${connectionId}:`,
                `Tables: ${newTables.length}`,
                `Schema Refresh: ${newData.schema_refresh_in_progress}`,
                `Next Sync: ${newData.next_sync_time}`,
              );

              return newData;
            },
          );

          console.warn(
            `[WS Table Status] 🔄 Invalidating queries for connection ${connectionId}`,
          );
          queryClient.invalidateQueries({
            queryKey: ["TableStatus", connectionId],
            refetchType: "active",
          });

          // Sync SchemaStatus if table status indicates refresh is complete
          // This prevents the spinner from getting stuck if SchemaStatus WS message is missed
          if (data.schema_refresh_in_progress === false) {
            console.warn(
              `[WS Table Status] 🔄 Syncing SchemaStatus to false and refreshing lists for ${connectionId}`,
            );
            queryClient.setQueryData(
              ["SchemaStatus", connectionId],
              (old: unknown) => ({
                ...(typeof old === "object" && old !== null ? old : {}),
                is_in_progress: false,
                current_job: null,
                last_updated: new Date().toISOString(),
                _updateId: Math.random(),
              }),
            );

            // Refresh everything related to the schema refresh
            setTimeout(() => {
              const keys = [
                ["SchemaStatus", connectionId],
                ["TableStatus", connectionId],
                ["ReverseSchema", connectionId],
                ["ConnectorTable", connectionId],
              ];
              keys.forEach((queryKey) => {
                queryClient.invalidateQueries({
                  queryKey,
                  refetchType: "active",
                });
              });
            }, 500);
          }
        }
      } catch (e) {
        console.warn(
          `[WS Table Status] ⚠️ Parse error for connection ${connectionId}:`,
          e,
        );
      }
    },
    onError: (error) => {
      console.error(
        `[WS Table Status] ❌ Error for connection ${connectionId}:`,
        error,
      );
    },
    onClose: (event) => {
      console.warn(
        `[WS Table Status] 🔌 Connection closed for connection ${connectionId}:`,
        `Code: ${event.code}`,
        `Reason: ${event.reason}`,
      );
    },
    shouldReconnect: (closeEvent) => closeEvent.code !== 1000,
    reconnectInterval: 3000,
    reconnectAttempts: 10,
    share: true,
    retryOnError: true,
  });
};

export default useConnectionTableStatusWS;
