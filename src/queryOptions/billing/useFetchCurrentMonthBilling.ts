import ServerRoutes from "@/constants/server-routes";
import AxiosInstance from "@/lib/axios/api-client";
import { type MonthlyBillingData } from "@/types/billing";

import { useQuery } from "@tanstack/react-query";

const fetchCurrentMonthBilling = async (companyId: number) => {
  const { data } = await AxiosInstance.get(
    ServerRoutes.billing.listCurrentMonthBilling({ companyId }),
  );
  return data;
};

export default function useFetchCurrentMonthBilling({
  companyId,
}: {
  companyId: number;
}) {
  return useQuery<MonthlyBillingData>({
    queryKey: ["CurrentMonthBilling", companyId],
    queryFn: () => fetchCurrentMonthBilling(companyId),
    enabled: !!companyId,
  });
}
