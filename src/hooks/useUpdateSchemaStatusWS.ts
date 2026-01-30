import useWebSocket from "react-use-websocket";

import { SchemaStatusResponse } from "@/types/connectors";

import { useQueryClient } from "@tanstack/react-query";

interface SchemaStatusCache extends SchemaStatusResponse {
  last_updated?: string;
  _updateId?: number;
}

export const useUpdateSchemaStatusWS = (connectionId: number | null) => {
  const queryClient = useQueryClient();

  const socketUrl = connectionId
    ? `wss://qa.datasyncher.com/ws/update_schema_status/${connectionId}/`
    : null;

  useWebSocket(socketUrl, {
    onOpen: () => {
      // Connected
    },
    onMessage: (event) => {
      try {
        const data = JSON.parse(event.data);
        if (!connectionId) return;

        // Deep clone to ensure React detects the change
        const clonedData = JSON.parse(JSON.stringify(data));

        // data is { is_in_progress: boolean, current_job: string, ... }
        queryClient.setQueryData(
          ["SchemaStatus", connectionId],
          (oldData: SchemaStatusCache | undefined) => ({
            ...(oldData || { is_in_progress: false, current_job: null }),
            ...clonedData,
            last_updated: new Date().toISOString(),
            _updateId: Math.random(),
          }),
        );

        // Force invalidation to trigger re-render
        queryClient.invalidateQueries({
          queryKey: ["SchemaStatus", connectionId],
          refetchType: "none",
        });

        // If job completed, invalidate ConnectorTable to fetch fresh schema
        if (data.is_in_progress === false) {
          queryClient.invalidateQueries({
            queryKey: ["ConnectorTable", connectionId],
          });
        }
      } catch (e) {
        console.warn("[WS Schema Status] Parse error", e);
      }
    },
    onError: (error) => {
      console.error(`[WS Schema Status] ❌ Error:`, error);
    },
    onClose: (event) => {
      console.warn(
        `[WS Schema Status] 🔌 Connection closed:`,
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

export default useUpdateSchemaStatusWS;
