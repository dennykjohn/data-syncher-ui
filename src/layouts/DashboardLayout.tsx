import { useState } from "react";

import { Grid, GridItem } from "@chakra-ui/react";

import { Outlet } from "react-router";

import Header from "@/components/dashboard/components/Header";
import Sidebar from "@/components/dashboard/components/Sidebar/Sidebar";

export default function Layout() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const sidebarWidth = isSidebarCollapsed ? "0" : "250px";
  const toggleSidebar = () => setIsSidebarCollapsed(!isSidebarCollapsed);

  return (
    <Grid
      templateAreas={{
        base: `"main"`,
        md: `"sidebar header" "sidebar main"`,
      }}
      gridTemplateRows={{ base: "1fr", md: "60px 1fr" }}
      gridTemplateColumns={{ base: "1fr", md: `${sidebarWidth} 1fr` }}
      height="100vh"
      transition="grid-template-columns 0.3s ease-in-out"
    >
      <Sidebar sidebarWidth={sidebarWidth} isDrawer={false} />
      <Header
        sidebarWidth={sidebarWidth}
        onSidebarToggle={toggleSidebar}
        isSidebarCollapsed={isSidebarCollapsed}
      />
      <GridItem
        area="main"
        p={6}
        overflowY="auto"
        height="calc(100vh - 60px)"
        bg="gray.50"
        mt={{ base: "60px", md: "0" }}
        transition="all 0.3s ease-in-out"
      >
        <Outlet />
      </GridItem>
    </Grid>
  );
}
