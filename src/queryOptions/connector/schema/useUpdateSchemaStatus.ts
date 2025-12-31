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
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data) return 2000;
      return data.is_in_progress ? 2000 : false;
    },
  });

  return { ...query, status: query.data };
};

export default useUpdateSchemaStatus;
