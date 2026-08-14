import ServerRoutes from "@/constants/server-routes";
import AxiosInstance from "@/lib/axios/api-client";

import { fileSourceApiSegmentFromRequest } from "./fileSourceUtils";
import {
  type S3FileItem,
  type S3ListFilesRequest,
  type S3ListFilesResponse,
  type SFTPListFilesRequest,
} from "./types/connector";
import { useQuery } from "@tanstack/react-query";

export type {
  S3ListFilesRequest,
  SFTPListFilesRequest,
  S3ListFilesResponse,
  S3FileItem,
};

const fetchS3Files = async (
  data: S3ListFilesRequest | SFTPListFilesRequest,
) => {
  const source = fileSourceApiSegmentFromRequest(data);
  const endpoint = ServerRoutes.connector.listFiles({ source });

  const { data: responseData } = await AxiosInstance.post(endpoint, data);

  if (Array.isArray(responseData)) {
    return { tables: responseData as S3FileItem[] };
  }

  const payload = responseData as S3ListFilesResponse;

  if (payload?.result && Array.isArray(payload.result.tables)) {
    return {
      ...payload,
      ...payload.result,
      tables: payload.result.tables,
    };
  }

  return {
    ...payload,
    tables: Array.isArray(payload?.tables) ? payload.tables : [],
  };
};

export default function useFetchS3Files(
  data: S3ListFilesRequest | SFTPListFilesRequest,
  enabled: boolean = true,
) {
  const s3Bucket = (data as S3ListFilesRequest).s3_bucket;
  const sftpHost = (data as SFTPListFilesRequest).sftp_host;
  const rootFolder = (data as SFTPListFilesRequest).root_folder;
  const sourceType = data.sourceType;

  return useQuery<S3ListFilesResponse>({
    queryKey: ["S3Files", data],
    queryFn: () => fetchS3Files(data),
    enabled:
      enabled &&
      (!!s3Bucket ||
        !!sftpHost ||
        !!rootFolder ||
        !!sourceType ||
        !!data.connection_id),
  });
}
