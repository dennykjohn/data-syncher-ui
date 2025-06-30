import { Grid, GridItem } from "@chakra-ui/react";

import { Outlet } from "react-router";

import Header from "@/components/dashboard/components/Header";
import Sidebar from "@/components/dashboard/components/Sidebar";

export default function Layout() {
  const sidebarWidth = "240px";

  return (
    <Grid
      templateAreas={{
        base: `"main"`,
        md: `"sidebar header" "sidebar main"`,
      }}
      gridTemplateRows={{ base: "1fr", md: "60px 1fr" }}
      gridTemplateColumns={{ base: "1fr", md: `${sidebarWidth} 1fr` }}
      height="100vh"
    >
      <Sidebar sidebarWidth={sidebarWidth} />
      <Header sidebarWidth={sidebarWidth} />
      <GridItem
        area="main"
        p={6}
        overflowY="auto"
        height="calc(100vh - 60px)"
        bg="gray.50"
        mt={{ base: "60px", md: "0" }}
      >
        <Outlet />
      </GridItem>
    </Grid>
  );
}
