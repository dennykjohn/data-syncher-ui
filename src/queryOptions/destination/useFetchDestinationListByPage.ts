import ServerRoutes from "@/constants/server-routes";
import AxiosInstance from "@/lib/axios/api-client";
import { type DestinationTableItem } from "@/types/destination";
import { type PaginationResponse } from "@/types/pagination";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

export interface FetchDestinationsParams {
  page: number;
  size: number;
}

async function fetchDestinationListByPage(
  params: FetchDestinationsParams,
): Promise<PaginationResponse<DestinationTableItem>> {
  const { page, size } = params;
  const { data } = await AxiosInstance.get(
    ServerRoutes.destination.listDestinationsByPage({ page, size }),
  );
  return data;
}

export function useFetchDestinationListByPage(params: FetchDestinationsParams) {
  return useQuery<PaginationResponse<DestinationTableItem>, Error>({
    queryKey: ["destinations", params.page, params.size],
    queryFn: () => fetchDestinationListByPage(params),
    placeholderData: keepPreviousData,
  });
}
