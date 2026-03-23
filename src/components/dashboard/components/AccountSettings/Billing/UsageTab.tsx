import { useEffect, useMemo, useState } from "react";

import { Box, Button, Checkbox, Flex, Image, Text } from "@chakra-ui/react";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Label,
  Legend,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import NoConnectionsIllustration from "@/components/dashboard/components/Connectors/assets/empty.svg";
import LoadingSpinner from "@/components/shared/Spinner";
import ServerRoutes from "@/constants/server-routes";
import useAuth from "@/context/Auth/useAuth";
import AxiosInstance from "@/lib/axios/api-client";
import useFetchAnnualBilling from "@/queryOptions/billing/useFetchAnnualBilling";
import useFetchMonthlyUsage from "@/queryOptions/billing/useFetchMonthlyUsage";
import Table from "@/shared/Table";
import { type MonthlyUsageResponse } from "@/types/billing";

import { Chart, useChart } from "@chakra-ui/charts";

const applyConnectionFilter = (
  base: MonthlyUsageResponse | null,
  connectionIds: number[],
) => {
  if (!base) return null;
  const selectedSet = new Set(connectionIds.map(Number));
  const anyBase = base as unknown as Record<string, unknown>;
  const candidates =
    (anyBase["connection_usage"] as unknown[]) ||
    (anyBase["connections_usage"] as unknown[]) ||
    (anyBase["connection_usage_data"] as unknown[]) ||
    (anyBase["connection_usage_map"] as unknown[]) ||
    (anyBase["connection_wise_usage"] as unknown[]);

  const sumArrays = (arrays: number[][]) => {
    if (arrays.length === 0) return [];
    const length = arrays[0].length;
    const totals = new Array<number>(length).fill(0);
    arrays.forEach((arr) => {
      for (let i = 0; i < length; i += 1) {
        totals[i] += arr[i] ?? 0;
      }
    });
    return totals;
  };

  const getSourceType = (id: number) => {
    return base.available_connections?.find((c) => c.connection_id === id)
      ?.source_type;
  };

  if (Array.isArray(candidates)) {
    const selected = candidates.filter(
      (item) =>
        item &&
        typeof item === "object" &&
        "connection_id" in item &&
        selectedSet.has(
          Number((item as { connection_id: number }).connection_id),
        ),
    );
    const arrays = selected
      .map((item) => (item as { total_rec: number[] }).total_rec)
      .filter((arr) => Array.isArray(arr));
    if (arrays.length > 0) {
      const totals = sumArrays(arrays);
      const s3Arrays = selected
        .filter(
          (item) =>
            getSourceType(
              Number((item as { connection_id: number }).connection_id),
            )?.toLowerCase() === "amazons3",
        )
        .map((item) => (item as { total_rec: number[] }).total_rec)
        .filter((arr) => Array.isArray(arr));
      const sfArrays = selected
        .filter(
          (item) =>
            getSourceType(
              Number((item as { connection_id: number }).connection_id),
            )?.toLowerCase() === "salesforce",
        )
        .map((item) => (item as { total_rec: number[] }).total_rec)
        .filter((arr) => Array.isArray(arr));
      const dyArrays = selected
        .filter(
          (item) =>
            getSourceType(
              Number((item as { connection_id: number }).connection_id),
            )?.toLowerCase() === "microsoftdynamics365_fo",
        )
        .map((item) => (item as { total_rec: number[] }).total_rec)
        .filter((arr) => Array.isArray(arr));
      const grArrays = selected
        .filter(
          (item) =>
            getSourceType(
              Number((item as { connection_id: number }).connection_id),
            )?.toLowerCase() === "googlereviews",
        )
        .map((item) => (item as { total_rec: number[] }).total_rec)
        .filter((arr) => Array.isArray(arr));
      return {
        ...base,
        total_rec: totals,
        amazon_s3_rec: sumArrays(s3Arrays),
        salesforce_rec: sumArrays(sfArrays),
        dynamics_rec: sumArrays(dyArrays),
        google_reviews_rec: sumArrays(grArrays),
        selected_connection_ids: connectionIds,
        daily_labels:
          base.daily_labels ||
          (selected[0] as { daily_labels?: string[] })?.daily_labels ||
          [],
      } as MonthlyUsageResponse;
    }
  }

  if (candidates && typeof candidates === "object") {
    const candidatesMap = candidates as Record<
      number,
      { total_rec?: number[] }
    >;
    const arrays = connectionIds
      .map((id) => candidatesMap[id]?.total_rec)
      .filter((arr: unknown) => Array.isArray(arr));
    if (arrays.length > 0) {
      const totals = sumArrays(arrays as number[][]);
      const s3Arrays = connectionIds
        .filter((id) => getSourceType(id)?.toLowerCase() === "amazons3")
        .map((id) => candidatesMap[id]?.total_rec)
        .filter((arr) => Array.isArray(arr));
      const sfArrays = connectionIds
        .filter((id) => getSourceType(id)?.toLowerCase() === "salesforce")
        .map((id) => candidatesMap[id]?.total_rec)
        .filter((arr) => Array.isArray(arr));
      const dyArrays = connectionIds
        .filter(
          (id) =>
            getSourceType(id)?.toLowerCase() === "microsoftdynamics365_fo",
        )
        .map((id) => candidatesMap[id]?.total_rec)
        .filter((arr) => Array.isArray(arr));
      const grArrays = connectionIds
        .filter((id) => getSourceType(id)?.toLowerCase() === "googlereviews")
        .map((id) => candidatesMap[id]?.total_rec)
        .filter((arr) => Array.isArray(arr));
      return {
        ...base,
        total_rec: totals,
        amazon_s3_rec: sumArrays(s3Arrays as number[][]),
        salesforce_rec: sumArrays(sfArrays as number[][]),
        dynamics_rec: sumArrays(dyArrays as number[][]),
        google_reviews_rec: sumArrays(grArrays as number[][]),
        selected_connection_ids: connectionIds,
      } as MonthlyUsageResponse;
    }
  }

  if (connectionIds.length === 0 && Array.isArray(anyBase.total_rec)) {
    return {
      ...base,
      total_rec: new Array((anyBase.total_rec as number[]).length).fill(0),
      amazon_s3_rec: new Array((anyBase.total_rec as number[]).length).fill(0),
      salesforce_rec: new Array((anyBase.total_rec as number[]).length).fill(0),
      dynamics_rec: new Array((anyBase.total_rec as number[]).length).fill(0),
      google_reviews_rec: new Array(
        (anyBase.total_rec as number[]).length,
      ).fill(0),
      selected_connection_ids: [],
    } as MonthlyUsageResponse;
  }

  return {
    ...base,
    selected_connection_ids: connectionIds,
  } as MonthlyUsageResponse;
};

