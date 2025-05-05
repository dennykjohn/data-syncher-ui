import {
  createSystem,
  defaultConfig,
  defineConfig,
  mergeConfigs,
} from "@chakra-ui/react";

const theme = defineConfig({
  cssVarsPrefix: "ck",
  theme: {
    breakpoints: {
      sm: "320px",
      md: "768px",
      lg: "960px",
      xl: "1200px",
    },
    tokens: {
      colors: {
        primary: { value: "#4980ff" },
      },
    },
  },
});

const config = mergeConfigs(defaultConfig, theme);
export default createSystem(config);
