import ServerRoutes from "@/constants/server-routes";
import AxiosInstance from "@/lib/axios/api-client";

import {
  type MatchedTable,
  type PreviewPatternRequest,
  type PreviewPatternResponse,
  type SFTPPreviewPatternRequest,
} from "./types/connector";
import { useQuery } from "@tanstack/react-query";

export type {
  PreviewPatternRequest,
  SFTPPreviewPatternRequest,
  PreviewPatternResponse,
  MatchedTable,
};

const fetchPreviewPattern = async (
  data: PreviewPatternRequest | SFTPPreviewPatternRequest,
) => {
  const isSftp =
    !!(data as SFTPPreviewPatternRequest).sftp_host ||
    !!(data as SFTPPreviewPatternRequest).root_folder ||
    !!data.isSftp;
  const source = isSftp ? "sftp" : "s3";
  const endpoint = ServerRoutes.connector.previewdata({ source });

  const { data: responseData } = await AxiosInstance.post(endpoint, data);

  if (Array.isArray(responseData)) {
    return {
      matched_files: responseData,
      matched_tables: responseData,
      matched_files_count: responseData.length,
    } as PreviewPatternResponse;
  }

  return {
    ...responseData,
    matched_tables:
      responseData.matched_files ||
      responseData.matched_tables ||
      responseData.tables,
  } as PreviewPatternResponse;
};

export default function usePreviewPatternTables(
  data: PreviewPatternRequest | SFTPPreviewPatternRequest,
  enabled: boolean = true,
) {
  return useQuery<PreviewPatternResponse>({
    queryKey: ["PreviewPatternTables", data],
    queryFn: () => fetchPreviewPattern(data),
    enabled: enabled && !!data.multi_files_prefix,
  });
}
