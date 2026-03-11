export const getUiState = (
  uiState: string | undefined | null,
  status: string | undefined | null,
  message: string | undefined | null,
): string => {
  const lowerStatus = (status || "").toLowerCase();
  const lowerMessage = (message || "").toLowerCase();

  // STRICT CHECKS based on User Request
  if (lowerStatus === "s") {
    if (
      lowerMessage.includes("in progress") ||
      lowerMessage.includes("initiated") ||
      lowerMessage.includes("initiate")
    ) {
      return "in_progress";
    }
    if (lowerMessage.includes("completed")) {
      return "success";
    }
  }

  if (lowerStatus === "f" || lowerStatus === "e") {
    if (lowerMessage.includes("error") || lowerMessage.includes("failed")) {
      return "error";
    }
  }

  if (lowerStatus === "p") {
    return "warning";
  }

  // Fallback / Existing high priority overrides
  if (uiState) {
    const normalizedUiState = uiState.toLowerCase();
    if (["s", "success", "completed"].includes(normalizedUiState))
      return "success";
    if (["e", "error", "failed"].includes(normalizedUiState)) return "error";
    if (["i", "in_progress", "running"].includes(normalizedUiState))
      return "in_progress";
    if (["p", "w", "warning"].includes(normalizedUiState)) return "warning";
    return normalizedUiState;
  }

  // General catch-all for message content (e.g. paused/active)
  if (lowerMessage.includes("paused")) return "paused";
  if (lowerMessage.includes("active")) return "active";

  // Check for error/failure in message generally
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

  // General status fallbacks
  if (["s", "success", "completed"].includes(lowerStatus)) return "success";
  if (["e", "error", "failed", "f"].includes(lowerStatus)) return "error";
  if (["i", "in_progress", "running"].includes(lowerStatus))
    return "in_progress";
  if (["w", "warning"].includes(lowerStatus)) return "warning";

  if (
    lowerMessage.includes("drop and reload") ||
    lowerMessage.includes("migration in progress") ||
    lowerMessage.includes("reloading") ||
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

  if (lowerMessage.includes("processing") || lowerMessage.includes("started"))
    return "in_progress";

  return "";
};
