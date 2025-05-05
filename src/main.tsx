import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ErrorBoundary } from "react-error-boundary";
import { RouterProvider } from "react-router";

import { ChakraProvider } from "@chakra-ui/react";

import theme from "@/config/theme.ts";
import "@/css/index.scss";
import { router } from "@/routes/AppRoutes";

import "./main.scss";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary fallback={<div>Something went wrong</div>}>
      <ChakraProvider value={theme}>
        <RouterProvider router={router} />
      </ChakraProvider>
    </ErrorBoundary>
  </StrictMode>,
);
