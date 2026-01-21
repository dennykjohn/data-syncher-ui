import ServerRoutes from "@/constants/server-routes";
import AxiosInstance from "@/lib/axios/api-client";

import {
  type ColumnSuggestion,
  type SuggestPrimaryKeysRequest,
  type SuggestPrimaryKeysResponse,
  type TableSuggestion,
} from "./types/connector";
import { useQuery } from "@tanstack/react-query";

export type {
  SuggestPrimaryKeysRequest,
  SuggestPrimaryKeysResponse,
  TableSuggestion,
  ColumnSuggestion,
};

const fetchSuggestPrimaryKeys = async (data: SuggestPrimaryKeysRequest) => {
  const { data: responseData } = await AxiosInstance.post(
    ServerRoutes.connector.suggestPrimaryKeys(),
    data,
  );
  return responseData as SuggestPrimaryKeysResponse;
};

export default function useSuggestPrimaryKeys(
  data: SuggestPrimaryKeysRequest,
  enabled: boolean = true,
) {
  return useQuery<SuggestPrimaryKeysResponse>({
    queryKey: ["SuggestPrimaryKeys", data],
    queryFn: () => fetchSuggestPrimaryKeys(data),
    enabled: enabled && (!!data.connection_id || !!data.s3_bucket),
  });
}
