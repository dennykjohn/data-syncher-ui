import ServerRoutes from "@/constants/server-routes";
import AxiosInstance from "@/lib/axios/api-client";
import { type ConnectorActivityResponse } from "@/types/connectors";

import { useQuery } from "@tanstack/react-query";

const fetchConnectorActivity = async (
  id: number,
  filterDays: number,
): Promise<ConnectorActivityResponse> => {
  const { data } = await AxiosInstance.get<ConnectorActivityResponse>(
    ServerRoutes.connector.fetchConnectionActivity({ id, filterDays }),
  );
  return data;
};

const useFetchConnectorActivity = (id: number, filterDays: number) => {
  return useQuery({
    queryKey: ["connectorActivity", id, filterDays],
    queryFn: () => fetchConnectorActivity(id, filterDays),
    enabled: !!id && filterDays > 0,
  });
};

export default useFetchConnectorActivity;
