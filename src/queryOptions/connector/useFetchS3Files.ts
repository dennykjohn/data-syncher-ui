import ServerRoutes from "@/constants/server-routes";
import AxiosInstance from "@/lib/axios/api-client";

import {
  type S3FileItem,
  type S3ListFilesRequest,
  type S3ListFilesResponse,
} from "./types/connector";
import { useQuery } from "@tanstack/react-query";

export type { S3ListFilesRequest, S3ListFilesResponse, S3FileItem };

const fetchS3Files = async (data: S3ListFilesRequest) => {
  const { data: responseData } = await AxiosInstance.post(
    ServerRoutes.s3.listFiles(),
    data,
  );
  return responseData as S3ListFilesResponse;
};

export default function useFetchS3Files(
  data: S3ListFilesRequest,
  enabled: boolean = true,
) {
  return useQuery<S3ListFilesResponse>({
    queryKey: ["S3Files", data],
    queryFn: () => fetchS3Files(data),
    enabled: enabled && !!data.s3_bucket,
  });
}
