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
    onOpen: () => {},
    onMessage: (event) => {
      try {
        const data = JSON.parse(event.data) as WSMessage;
        if (!connectionId) return;

        if (
          data.table_statuses ||
          data.schema_refresh_in_progress !== undefined
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

              return {
                ...(oldData || { tables: [] }),
                tables: newTables,
                schema_refresh_in_progress:
                  data.schema_refresh_in_progress ??
                  oldData?.schema_refresh_in_progress ??
                  false,
                readable_time_frequency:
                  data.readable_time_frequency ||
                  oldData?.readable_time_frequency,
                last_updated: new Date().toISOString(),
                _updateId: Math.random(),
              };
            },
          );

          queryClient.invalidateQueries({
            queryKey: ["TableStatus", connectionId],
            refetchType: "none",
          });
        }
      } catch {
        void 0;
      }
    },
    onError: () => {
      void 0;
    },
    onClose: () => {
      void 0;
    },
    shouldReconnect: () => true,
    reconnectInterval: 3000,
    reconnectAttempts: 10,
    share: true,
    retryOnError: true,
  });
};

export default useConnectionTableStatusWS;
