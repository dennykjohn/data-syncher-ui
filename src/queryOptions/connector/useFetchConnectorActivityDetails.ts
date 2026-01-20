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

const useFetchConnectorActivityDetails = ({
  migrationId,
}: {
  migrationId: number;
}) => {
  return useQuery({
    queryKey: ["connectorActivityDetails", migrationId],
    queryFn: () => fetchConnectorActivityDetails(migrationId),
    enabled: !!migrationId,
    refetchInterval: 3000,
  });
};

export default useFetchConnectorActivityDetails;
