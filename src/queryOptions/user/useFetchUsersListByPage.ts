import ServerRoutes from "@/constants/server-routes";
import AxiosInstance from "@/lib/axios/api-client";
import { type PaginationResponse } from "@/types/pagination";
import { type UserTableItem } from "@/types/user";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

export interface FetchUsersParams {
  page: number;
  size: number;
}

async function fetchUsersListByPage(
  params: FetchUsersParams,
): Promise<PaginationResponse<UserTableItem>> {
  const { page, size } = params;
  const { data } = await AxiosInstance.get(
    ServerRoutes.user.listUsersByPage({ page, size }),
  );
  return data;
}

export function useFetchUsersListByPage(params: FetchUsersParams) {
  return useQuery<PaginationResponse<UserTableItem>, Error>({
    queryKey: ["users", params.page, params.size],
    queryFn: () => fetchUsersListByPage(params),
    placeholderData: keepPreviousData,
  });
}
