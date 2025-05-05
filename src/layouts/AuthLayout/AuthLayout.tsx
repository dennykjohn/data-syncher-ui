import { Box, Text } from "@chakra-ui/react";

import { Outlet } from "react-router";

export default function AuthLayout() {
  return (
    <Box>
      <Text>Auth Area</Text>
      <Outlet />
    </Box>
  );
}
