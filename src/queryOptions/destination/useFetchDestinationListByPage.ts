import ServerRoutes from "@/constants/server-routes";
import AxiosInstance from "@/lib/axios/api-client";
import { type DestinationTableItem } from "@/types/destination";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

export interface FetchDestinationsParams {
  page: number;
  size: number;
}

export interface PaginationResponse<T> {
  content: T[];
  totalElements: number;
  size: number;
}

async function fetchDestinationListByPage(
  params: FetchDestinationsParams,
): Promise<PaginationResponse<DestinationTableItem>> {
  const { page, size } = params;
  const { data } = await AxiosInstance.get(
    ServerRoutes.destination.listDestinations({ page, size }),
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
