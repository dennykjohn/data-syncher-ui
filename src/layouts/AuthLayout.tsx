import { Grid, useBreakpointValue } from "@chakra-ui/react";

import { Outlet } from "react-router";

import Banner from "@/components/auth/Banner";
import Navbar from "@/components/auth/Navbar";
import AuthContainer from "@/components/ui/AuthContainer";

export default function AuthLayout() {
  const gridTemplateAreas = useBreakpointValue({
    base: `"navbar" "main"`,
    md: `"navbar navbar" "banner main"`,
  });

  const gridTemplateColumns = useBreakpointValue({
    base: "1fr",
    md: "1fr 1fr",
  });

  const gridTemplateRows = useBreakpointValue({
    base: "80px 1fr",
    md: "80px 1fr",
  });

  return (
    <Grid
      templateAreas={gridTemplateAreas}
      templateColumns={gridTemplateColumns}
      templateRows={gridTemplateRows}
      overflow={"hidden"}
      height="100vh"
    >
      <Navbar />
      <Banner />
      <AuthContainer>
        <Outlet />
      </AuthContainer>
    </Grid>
  );
}
