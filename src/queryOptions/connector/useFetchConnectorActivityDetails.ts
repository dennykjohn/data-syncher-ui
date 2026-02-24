import ServerRoutes from "@/constants/server-routes";
import AxiosInstance from "@/lib/axios/api-client";
import { type ConnectorActivityDetailResponse } from "@/types/connectors";

import { useQuery } from "@tanstack/react-query";

const fetchConnectorActivityDetails = async (
  migrationId: number,
): Promise<ConnectorActivityDetailResponse> => {
  const { data } = await AxiosInstance.get<ConnectorActivityDetailResponse>(
    ServerRoutes.connector.fetchMigrationStatus(migrationId),
  );
  return data;
};

const fetchLogDetails = async (
  connectionId: number,
  logId: number,
): Promise<ConnectorActivityDetailResponse> => {
  const { data } = await AxiosInstance.get<ConnectorActivityDetailResponse>(
    ServerRoutes.connector.fetchLogDetails({ connectionId, logId }),
  );
  return data;
};

const useFetchConnectorActivityDetails = ({
  migrationId,
  connectionId,
  logId,
}: {
  migrationId?: number;
  connectionId?: number;
  logId?: number;
}) => {
  return useQuery({
    queryKey: ["connectorActivityDetails", migrationId, connectionId, logId],
    queryFn: () => {
      if (migrationId) {
        return fetchConnectorActivityDetails(migrationId);
      }
      if (connectionId && logId) {
        return fetchLogDetails(connectionId, logId);
      }
      return Promise.reject(new Error("Missing required parameters"));
    },
    enabled: !!migrationId || (!!connectionId && !!logId),
    // Prevent React Query from re-fetching on window focus and overwriting
    // the WebSocket-patched cache (which has up-to-date end_time values).
    refetchOnWindowFocus: false,
    staleTime: 30_000, // treat data as fresh for 30s so WS updates are not clobbered
  });
};

export default useFetchConnectorActivityDetails;
