import ServerRoutes from "@/constants/server-routes";
import AxiosInstance from "@/lib/axios/api-client";
import { type MonthlyBillingData } from "@/types/billing";

import { useQuery } from "@tanstack/react-query";

const fetchCurrentMonthBilling = async () => {
  const { data } = await AxiosInstance.get(
    ServerRoutes.billing.listCurrentMonthBilling(),
  );
  return data;
};

export default function useFetchCurrentMonthBilling() {
  return useQuery<MonthlyBillingData>({
    queryKey: ["CurrentMonthBilling"],
    queryFn: fetchCurrentMonthBilling,
  });
}
