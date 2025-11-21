import { startTransition } from "react";

import { Flex, Tabs } from "@chakra-ui/react";

import {
  useLocation,
  useNavigate,
  useOutletContext,
  useParams,
} from "react-router";

import ClientRoutes from "@/constants/client-routes";
import { type Connector } from "@/types/connectors";

const TabList = [
  { label: "Overview", route: ClientRoutes.CONNECTORS.OVERVIEW },
  { label: "Schema", route: ClientRoutes.CONNECTORS.SCHEMA },
  { label: "Reverse Schema", route: ClientRoutes.CONNECTORS.REVERSE_SCHEMA },
  { label: "Usage", route: ClientRoutes.CONNECTORS.USAGE },
  { label: "Settings", route: ClientRoutes.CONNECTORS.SETTINGS },
];

const ConnectorTabs = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { connectionId } = useParams();
  const connector = useOutletContext<Connector>(); // ✅ Get connector from outlet context

  // Show Reverse Schema only if SOURCE is Snowflake
  const isSnowflakeSource =
    connector?.source_name?.toLowerCase().includes("snowflake") ?? false;

  // Filter out Reverse Schema tab if source is NOT Snowflake
  const filteredTabList = isSnowflakeSource
    ? TabList // Show all tabs including Reverse Schema
    : TabList.filter((tab) => tab.label !== "Reverse Schema"); // Hide Reverse Schema

  // Get current active tab from URL
  const currentPath = location.pathname.split("/").pop();

  // Find active tab index in filtered list
  const activeTabIndex = filteredTabList.findIndex(
    (tab) => tab.route === currentPath,
  );

  // If user is on Reverse Schema but it's filtered out, redirect to Overview
  if (
    currentPath === ClientRoutes.CONNECTORS.REVERSE_SCHEMA &&
    !isSnowflakeSource &&
    connectionId
  ) {
    startTransition(() => {
      navigate(
        `/dashboard/${ClientRoutes.CONNECTORS.ROOT}/${ClientRoutes.CONNECTORS.EDIT}/${connectionId}/${ClientRoutes.CONNECTORS.OVERVIEW}`,
        { replace: true },
      );
    });
  }

  const defaultIndex = activeTabIndex >= 0 ? activeTabIndex : 0;

  const handleTabChange = (index: number) => {
    const selectedTab = filteredTabList[index]; // ✅ Use filteredTabList
    if (selectedTab && connectionId) {
      const newPath = `/dashboard/${ClientRoutes.CONNECTORS.ROOT}/${ClientRoutes.CONNECTORS.EDIT}/${connectionId}/${selectedTab.route}`;

      // Mark navigation as non-urgent
      startTransition(() => {
        navigate(newPath);
      });
    }
  };

  return (
    <Flex
      borderTop="1px solid"
      borderBottom="1px solid"
      borderColor="gray.200"
      bg="white"
      marginInline={-5}
    >
      <Tabs.Root
        value={defaultIndex.toString()}
        onValueChange={(details) => handleTabChange(Number(details.value))}
        variant="line"
        colorPalette="brand"
      >
        <Tabs.List px={6}>
          {filteredTabList.map(
            (
              tab,
              index, // ✅ Use filteredTabList
            ) => (
              <Tabs.Trigger
                key={tab.route}
                value={index.toString()}
                py={4}
                px={{ base: 4, md: 6 }}
                fontWeight="medium"
                fontSize="sm"
                color="gray.600"
                _selected={{
                  color: "brand.600",
                  borderBottomColor: "brand.500",
                  borderBottomWidth: "2px",
                }}
                _hover={{
                  color: "brand.500",
                }}
                transition="all 0.2s"
              >
                {tab.label}
              </Tabs.Trigger>
            ),
          )}
        </Tabs.List>
      </Tabs.Root>
    </Flex>
  );
};

export default ConnectorTabs;
