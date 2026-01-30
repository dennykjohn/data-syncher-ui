import useWebSocket from "react-use-websocket";

import { ConnectorActivityLog } from "@/types/connectors";

import { useQueryClient } from "@tanstack/react-query";

interface ActivityCache {
  logs: ConnectorActivityLog[];
  last_updated?: string;
  _updateId?: number;
  [key: string]: unknown;
}

export const useConnectionActivityLogWS = (connectionId: number | null) => {
  const queryClient = useQueryClient();

  const socketUrl = connectionId
    ? `wss://qa.datasyncher.com/ws/connection_activity_log/${connectionId}/`
    : null;

  useWebSocket(socketUrl, {
    onOpen: () => {
      // socket opened
    },
    onMessage: (event) => {
      try {
        const message = JSON.parse(event.data);

        if (!connectionId) return;

        // Check if backend is sending the full logs array (new format)
        if (message.logs && Array.isArray(message.logs)) {
          const queries = queryClient.getQueriesData({
            queryKey: ["connectorActivity", Number(connectionId)],
            exact: false,
          });

          queries.forEach(([queryKey]) => {
            queryClient.setQueryData(
              queryKey,
              (oldData: ActivityCache | undefined) => {
                if (!oldData) {
                  return oldData;
                }

                // Create a completely new object structure to force React to detect changes
                // Deep clone the logs array to ensure referential inequality
                const newLogs = JSON.parse(JSON.stringify(message.logs));

                const newData: ActivityCache = {
                  ...oldData,
                  logs: newLogs,
                  last_updated: new Date().toISOString(),
                  // Add a random key to force React to see this as a new object
                  _updateId: Math.random(),
                };

                return newData;
              },
            );
          });

          // Immediately invalidate to force re-render
          queryClient.invalidateQueries({
            queryKey: ["connectorActivity", Number(connectionId)],
            exact: false,
            refetchType: "none",
          });
          return;
        }

        // Fallback: Handle individual log messages (old format)
        const sessionId =
          message.migration_session_id ||
          message.session_id ||
          message.migration_id ||
          message.id;
        const numericSessionId = Number(sessionId);

        if (numericSessionId) {
          const queries = queryClient.getQueriesData({
            queryKey: ["connectorActivity", Number(connectionId)],
            exact: false,
          });

          queries.forEach(([queryKey]) => {
            queryClient.setQueryData(
              queryKey,
              (oldData: ActivityCache | undefined) => {
                if (!oldData) {
                  return oldData;
                }
                const logs = oldData.logs || [];

                const logIndex = logs.findIndex(
                  (l) =>
                    Number(l.migration_id || l.session_id) === numericSessionId,
                );

                const rawStatus = (
                  message.overall_status ||
                  message.status ||
                  message.message ||
                  ""
                ).toLowerCase();
                let newStatus: "S" | "W" | "E" | "P" | "I" = "P"; // Pending/Progress
                if (
                  rawStatus.includes("success") ||
                  rawStatus.includes("completed")
                )
                  newStatus = "S";
                else if (
                  rawStatus.includes("failed") ||
                  rawStatus.includes("error")
                )
                  newStatus = "E";

                let updatedLogs: ConnectorActivityLog[];
                if (logIndex > -1) {
                  updatedLogs = [...logs];
                  updatedLogs[logIndex] = {
                    ...updatedLogs[logIndex],
                    status: newStatus,
                    message: message.message || updatedLogs[logIndex].message,
                    timestamp:
                      message.timestamp || updatedLogs[logIndex].timestamp,
                  };
                } else {
                  updatedLogs = [
                    {
                      migration_id: numericSessionId,
                      session_id: numericSessionId,
                      message: message.message || "Migration initiated...",
                      status: newStatus,
                      timestamp: message.timestamp || new Date().toISOString(),
                      user_name: message.user_name || "System",
                      is_clickable: true,
                    },
                    ...logs,
                  ];
                }

                const newData: ActivityCache = {
                  ...oldData,
                  logs: updatedLogs,
                };
                return newData;
              },
            );
          });
        }
      } catch (e) {
        console.warn("[WS Activity Log] Parse error", e);
      }
    },
    onError: (error) => {
      console.error(`[WS Activity Log] ❌ Error:`, error);
    },
    onClose: (event) => {
      console.warn(
        `[WS Activity Log] 🔌 Connection closed:`,
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

export default useConnectionActivityLogWS;
