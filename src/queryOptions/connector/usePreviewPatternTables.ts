import ServerRoutes from "@/constants/server-routes";
import AxiosInstance from "@/lib/axios/api-client";

import {
  type MatchedTable,
  type PreviewPatternRequest,
  type PreviewPatternResponse,
} from "./types/connector";
import { useQuery } from "@tanstack/react-query";

export type { PreviewPatternRequest, PreviewPatternResponse, MatchedTable };

const fetchPreviewPattern = async (data: PreviewPatternRequest) => {
  const { data: responseData } = await AxiosInstance.post(
    ServerRoutes.connector.previewdata(),
    data,
  );

  if (Array.isArray(responseData)) {
    return {
      matched_files: responseData,
      matched_tables: responseData,
      matched_files_count: responseData.length,
    } as PreviewPatternResponse;
  }

  return {
    ...responseData,
    matched_tables: responseData.matched_files || responseData.matched_tables,
  } as PreviewPatternResponse;
};

export default function usePreviewPatternTables(
  data: PreviewPatternRequest,
  enabled: boolean = true,
) {
  return useQuery<PreviewPatternResponse>({
    queryKey: ["PreviewPatternTables", data],
    queryFn: () => fetchPreviewPattern(data),
    enabled: enabled && !!data.multi_files_prefix,
  });
}
