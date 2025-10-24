import React from "react";

import { Button, Flex, Text } from "@chakra-ui/react";

import { useNavigate, useRouteError } from "react-router";

const RouteError: React.FC = () => {
  const navigate = useNavigate();
  const error = useRouteError() as unknown;

  const message = (() => {
    // try common shapes, but stay defensive about types
    if (error && typeof error === "object") {
      const e = error as Record<string, unknown>;
      if (typeof e.message === "string") return e.message;
    }
    return String(error ?? "Unknown error");
  })();

  return (
    <Flex
      alignItems="center"
      justifyContent="center"
      direction="column"
      gap={4}
      minH="60vh"
      p={6}
    >
      <Text fontSize="lg" fontWeight="semibold">
        Oops — something went wrong
      </Text>
      <Text color="gray.600" textAlign="center" maxW="xl">
        {message}
      </Text>
      <Flex gap={3} mt={4}>
        <Button onClick={() => navigate(-1)} variant="outline">
          Go back
        </Button>
        <Button onClick={() => window.location.reload()} colorPalette="brand">
          Reload page
        </Button>
      </Flex>
    </Flex>
  );
};

export default RouteError;
