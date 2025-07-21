import ServerRoutes from "@/constants/server-routes";
import AxiosInstance from "@/lib/axios/api-client";

import { queryOptions } from "@tanstack/react-query";

export default function fetchAllDestinations() {
  return queryOptions({
    queryKey: ["allDestinations"],
    queryFn: async () => {
      const { data } = await AxiosInstance.get(
        ServerRoutes.destination.listAllDestinations(),
      );
      return data;
    },
  });
}
