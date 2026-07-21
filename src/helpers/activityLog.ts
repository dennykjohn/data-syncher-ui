import { getUiState } from "@/helpers/log";
import { ConnectorActivityLog, Status } from "@/types/connectors";

import { QueryClient } from "@tanstack/react-query";

interface ActivityCache {
  logs: ConnectorActivityLog[];
  last_updated?: string;
  _updateId?: number;
  [key: string]: unknown;
}

export const isDetailedMigrationMessage = (
  message?: string | null,
): boolean => {
  if (!message) return false;
  const lower = message.toLowerCase();
  if (lower.includes("migration in progress")) return false;
  return (
    lower.includes(" seconds") ||
    lower.includes("total rows") ||
    (lower.includes("completed") && lower.includes("tables:"))
  );
};

export const patchConnectorActivityLogs = (
  queryClient: QueryClient,
  connectionId: number,
  updater: (_logs: ConnectorActivityLog[]) => ConnectorActivityLog[],
) => {
  const queries = queryClient.getQueriesData({
    queryKey: ["connectorActivity", Number(connectionId)],
    exact: false,
  });

  queries.forEach(([queryKey]) => {
    queryClient.setQueryData(queryKey, (oldData: ActivityCache | undefined) => {
      if (!oldData?.logs) return oldData;
      const logs = updater(oldData.logs);
      return {
        ...oldData,
        logs,
        last_updated: new Date().toISOString(),
        _updateId: Math.random(),
      };
    });
  });

  queryClient.invalidateQueries({
    queryKey: ["connectorActivity", Number(connectionId)],
    exact: false,
    refetchType: "none",
  });
};

const resolveCompletionMessage = (
  currentMessage: string,
  isFailed: boolean,
  candidateMessage?: string,
): string => {
  if (isDetailedMigrationMessage(candidateMessage)) {
    return candidateMessage as string;
  }
  if (isDetailedMigrationMessage(currentMessage)) {
    return currentMessage;
  }
  if (
    candidateMessage &&
    !candidateMessage.toLowerCase().includes("migration in progress")
  ) {
    return candidateMessage;
  }
  return isFailed ? "Migration failed" : "Migration completed successfully";
};

export const patchActivityLogForMigration = (
  queryClient: QueryClient,
  connectionId: number,
  migrationSessionId: number,
  {
    overallStatus,
    message,
  }: {
    overallStatus: string;
    message?: string;
  },
) => {
  const rawStatus = overallStatus.toLowerCase();
  const isFailed = rawStatus.includes("failed") || rawStatus.includes("error");
  const isCompleted =
    rawStatus.includes("success") || rawStatus.includes("completed");

  if (!isFailed && !isCompleted) return;

  const newStatus: Status = isFailed ? "E" : "S";

  patchConnectorActivityLogs(queryClient, connectionId, (logs) =>
    logs.map((log) => {
      const sessionId = Number(log.migration_id ?? log.session_id);
      const matchesSession =
        sessionId === migrationSessionId && !Number.isNaN(sessionId);
      const matchesLogId =
        log.log_id !== null &&
        log.log_id !== undefined &&
        migrationSessionId !== null &&
        migrationSessionId !== undefined &&
        Number(log.session_id) === migrationSessionId;
      if (!matchesSession && !matchesLogId) return log;

      const nextMessage = resolveCompletionMessage(
        log.message,
        isFailed,
        message,
      );

      return {
        ...log,
        status: newStatus,
        message: nextMessage,
        ui_state: getUiState(undefined, newStatus, nextMessage),
      };
    }),
  );
};
