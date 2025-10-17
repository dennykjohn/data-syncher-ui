import ServerRoutes from "@/constants/server-routes";
import AxiosInstance from "@/lib/axios/api-client";
import { type ConnectorActivityResponse } from "@/types/connectors";

import { useQuery } from "@tanstack/react-query";

const fetchConnectorActivity = async (
  id: number,
): Promise<ConnectorActivityResponse> => {
  const { data } = await AxiosInstance.get<ConnectorActivityResponse>(
    ServerRoutes.connector.fetchConnectionActivity(id),
  );
  return data;
};

const useFetchConnectorActivity = (id: number) => {
  return useQuery({
    queryKey: ["connectorActivity", id],
    queryFn: () => fetchConnectorActivity(id),
    enabled: !!id,
  });
};

export default useFetchConnectorActivity;
