import ServerRoutes from "@/constants/server-routes";
import AxiosInstance from "@/lib/axios/api-client";

import { useQuery } from "@tanstack/react-query";

interface TransferCountResponse {
  min_transfer_count: number;
  max_transfer_count: number;
}

const fetchTransferCount = async (
  connectionId: number,
): Promise<TransferCountResponse> => {
  const { data } = await AxiosInstance.get<TransferCountResponse>(
    ServerRoutes.connector.fetchConnectorById(connectionId),
  );
  return data;
};

const useFetchTransferCount = (connectionId: number) => {
  return useQuery({
    queryKey: ["transferCount", connectionId],
    queryFn: () => fetchTransferCount(connectionId),
    enabled: !!connectionId,
  });
};

export default useFetchTransferCount;
