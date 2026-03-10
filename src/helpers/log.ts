export const getUiState = (
  uiState: string | undefined | null,
  status: string | undefined | null,
  message: string | undefined | null,
): string => {
  if (uiState) {
    const normalizedUiState = uiState.toLowerCase();
    if (["s", "success", "completed"].includes(normalizedUiState))
      return "success";
    if (["e", "error", "failed"].includes(normalizedUiState)) return "error";
    if (["i", "in_progress", "running"].includes(normalizedUiState))
      return "in_progress";
    if (["p", "w", "warning"].includes(normalizedUiState)) return "warning";
    if (["paused", "active"].includes(normalizedUiState))
      return normalizedUiState;
    return normalizedUiState;
  }

  const lowerStatus = (status || "").toLowerCase();
  const lowerMessage = (message || "").toLowerCase();

  // Strict check for status 'p' (Partial/Paused) to show warning symbol as requested
  if (lowerStatus === "p") return "warning";

  // Message content checks (Override ambiguous status codes like "Success" for Paused/Active states)
  if (lowerMessage.includes("paused")) return "paused";
  if (lowerMessage.includes("active")) return "active";

  // Check for error/failure in message early to override ambiguous status codes
  if (lowerMessage.includes("failed") || lowerMessage.includes("error")) {
    const isPartialSuccess =
      (lowerMessage.includes("successful") ||
        lowerMessage.includes("completed")) &&
      !lowerMessage.includes("0 tables") &&
      !lowerMessage.includes("0/0 successful") &&
      !lowerMessage.includes("0/1 successful") &&
      !lowerMessage.includes(": 0 successful") &&
      !lowerMessage.includes(" 0 successful");

    if (isPartialSuccess) {
      return "warning";
    }
    return "error";
  }

  // Explicit status checks
  if (["s", "success", "completed"].includes(lowerStatus)) return "success";
  if (["e", "error", "failed"].includes(lowerStatus)) return "error";
  if (["i", "in_progress", "running"].includes(lowerStatus))
    return "in_progress";
  if (["w", "warning"].includes(lowerStatus)) return "warning";

  // High priority in-progress overrides (Specific requested phrases)
  if (
    lowerMessage.includes("drop and reload") ||
    lowerMessage.includes("migration in progress") ||
    lowerMessage.includes("reloading") ||
    lowerMessage.includes("initiate") ||
    lowerMessage.includes("initiated") ||
    lowerMessage.includes("delta refresh") ||
    lowerMessage.includes("schema refresh in progress") ||
    lowerMessage.includes("update schema in progress")
  )
    return "in_progress";

  if (
    lowerMessage.includes("completed successfully") ||
    lowerMessage.includes("updated fields") ||
    lowerMessage.includes("table selection updated") ||
    lowerMessage.includes("schema refresh completed") ||
    lowerMessage.includes("schema updated") ||
    lowerMessage.includes("update completed") ||
    lowerMessage.includes("fetch tables completed")
  )
    return "success";

  // Low priority in-progress checks
  if (lowerMessage.includes("processing") || lowerMessage.includes("started"))
    return "in_progress";

  return "";
};
