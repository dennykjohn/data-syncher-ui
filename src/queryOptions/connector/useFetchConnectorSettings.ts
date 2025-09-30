import ServerRoutes from "@/constants/server-routes";
import AxiosInstance from "@/lib/axios/api-client";
import { type ConnectorSettingsApiResponse } from "@/types/connectors";

import { useQuery } from "@tanstack/react-query";

const fetchConnectorSettings = async (
  id: string,
): Promise<ConnectorSettingsApiResponse> => {
  const { data } = await AxiosInstance.get<ConnectorSettingsApiResponse>(
    ServerRoutes.connector.fetchConnectorSettings(id),
  );
  return data;
};

const useFetchConnectorSettings = (id: string) => {
  return useQuery({
    queryKey: ["ConnectorSettings", id],
    queryFn: () => fetchConnectorSettings(id),
    enabled: !!id,
  });
};

export default useFetchConnectorSettings;
