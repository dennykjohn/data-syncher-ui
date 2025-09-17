import { useState } from "react";

import { Flex } from "@chakra-ui/react";

import { Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis } from "recharts";

import PageHeader from "@/components/dashboard/wrapper/PageHeader";
import LoadingSpinner from "@/components/shared/Spinner";
import { VIEW_CONFIG } from "@/constants/view-config";
import useAuth from "@/context/Auth/useAuth";
import useFetchCurrentMonthBilling from "@/queryOptions/billing/useFetchCurrentMonthBilling";

import BillingSelector from "./BillingSelector";
import { Chart, useChart } from "@chakra-ui/charts";

// PASS COMPANY ID
const Billing = () => {
  const {
    authState: { user },
  } = useAuth();
  console.log("User info: ", user);
  // Default to current month
  const [selectedRange, setSelectedRange] = useState<string[]>([
    "current-month",
  ]);

  const { data, isLoading } = useFetchCurrentMonthBilling();
  // REMOVE THE MATH.RANDOM ONCE THE API IS PROVIDING REAL DATA
  const billingData = data?.current_month_labels.map((label, index) => ({
    day: label,
    usage:
      data.current_month_billing[index] + (Math.floor(Math.random() * 6) + 1),
  }));

  const chart = useChart({
    data: billingData || [],
    series: [{ name: "usage", color: "purple.300" }],
  });

  if (isLoading) return <LoadingSpinner />;
  return (
    <Flex flexDirection="column" gap={VIEW_CONFIG.pageGap} h="100%">
      <PageHeader
        breadcrumbs={[
          {
            label: "User profile",
            route: "",
          },
        ]}
        title="Billing usage"
      />
      <BillingSelector
        selectedRange={selectedRange}
        setSelectedRange={setSelectedRange}
      />
      <Chart.Root maxH="sm" chart={chart}>
        <BarChart data={chart.data}>
          <CartesianGrid stroke={chart.color("border")} vertical={false} />
          <XAxis
            axisLine={false}
            tickLine={false}
            dataKey={chart.key("day")}
            tickFormatter={(value) => value.slice(0, 3)}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tickFormatter={(value) => value}
          />
          <Tooltip
            cursor={{ fill: chart.color("bg.muted") }}
            animationDuration={0}
            content={<Chart.Tooltip />}
          />
          {chart.series.map((item) => (
            <Bar
              isAnimationActive={true}
              key={item.name}
              dataKey={chart.key(item.name)}
              fill={chart.color(item.color)}
            />
          ))}
        </BarChart>
      </Chart.Root>
    </Flex>
  );
};

export default Billing;
