import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";

import { ChakraProvider } from "@chakra-ui/react";

import theme from "./config/theme.ts";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ChakraProvider value={theme}>
      <App />
    </ChakraProvider>
  </StrictMode>
);
