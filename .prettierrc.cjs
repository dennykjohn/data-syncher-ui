module.exports = {
  plugins: ["@trivago/prettier-plugin-sort-imports"],

  // === General Formatting Rules ===
  semi: true, // Always add semicolons
  trailingComma: "all", // Add trailing commas wherever possible
  printWidth: 80, // Wrap lines that exceed 80 characters
  tabWidth: 2, // Indent using 2 spaces
  useTabs: false, // Do not use tabs
  arrowParens: "always", // Always include parentheses around arrow function args
  proseWrap: "never", // Don't wrap markdown text
  bracketSpacing: true, // Add spaces between brackets { like this }
  bracketSameLine: false, // ✅ New key replacing jsxBracketSameLine
  endOfLine: "lf", // Use LF for line endings (for consistent cross-OS behavior)

  // === Import Sorting Rules ===
  importOrder: [
    "^react$",
    "@chakra-ui/react",
    "^react-icons(/.*)?$",
    "<THIRD_PARTY_MODULES>",
    "^@context/(.*)$",
    "^@/(.*)$",
    "^[./].*\\.scss$",
    "[./]",
  ],
  importOrderSeparation: true, // Add newlines between import groups
  importOrderSortSpecifiers: true, // Sort imported members within braces
};
