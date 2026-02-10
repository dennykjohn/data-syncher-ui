import useWebSocket from "react-use-websocket";

import { getUiState } from "@/helpers/log";
import { ConnectorActivityLog, Status } from "@/types/connectors";

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
    onOpen: () => {},
    onMessage: (event) => {
      try {
        const message = JSON.parse(event.data);
        if (!connectionId) return;

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

                const newLogs = message.logs.map(
                  (log: ConnectorActivityLog & { ui_state?: string }) => {
                    const uiState = getUiState(
                      log.ui_state,
                      log.status,
                      log.message,
                    );

                    return {
                      ...log,
                      ui_state: uiState,
                    };
                  },
                );

                const newData: ActivityCache = {
                  ...oldData,
                  logs: newLogs,
                  last_updated: new Date().toISOString(),
                  _updateId: Math.random(),
                };

                return newData;
              },
            );
          });
        }

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

                let newStatus: Status = "P";
                if (
                  rawStatus === "s" ||
                  rawStatus.includes("success") ||
                  rawStatus.includes("completed")
                )
                  newStatus = "S";
                else if (
                  rawStatus === "e" ||
                  rawStatus.includes("failed") ||
                  rawStatus.includes("error")
                )
                  newStatus = "E";

                const uiState = getUiState(
                  message.ui_state,
                  rawStatus,
                  message.message,
                );

                let updatedLogs: ConnectorActivityLog[];
                if (logIndex > -1) {
                  updatedLogs = [...logs];
                  updatedLogs[logIndex] = {
                    ...updatedLogs[logIndex],
                    status: newStatus,
                    ui_state: uiState,
                    message: message.message || updatedLogs[logIndex].message,
                    timestamp:
                      message.timestamp || updatedLogs[logIndex].timestamp,
                    trigger_type:
                      message.trigger_type ||
                      updatedLogs[logIndex].trigger_type,
                  };
                } else {
                  updatedLogs = [
                    {
                      migration_id: numericSessionId,
                      session_id: numericSessionId,
                      message: message.message || "Migration initiated...",
                      status: newStatus,
                      ui_state: uiState,
                      timestamp: message.timestamp || new Date().toISOString(),
                      user_name: message.user_name || "System",
                      is_clickable: true,
                      trigger_type: message.trigger_type,
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
      } catch {
        // Ignore JSON parse errors
      }
    },
    onError: (_error) => {},
    onClose: (_event) => {},
    shouldReconnect: () => true,
    reconnectInterval: 3000,
    reconnectAttempts: 10,
    share: false,
    retryOnError: true,
  });
};

export default useConnectionActivityLogWS;
