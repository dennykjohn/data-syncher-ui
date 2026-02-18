import useWebSocket from "react-use-websocket";

import { SchemaStatusResponse } from "@/types/connectors";

import { useQueryClient } from "@tanstack/react-query";

interface SchemaStatusCache extends SchemaStatusResponse {
  last_updated?: string;
  _updateId?: number;
}

export const useUpdateSchemaStatusWS = (connectionId: number | null) => {
  const queryClient = useQueryClient();

  const isValidId =
    connectionId !== null && !isNaN(connectionId) && connectionId !== 0;

  const socketUrl = isValidId
    ? `wss://qa.datasyncher.com/ws/update_schema_status/${connectionId}/`
    : null;

  useWebSocket(socketUrl, {
    onOpen: () => {
      console.warn(
        `[WS Schema Status] ✅ Connected to: ${socketUrl}`,
        `Connection ID: ${connectionId}`,
      );
    },
    onMessage: (event) => {
      try {
        const data = JSON.parse(event.data);
        console.warn(
          `[WS Schema Status] 📨 Message received for connection ${connectionId}:`,
          data,
        );

        if (!connectionId) return;

        // Deep clone to ensure React detects the change
        const clonedData = JSON.parse(JSON.stringify(data));

        // data is { is_in_progress: boolean, current_job: string, ... }
        queryClient.setQueryData(
          ["SchemaStatus", connectionId],
          (oldData: SchemaStatusCache | undefined) => {
            const newData = {
              ...(oldData || { is_in_progress: false, current_job: null }),
              ...clonedData,
              last_updated: new Date().toISOString(),
              _updateId: Math.random(),
            };
            console.warn(
              `[WS Schema Status] 💾 Cache updated:`,
              `Old:`,
              oldData,
              `New:`,
              newData,
            );
            return newData;
          },
        );

        // Force invalidation to trigger re-render
        console.warn(
          `[WS Schema Status] 🔄 Invalidating queries for connection ${connectionId}`,
        );
        queryClient.invalidateQueries({
          queryKey: ["SchemaStatus", connectionId],
          refetchType: "active",
        });

        // Global Invalidation: If job completes, refresh all related data
        if (data.is_in_progress === false) {
          console.warn(
            `[WS Schema Status] ✅ Job completed for ${connectionId}. Refreshing all lists.`,
          );

          // Small delay to ensure DB is updated before we refetch
          setTimeout(() => {
            const keysToInvalidate = [
              ["ReverseSchema", connectionId],
              ["ConnectorTable", connectionId],
              ["TableStatus", connectionId],
              ["SchemaStatus", connectionId],
            ];

            keysToInvalidate.forEach((queryKey) => {
              queryClient.invalidateQueries({
                queryKey,
                refetchType: "active",
              });
            });
          }, 500);
        }
      } catch (e) {
        console.warn("[WS Schema Status] ⚠️ Parse error:", e);
      }
    },
    onError: (error) => {
      console.error(
        `[WS Schema Status] ❌ Error for connection ${connectionId}:`,
        error,
      );
    },
    onClose: (event) => {
      console.warn(
        `[WS Schema Status] 🔌 Connection closed for ${connectionId}:`,
        `Code: ${event.code}`,
        `Reason: ${event.reason}`,
      );
    },
    shouldReconnect: () => true,
    reconnectInterval: 3000,
    reconnectAttempts: 10,
    share: true, // Enable sharing for better reliability across observers
    retryOnError: true,
  });
};

export default useUpdateSchemaStatusWS;
