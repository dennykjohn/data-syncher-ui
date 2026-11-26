export type LakeComputeTarget = "datasyncher_spark" | "customer_databricks";

export const lakeSparkBadgeLabel = (
  usesLakeSpark: boolean | undefined,
  lakeCompute: LakeComputeTarget | null | undefined,
  opts?: { isDynamicsDataLake?: boolean },
): string | null => {
  if (usesLakeSpark && lakeCompute === "datasyncher_spark") {
    return "DataSyncher Spark";
  }
  if (usesLakeSpark && lakeCompute === "customer_databricks") {
    return "Databricks Spark";
  }
  if (opts?.isDynamicsDataLake) {
    return "Spark not configured";
  }
  return null;
};

export const isDynamicsDataLakePair = (
  sourceName?: string | null,
  destinationName?: string | null,
) => {
  const src = (sourceName || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const dst = (destinationName || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  return src.includes("microsoftdynamics365") && dst === "datalake";
};
