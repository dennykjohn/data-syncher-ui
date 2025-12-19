import { useEffect, useRef, useState } from "react";

import ServerRoutes from "@/constants/server-routes";
import AxiosInstance from "@/lib/axios/api-client";
import { type SchemaStatusResponse } from "@/types/connectors";

const checkSchemaStatus = async (
  connectionId: number,
): Promise<SchemaStatusResponse> => {
  const { data } = await AxiosInstance.get<SchemaStatusResponse>(
    ServerRoutes.connector.updateSchemaStatus(connectionId),
  );
  return data;
};

const useUpdateSchemaStatus = (connectionId: number, enabled: boolean) => {
  const [status, setStatus] = useState<SchemaStatusResponse | null>(null);
  const prevConnectionIdRef = useRef(connectionId);

  useEffect(() => {
    const prevConnectionId = prevConnectionIdRef.current;
    prevConnectionIdRef.current = connectionId;

    if (!enabled || !connectionId) {
      return;
    }

    let pollTimeout: NodeJS.Timeout | null = null;
    let checkInterval: NodeJS.Timeout | null = null;
    let isMounted = true;
    let isPolling = false;

    const stopPolling = () => {
      if (pollTimeout) {
        clearTimeout(pollTimeout);
        pollTimeout = null;
        isPolling = false;
      }
    };

    const stopCheckInterval = () => {
      if (checkInterval) {
        clearInterval(checkInterval);
        checkInterval = null;
      }
    };

    const startPolling = () => {
      if (isPolling || !isMounted) return;

      isPolling = true;
      // Stop check interval when we start active polling
      stopCheckInterval();

      // Poll immediately, then continue every 2 seconds
      const pollOnce = async () => {
        if (!isMounted || !isPolling) return;

        try {
          const response = await checkSchemaStatus(connectionId);

          if (!isMounted) return;

          setStatus(response);

          // If is_in_progress becomes false, stop polling
          if (!response.is_in_progress) {
            stopPolling();
            return;
          }
        } catch (error) {
          if (!isMounted) return;
          console.error("Error checking schema status:", error);
          stopPolling();
          return;
        }

        // Schedule next poll if still in progress
        if (isPolling && isMounted) {
          pollTimeout = setTimeout(pollOnce, 2000);
        }
      };

      // Start polling immediately
      pollOnce();
    };

    const checkStatus = async () => {
      if (!isMounted) return;

      try {
        const response = await checkSchemaStatus(connectionId);

        if (!isMounted) return;

        setStatus(response);

        // If is_in_progress is true and we're not polling, start polling
        if (response.is_in_progress && !isPolling) {
          startPolling();
        }
        // If is_in_progress is false, stop everything
        else if (!response.is_in_progress) {
          stopPolling();
          stopCheckInterval();
        }
      } catch (error) {
        if (!isMounted) return;
        console.error("Error checking schema status:", error);
        stopPolling();
        stopCheckInterval();
      }
    };

    // Initial check
    checkStatus();

    // Start check interval only if we're not already polling
    // This will check periodically to detect when a new job starts
    // But we'll stop it when is_in_progress is false to avoid unnecessary calls
    if (!isPolling) {
      checkInterval = setInterval(() => {
        if (!isMounted || isPolling) return;
        checkStatus();
      }, 10000); // Check every 10 seconds when not in progress
    }

    return () => {
      isMounted = false;
      stopPolling();
      stopCheckInterval();
      // Only reset status when connectionId changes (not when just navigating away)
      // This allows status to persist across navigation
      if (connectionId !== prevConnectionId) {
        setStatus(null);
      }
    };
  }, [connectionId, enabled]);

  return { status };
};

export default useUpdateSchemaStatus;
