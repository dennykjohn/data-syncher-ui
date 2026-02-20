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
    if (["p", "i", "in_progress", "running"].includes(normalizedUiState))
      return "in_progress";
    if (["w", "warning"].includes(normalizedUiState)) return "warning";
    if (["paused", "active"].includes(normalizedUiState))
      return normalizedUiState;
    return normalizedUiState;
  }

  const lowerStatus = (status || "").toLowerCase();
  const lowerMessage = (message || "").toLowerCase();

  // Message content checks (Override ambiguous status codes like "P", and even "Success" for Paused/Active states)
  if (lowerMessage.includes("paused")) return "paused";
  if (lowerMessage.includes("active")) return "active";

  // Explicit status checks
  if (["s", "success", "completed"].includes(lowerStatus)) return "success";
  if (["e", "error", "failed"].includes(lowerStatus)) return "error";
  if (["p", "i", "in_progress", "running"].includes(lowerStatus))
    return "in_progress";
  if (["w", "warning"].includes(lowerStatus)) return "warning";

  // Check for error/failure in message first to avoid overriding with "in_progress" if keywords overlap
  if (lowerMessage.includes("failed") || lowerMessage.includes("error"))
    return "error";

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
