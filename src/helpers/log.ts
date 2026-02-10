export const getUiState = (
  uiState: string | undefined | null,
  status: string | undefined | null,
  message: string | undefined | null,
): string => {
  if (uiState) return uiState.toLowerCase();

  const lowerStatus = (status || "").toLowerCase();
  const lowerMessage = (message || "").toLowerCase();

  // Message content checks (Override ambiguous status codes like "P", and even "Success" for Paused/Active states)
  if (lowerMessage.includes("paused")) return "paused";
  if (lowerMessage.includes("active")) return "active";

  // Explicit warning status check (prioritize over "failed" text in message)
  if (["w", "warning", "p"].includes(lowerStatus)) return "warning";

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
    lowerMessage.includes("schema refresh in progress")
  )
    return "in_progress";

  // Explicit status checks
  if (["s", "success", "completed"].includes(lowerStatus)) return "success";
  if (["e", "error", "failed"].includes(lowerStatus)) return "error";

  if (
    lowerMessage.includes("completed successfully") ||
    lowerMessage.includes("updated fields") ||
    lowerMessage.includes("table selection updated") ||
    lowerMessage.includes("schema refresh completed")
  )
    return "success";

  // Ambiguous status checks
  if (["running", "in_progress", "i"].includes(lowerStatus))
    return "in_progress";

  // Low priority in-progress checks
  if (lowerMessage.includes("processing") || lowerMessage.includes("started"))
    return "in_progress";

  return "";
};
