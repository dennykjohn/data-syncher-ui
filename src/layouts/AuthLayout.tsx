import { Grid } from "@chakra-ui/react";

import { Outlet } from "react-router";

import Navbar from "@/components/auth/Navbar";
import AuthContainer from "@/components/ui/AuthContainer";

export default function AuthLayout() {
  return (
    <Grid templateRows="auto 1fr" height="100vh" overflow="hidden">
      <Navbar />
      <AuthContainer mt="80px">
        <Outlet />
      </AuthContainer>
    </Grid>
  );
}
