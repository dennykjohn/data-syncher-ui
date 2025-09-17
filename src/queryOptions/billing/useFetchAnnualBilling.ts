import ServerRoutes from "@/constants/server-routes";
import AxiosInstance from "@/lib/axios/api-client";
import { type YearlyBillingData } from "@/types/billing";

import { useQuery } from "@tanstack/react-query";

const fetchAnnualBilling = async () => {
  const { data } = await AxiosInstance.get(
    ServerRoutes.billing.listAnnualBilling({ companyId: "1" }),
  );
  return data;
};

export default function useFetchAnnualBilling() {
  return useQuery<YearlyBillingData>({
    queryKey: ["AnnualBilling"],
    queryFn: fetchAnnualBilling,
  });
}
