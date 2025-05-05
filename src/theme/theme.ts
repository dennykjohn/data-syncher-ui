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
        brand: {
          50: { value: "#f4e9ff" },
          100: { value: "#e1c7ff" },
          200: { value: "#c69aff" },
          300: { value: "#a16df9" },
          400: { value: "#894df0" },
          500: { value: "#6e2fd5" },
          600: { value: "#5620ab" },
          700: { value: "#411685" },
          800: { value: "#2c0f5e" },
          900: { value: "#190537" },
        },
        primary: { value: "#4980ff" },
      },
    },
    semanticTokens: {
      colors: {
        "checkbox-border": {
          value: { _light: "gray.200", _dark: "gray.800" },
        },
        brand: {
          solid: { value: "{colors.brand.500}" },
          contrast: { value: "{colors.white}" },
          fg: { value: "{colors.brand.700}" },
          muted: { value: "{colors.brand.100}" },
          subtle: { value: "{colors.brand.200}" },
          emphasized: { value: "{colors.brand.300}" },
          focusRing: { value: "{colors.brand.500}" },
        },
      },
    },
  },
});

const config = mergeConfigs(defaultConfig, theme);
export default createSystem(config);
