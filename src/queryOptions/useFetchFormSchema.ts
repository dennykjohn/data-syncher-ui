import ServerRoutes from "@/constants/server-routes";
import AxiosInstance from "@/lib/axios/api-client";
import { type FieldConfig } from "@/types/form";

import { useQuery } from "@tanstack/react-query";

const fetchMasterSourceList = async ({
  type,
  source,
}: {
  type: string;
  source: string;
}) => {
  const { data } = await AxiosInstance.get(
    ServerRoutes.common.fetchFormSchema({ type, source }),
  );
  return data.fields;
};

export default function useFetchFormSchema({
  type,
  source,
}: {
  type: string;
  source: string;
}) {
  return useQuery<FieldConfig[]>({
    queryKey: ["FormFieldInputs", type, source],
    queryFn: () => fetchMasterSourceList({ type, source }),
  });
}
