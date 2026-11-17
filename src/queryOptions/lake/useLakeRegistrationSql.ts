import AxiosInstance from "@/lib/axios/api-client";

import { useQuery } from "@tanstack/react-query";

type LakeRegistrationSqlResponse = {
  sql: string;
  table_config_id: number;
  dest_path: string;
};

const fetchLakeRegistrationSql = async (
  connectionId: number,
  tableConfigId: number,
  catalog?: string,
  schema?: string,
) => {
  const params = new URLSearchParams();
  if (catalog) params.set("catalog", catalog);
  if (schema) params.set("schema", schema);
  const qs = params.toString();
  const suffix = qs ? `?${qs}` : "";
  const { data } = await AxiosInstance.get<LakeRegistrationSqlResponse>(
    `connection/${connectionId}/lake/tables/${tableConfigId}/registration-sql${suffix}`,
  );
  return data;
};

export default function useLakeRegistrationSql(
  connectionId: number | undefined,
  tableConfigId: number | undefined,
  catalog?: string,
  schema?: string,
) {
  return useQuery({
    queryKey: [
      "lakeRegistrationSql",
      connectionId,
      tableConfigId,
      catalog,
      schema,
    ],
    queryFn: () =>
      fetchLakeRegistrationSql(connectionId!, tableConfigId!, catalog, schema),
    enabled: Boolean(connectionId && tableConfigId),
  });
}
