import { StrictMode } from "react";

import { ChakraProvider } from "@chakra-ui/react";

import { ErrorBoundary } from "react-error-boundary";
import { RouterProvider } from "react-router";

import { AuthProvider } from "@/context/Auth/AuthContext";
import "@/css/index.scss";
import { router } from "@/routes/AppRoutes";
import theme from "@/theme/theme";

import "./main.scss";

import { createRoot } from "react-dom/client";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary fallback={<div>Something went wrong</div>}>
      <ChakraProvider value={theme}>
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </ChakraProvider>
    </ErrorBoundary>
  </StrictMode>,
);
