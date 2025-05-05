import { Outlet } from "react-router";

import { Box, Text } from "@chakra-ui/react";

export default function AuthLayout() {
  return (
    <Box>
      <Text>Auth Area</Text>
      <Outlet />
    </Box>
  );
}
