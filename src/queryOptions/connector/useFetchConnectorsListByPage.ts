import ServerRoutes from "@/constants/server-routes";
import AxiosInstance from "@/lib/axios/api-client";
import { type ConnectorTableItem } from "@/types/connectors";
import { type PaginationResponse } from "@/types/pagination";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

export interface FetchConnectorsParams {
  page: number;
  size: number;
}

async function fetchConnectorsListByPage(
  params: FetchConnectorsParams,
): Promise<PaginationResponse<ConnectorTableItem>> {
  const { page, size } = params;
  const { data } = await AxiosInstance.get(
    ServerRoutes.connector.listConnectorsByPage({ page, size }),
  );
  return data;
}

export function useFetchConnectorsListByPage(params: FetchConnectorsParams) {
  return useQuery<PaginationResponse<ConnectorTableItem>, Error>({
    queryKey: ["connectors", params.page, params.size],
    queryFn: () => fetchConnectorsListByPage(params),
    placeholderData: keepPreviousData,
  });
}
