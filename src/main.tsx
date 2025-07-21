import { StrictMode } from "react";

import { ChakraProvider } from "@chakra-ui/react";

import { ErrorBoundary } from "react-error-boundary";
import { RouterProvider } from "react-router";

import { AuthProvider } from "@/context/Auth/AuthContext";
import "@/css/index.scss";
import { router } from "@/routes/AppRoutes";
import theme from "@/theme/theme";

import "./main.scss";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRoot } from "react-dom/client";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary fallback={<div>Something went wrong</div>}>
      <ChakraProvider value={theme}>
        <AuthProvider>
          <QueryClientProvider client={queryClient}>
            <RouterProvider router={router} />
          </QueryClientProvider>
        </AuthProvider>
      </ChakraProvider>
    </ErrorBoundary>
  </StrictMode>,
);
