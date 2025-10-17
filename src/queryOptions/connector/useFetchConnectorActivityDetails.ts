import ServerRoutes from "@/constants/server-routes";
import AxiosInstance from "@/lib/axios/api-client";
import { type ConnectorActivityDetailResponse } from "@/types/connectors";

import { useQuery } from "@tanstack/react-query";

const fetchConnectorActivityDetails = async (
  connectionId: number,
  sessionId: number,
): Promise<ConnectorActivityDetailResponse> => {
  const { data } = await AxiosInstance.get<ConnectorActivityDetailResponse>(
    ServerRoutes.connector.fetchConnectionActivityDetails({
      connectionId,
      sessionId,
    }),
  );
  return data;
};

const useFetchConnectorActivityDetails = ({
  connectionId,
  sessionId,
}: {
  connectionId: number;
  sessionId: number;
}) => {
  return useQuery({
    queryKey: ["connectorActivityDetails", connectionId, sessionId],
    queryFn: () => fetchConnectorActivityDetails(connectionId, sessionId),
    enabled: !!connectionId && !!sessionId,
  });
};

export default useFetchConnectorActivityDetails;
