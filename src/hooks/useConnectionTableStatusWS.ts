import useWebSocket from "react-use-websocket";

import { ConnectorSelectedTable } from "@/types/connectors";

import { useQueryClient } from "@tanstack/react-query";

interface TableStatusCache {
  tables: ConnectorSelectedTable[];
  schema_refresh_in_progress?: boolean;
  readable_time_frequency?: string;
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
  readable_time_frequency?: string;
}

export const useConnectionTableStatusWS = (connectionId: number | null) => {
  const queryClient = useQueryClient();

  const socketUrl = connectionId
    ? `wss://qa.datasyncher.com/ws/connection_table_status/${connectionId}/`
    : null;

  useWebSocket(socketUrl, {
    onOpen: () => {
      // socket connected
    },
    onMessage: (event) => {
      try {
        const data = JSON.parse(event.data) as WSMessage;
        if (!connectionId) return;

        // Backend sends: { table_statuses: Array, schema_refresh_in_progress: boolean, readable_time_frequency: string }
        if (
          data.table_statuses ||
          data.schema_refresh_in_progress !== undefined
        ) {
          // Transform table_statuses to match the format expected by components
          const tables =
            data.table_statuses?.map((item, index: number) => ({
              tbl_id: index,
              table: item.table_name,
              sequence: index,
              status:
                (item.status as "in_progress" | "completed" | "failed") || null,
            })) || [];

          queryClient.setQueryData(
            ["TableStatus", connectionId],
            (oldData: TableStatusCache | undefined) => ({
              ...(oldData || { tables: [] }),
              tables: tables, // Store as 'tables' to match API format
              schema_refresh_in_progress:
                data.schema_refresh_in_progress ??
                oldData?.schema_refresh_in_progress ??
                false,
              readable_time_frequency:
                data.readable_time_frequency ||
                oldData?.readable_time_frequency,
              last_updated: new Date().toISOString(),
              _updateId: Math.random(),
            }),
          );

          // Force invalidation to trigger re-render
          queryClient.invalidateQueries({
            queryKey: ["TableStatus", connectionId],
            refetchType: "none",
          });
        }
      } catch (e) {
        console.warn("[WS Table Status] Parse error", e);
      }
    },
    onError: (error) => {
      console.error(`[WS Table Status] ❌ Error:`, error);
    },
    onClose: (event) => {
      console.warn(
        `[WS Table Status] 🔌 Connection closed:`,
        event.code,
        event.reason,
      );
    },
    shouldReconnect: () => true,
    reconnectInterval: 3000,
    reconnectAttempts: 10,
    share: false, // Disable sharing to prevent message buffering
    retryOnError: true,
  });
};

export default useConnectionTableStatusWS;
