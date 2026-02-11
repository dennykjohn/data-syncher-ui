import ServerRoutes from "@/constants/server-routes";
import AxiosInstance from "@/lib/axios/api-client";
import { type ConnectorActivityResponse } from "@/types/connectors";

import { useQuery } from "@tanstack/react-query";

const fetchFilteredConnectorActivity = async (
  id: number,
  filterDays: number,
  status: string,
): Promise<ConnectorActivityResponse> => {
  const { data } = await AxiosInstance.get<ConnectorActivityResponse>(
    ServerRoutes.connector.fetchConnectionActivityWithStatus({
      id,
      filterDays,
      status,
    }),
  );
  return data;
};

const useFetchFilteredConnectorActivity = (
  id: number,
  filterDays: number,
  status?: string,
) => {
  return useQuery({
    queryKey: ["filteredConnectorActivity", id, filterDays, status],
    queryFn: () => fetchFilteredConnectorActivity(id, filterDays, status!),
    enabled: !!id && filterDays > 0 && !!status,
  });
};

export default useFetchFilteredConnectorActivity;
