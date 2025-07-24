import ServerRoutes from "@/constants/server-routes";
import AxiosInstance from "@/lib/axios/api-client";
import { type MasterDestinationList } from "@/types/destination";

import { useSuspenseQuery } from "@tanstack/react-query";

export default function useFetchMasterDestinationList() {
  return useSuspenseQuery<MasterDestinationList>({
    queryKey: ["masterDestinationList"],
    queryFn: fetchMasterDestinationList,
  });
}

const fetchMasterDestinationList = async () => {
  const { data } = await AxiosInstance.get(
    ServerRoutes.destination.listMasterDestinations(),
  );
  return data;
};
