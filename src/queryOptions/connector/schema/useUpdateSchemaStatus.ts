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
  const prevEnabledRef = useRef(enabled);

  useEffect(() => {
    const prevConnectionId = prevConnectionIdRef.current;
    prevConnectionIdRef.current = connectionId;
    prevEnabledRef.current = enabled;

    if (!connectionId) {
      return;
    }

    let pollTimeout: NodeJS.Timeout | null = null;
    let isMounted = true;
    let isPolling = false;

    const stopPolling = () => {
      if (pollTimeout) {
        clearTimeout(pollTimeout);
        pollTimeout = null;
        isPolling = false;
      }
    };

    const pollOnce = async () => {
      if (!isMounted || !isPolling) return;

      try {
        const response = await checkSchemaStatus(connectionId);

        if (!isMounted) return;

        setStatus(response);

        if (!response.is_in_progress) {
          stopPolling();
          return;
        }
      } catch {
        if (!isMounted) return;
        stopPolling();
        return;
      }

      if (isPolling && isMounted) {
        pollTimeout = setTimeout(pollOnce, 2000);
      }
    };

    const startPolling = () => {
      if (isPolling || !isMounted) return;
      isPolling = true;
      pollOnce();
    };

    const checkStatus = async () => {
      if (!isMounted) return;

      try {
        const response = await checkSchemaStatus(connectionId);

        if (!isMounted) return;

        setStatus(response);

        if (response.is_in_progress && !isPolling) {
          startPolling();
        } else if (!response.is_in_progress) {
          stopPolling();
        }
      } catch {
        if (!isMounted) return;
        stopPolling();
      }
    };

    // Only hit the API when explicitly enabled.
    // This prevents automatic status checks when the Schema page first loads.
    if (!enabled) {
      return;
    }

    checkStatus();

    let checkInterval: NodeJS.Timeout | null = null;

    if (enabled) {
      checkInterval = setInterval(() => {
        if (!isMounted || isPolling) return;
        checkStatus();
      }, 10000);
    }

    return () => {
      isMounted = false;
      stopPolling();
      if (checkInterval) {
        clearInterval(checkInterval);
      }
      if (connectionId !== prevConnectionId) {
        setStatus(null);
      }
    };
  }, [connectionId, enabled]);

  return { status };
};

export default useUpdateSchemaStatus;