const UsageTab = () => {
  const {
    authState: { user },
  } = useAuth();
  const [usageRange, setUsageRange] = useState<"monthly" | "annually">(
    "monthly",
  );

  const { data: AnnualBillingData, isLoading: isLoadingAnnualBilling } =
    useFetchAnnualBilling({
      companyId: user?.company.cmp_id as number,
      enabled: usageRange === "annually",
    });

  const { data: MonthlyUsageData, isLoading: isLoadingMonthlyUsage } =
    useFetchMonthlyUsage({
      companyId: user?.company.cmp_id as number,
      enabled: true,
    });

  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [selectedConnections, setSelectedConnections] = useState<number[]>([]);
  const [fullUsageData, setFullUsageData] =
    useState<MonthlyUsageResponse | null>(null);

  const usageData = useMemo(() => {
    if (!fullUsageData) return null;
    return applyConnectionFilter(fullUsageData, selectedConnections);
  }, [fullUsageData, selectedConnections]);

  useEffect(() => {
    if (!MonthlyUsageData) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFullUsageData(MonthlyUsageData);
    setSelectedYear(MonthlyUsageData.selected_year ?? null);
    setSelectedMonth(MonthlyUsageData.selected_month ?? null);
    setSelectedConnections(MonthlyUsageData.selected_connection_ids || []);
  }, [MonthlyUsageData]);

  const handleUsageUpdate = async (next: {
    year?: number;
    month?: number;
    connectionIds?: number[];
  }) => {
    if (!user?.company.cmp_id) return;
    const year = next.year ?? selectedYear ?? usageData?.selected_year;
    const month = next.month ?? selectedMonth ?? usageData?.selected_month;
    const connectionIds =
      next.connectionIds ??
      selectedConnections ??
      usageData?.selected_connection_ids ??
      [];

    if (!year || !month) return;

    await AxiosInstance.post(
      ServerRoutes.billing.updateConnectionsUsage({
        companyId: user.company.cmp_id,
      }),
      {
        selected_year: year,
        selected_month: month,
        connection_ids: connectionIds.join(","),
      },
    );

    const { data } = await AxiosInstance.get(
      ServerRoutes.billing.monthlyUsage({
        companyId: user.company.cmp_id,
      }),
      {
        params: {
          year,
          month,
          connection_ids: connectionIds,
        },
      },
    );

    const incoming = data as MonthlyUsageResponse;
    const incomingAny = incoming as Record<string, unknown>;
    const hasBreakdown =
      !!incomingAny?.connection_usage ||
      !!incomingAny?.connections_usage ||
      !!incomingAny?.connection_usage_data ||
      !!incomingAny?.connection_usage_map ||
      !!incomingAny?.connection_wise_usage;

    if (hasBreakdown || !fullUsageData) {
      setFullUsageData(incoming);
    }

    if (Array.isArray(incoming.selected_connection_ids)) {
      setSelectedConnections(incoming.selected_connection_ids);
    }

    setFullUsageData((prev) => {
      const keepConnections =
        !incoming.available_connections ||
        incoming.available_connections.length === 0;

      return {
        ...(prev || {}),
        ...incoming,
        available_connections: keepConnections
          ? prev?.available_connections || []
          : incoming.available_connections,
      } as MonthlyUsageResponse;
    });
  };

  const annualBillingMap = AnnualBillingData as {
    monthly_labels?: string[];
    monthly_total_rec_values?: number[];
  };

  const isSingleConnection =
    selectedConnections.length === 1 && usageRange === "monthly";
  const singleConnection = useMemo(() => {
    return isSingleConnection
      ? (
          fullUsageData?.available_connections as unknown as {
            connection_id: number;
            src_config__name: string;
            source_type: string;
          }[]
        )?.find((c) => c.connection_id === selectedConnections[0])
      : null;
  }, [
    isSingleConnection,
    fullUsageData?.available_connections,
    selectedConnections,
  ]);

  const singleConnectionName =
    singleConnection?.src_config__name || "Connection";

  const usageChartData =
    usageRange === "annually"
      ? (annualBillingMap?.monthly_labels ?? []).map(
          (label: string, index: number) => ({
            day: label,
            "Total Tokens":
              (annualBillingMap?.monthly_total_rec_values ?? [])[index] ?? 0,
          }),
        )
      : (usageData?.daily_labels ?? []).map((label: string, index: number) => {
          const s3Usage = (usageData?.amazon_s3_rec ?? [])[index] ?? 0;
          const sfUsage = (usageData?.salesforce_rec ?? [])[index] ?? 0;
          const dyUsage = (usageData?.dynamics_rec ?? [])[index] ?? 0;
          const grUsage = (usageData?.google_reviews_rec ?? [])[index] ?? 0;

          return {
            day: label,
            ...(s3Usage > 0 ? { AmazonS3: s3Usage } : {}),
            ...(sfUsage > 0 ? { Salesforce: sfUsage } : {}),
            ...(dyUsage > 0 ? { "Dynamics 365 FO": dyUsage } : {}),
            ...(grUsage > 0 ? { "Google Reviews": grUsage } : {}),
          };
        });
  const usageXAxisLabel = usageRange === "annually" ? "Month" : "Date";

  const usageChart = useChart({
    data: (usageChartData || []) as Record<string, string | number>[],
    series:
      usageRange === "annually"
        ? [{ name: "Total Tokens", color: "purple.300" }]
        : [
            { name: "AmazonS3", color: "red.200" },
            { name: "Salesforce", color: "blue.300" },
            { name: "Dynamics 365 FO", color: "blue.500" },
            { name: "Google Reviews", color: "green.400" },
          ],
  });

  if (isLoadingMonthlyUsage || isLoadingAnnualBilling)
    return <LoadingSpinner />;

  return (
    <Flex direction="column" gap={4} mt={-12}>
      <Flex justifyContent="space-between" alignItems="flex-end" w="100%">
        <Flex alignItems="center" gap={2}>
          {usageRange === "monthly" && (
            <>
              <Box
                as="select"
                w="120px"
                h="32px"
                fontSize="sm"
                border="1px solid"
                borderColor="gray.300"
                borderRadius="md"
                px={2}
                value={selectedMonth ?? usageData?.selected_month ?? ""}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                  const nextMonth = Number(e.target.value);
                  setSelectedMonth(nextMonth);
                }}
              >
                {(usageData?.months ?? []).map(([value, name]) => (
                  <option key={value} value={value}>
                    {name}
                  </option>
                ))}
              </Box>
              <Box
                as="select"
                w="100px"
                h="32px"
                fontSize="sm"
                border="1px solid"
                borderColor="gray.300"
                borderRadius="md"
                px={2}
                value={selectedYear ?? usageData?.selected_year ?? ""}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                  const nextYear = Number(e.target.value);
                  setSelectedYear(nextYear);
                }}
              >
                {Array.from(new Set([...(usageData?.years ?? []), 2025]))
                  .sort((a, b) => b - a)
                  .map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
              </Box>
              <Button
                size="sm"
                variant="outline"
                colorPalette="purple"
                px={4}
                onClick={() => handleUsageUpdate({})}
              >
                Update
              </Button>
            </>
          )}
        </Flex>

        <Flex direction="column" alignItems="flex-end" gap={1}>
          <Box fontWeight="bold" fontSize="lg" color="gray.700">
            Connection Usage Information
          </Box>
          <Flex bg="transparent" p="0" width="fit-content" gap="2">
            {[
              { value: "monthly", label: "Monthly" },
              { value: "annually", label: "Annually" },
            ].map((option) => {
              const isSelected = usageRange === option.value;
              return (
                <Box
                  key={option.value}
                  as="button"
                  onClick={() =>
                    setUsageRange(option.value as "monthly" | "annually")
                  }
                  bg={isSelected ? "purple.600" : "white"}
                  color={isSelected ? "white" : "purple.600"}
                  border="1px solid"
                  borderColor="purple.600"
                  py={1.5}
                  px={4}
                  borderRadius="md"
                  fontSize="sm"
                  fontWeight="bold"
                  shadow="sm"
                  transition="all 0.2s"
                  _hover={{
                    bg: isSelected ? "purple.700" : "purple.50",
                  }}
                  cursor="pointer"
                >
                  {option.label}
                </Box>
              );
            })}
          </Flex>
        </Flex>
      </Flex>

      {usageRange === "monthly" && (
        <>
          {(usageData?.available_connections ?? []).length === 0 ? (
            <Flex
              direction="column"
              alignItems="center"
              justifyContent="center"
              borderWidth="1px"
              borderColor="gray.200"
              borderRadius="md"
              py={12}
              px={6}
              gap={3}
            >
              <Image
                src={NoConnectionsIllustration}
                alt="No connections"
                maxW="160px"
              />
              <Text fontSize="sm" color="gray.600">
                No connections available.
              </Text>
            </Flex>
          ) : (
            <Table
              data={usageData?.available_connections ?? []}
              columns={[
                {
                  header: "Connection",
                  accessor: "src_config__name",
                  width: "45%",
                },
                {
                  header: "Destination",
                  accessor: "dst_config__name",
                  width: "45%",
                },
                {
                  header: "Select",
                  accessor: "connection_id",
                  width: "10%",
                  textAlign: "center",
                  render: (value) => {
                    const id = Number(value);
                    const checked = selectedConnections.includes(id);
                    return (
                      <Checkbox.Root
                        colorPalette="purple"
                        variant="solid"
                        checked={checked}
                        onCheckedChange={(e) => {
                          const next = e.checked
                            ? [...selectedConnections, id]
                            : selectedConnections.filter((x) => x !== id);
                          setSelectedConnections(next);
                        }}
                      >
                        <Checkbox.HiddenInput />
                        <Checkbox.Control cursor="pointer" />
                      </Checkbox.Root>
                    );
                  },
                },
              ]}
              pageSize={10}
              totalElements={(usageData?.available_connections ?? []).length}
              updateCurrentPage={() => {}}
              hidePagination
            />
          )}

          <Chart.Root maxH="sm" chart={usageChart} w="100%">
            <BarChart data={usageChart.data} margin={{ left: 20 }}>
              <CartesianGrid stroke="#e2e8f0" vertical={false} />
              <XAxis
                axisLine={false}
                tickLine={false}
                dataKey="day"
                tickFormatter={(value) =>
                  typeof value === "string" ? value.slice(0, 3) : value
                }
                label={{
                  value: usageXAxisLabel,
                  position: "insideBottom",
                  offset: -5,
                }}
              />
              <YAxis width={90} axisLine={false} tickLine={false}>
                <Label value="Total Tokens" angle={-90} position="insideLeft" />
              </YAxis>
              <Tooltip
                cursor={{ fill: "rgba(0,0,0,0.04)" }}
                animationDuration={0}
                labelFormatter={() => ""}
                formatter={(value: number, name: string) => {
                  let mappedName = name;
                  if (isSingleConnection) {
                    const st = singleConnection?.source_type?.toLowerCase();
                    const targetName =
                      st === "amazons3"
                        ? "AmazonS3"
                        : st === "salesforce"
                          ? "Salesforce"
                          : st === "microsoftdynamics365_fo"
                            ? "Dynamics 365 FO"
                            : st === "googlereviews"
                              ? "Google Reviews"
                              : "";

                    if (name === targetName) {
                      mappedName = singleConnectionName;
                    }
                  }
                  return [value, mappedName];
                }}
              />
              <Legend verticalAlign="top" height={36} />
              <Bar
                stackId="a"
                dataKey={usageChart.key("AmazonS3")}
                name="AmazonS3"
                fill="#feb2b2"
              />
              <Bar
                stackId="a"
                dataKey={usageChart.key("Salesforce")}
                name="Salesforce"
                fill="#90cdf4"
              />
              <Bar
                stackId="a"
                dataKey={usageChart.key("Dynamics 365 FO")}
                name="Dynamics 365 FO"
                fill="#4299e1"
              />
              <Bar
                stackId="a"
                dataKey={usageChart.key("Google Reviews")}
                name="Google Reviews"
                fill="#68d391"
              />
            </BarChart>
          </Chart.Root>
        </>
      )}

      {usageRange === "annually" && (
        <Chart.Root maxH="sm" chart={usageChart} w="100%">
          <BarChart data={usageChart.data} margin={{ left: 20 }}>
            <CartesianGrid stroke="#e2e8f0" vertical={false} />
            <XAxis
              axisLine={false}
              tickLine={false}
              dataKey="day"
              tickFormatter={(value) =>
                typeof value === "string" ? value.slice(0, 3) : value
              }
              label={{
                value: usageXAxisLabel,
                position: "insideBottom",
                offset: -5,
              }}
            />
            <YAxis width={90} axisLine={false} tickLine={false}>
              <Label value="Total Tokens" angle={-90} position="insideLeft" />
            </YAxis>
            <Tooltip
              cursor={{ fill: "rgba(0,0,0,0.04)" }}
              animationDuration={0}
              labelFormatter={() => ""}
            />
            <Legend verticalAlign="top" height={36} />
            <Bar
              dataKey={usageChart.key("Total Tokens")}
              name="Total Tokens"
              fill="#c7a6ff"
            />
          </BarChart>
        </Chart.Root>
      )}
    </Flex>
  );
};

export default UsageTab;
