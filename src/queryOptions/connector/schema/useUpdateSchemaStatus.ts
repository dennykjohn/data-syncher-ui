import ServerRoutes from "@/constants/server-routes";
import AxiosInstance from "@/lib/axios/api-client";
import { type SchemaStatusResponse } from "@/types/connectors";

import { useQuery } from "@tanstack/react-query";

const checkSchemaStatus = async (
  connectionId: number,
): Promise<SchemaStatusResponse> => {
  const { data } = await AxiosInstance.get<SchemaStatusResponse>(
    ServerRoutes.connector.updateSchemaStatus(connectionId),
  );
  return data;
};

const useUpdateSchemaStatus = (connectionId: number, enabled: boolean) => {
  const query = useQuery({
    queryKey: ["SchemaStatus", connectionId],
    queryFn: () => checkSchemaStatus(connectionId),
    enabled: !!connectionId && enabled,
    // WebSocket updates are the fast path, but a completion event can be
    // missed while the socket is reconnecting. Poll only while an update is
    // active so a stale `is_in_progress: true` cannot leave the UI spinning
    // until the page is refreshed.
    refetchInterval: (statusQuery) =>
      statusQuery.state.data?.is_in_progress ? 3000 : false,
    refetchIntervalInBackground: true,
    staleTime: 0,
    refetchOnMount: true,
  });

  return { ...query, status: query.data };
};

export default useUpdateSchemaStatus;
