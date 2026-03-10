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
    return normalizedUiState;
  }

  const s = (status || "").toLowerCase();
  const m = (message || "").toLowerCase();

  if (
    s === "s" &&
    (m.includes("initiated") ||
      m.includes("initite") ||
      m.includes("in progress") ||
      m.includes("started") ||
      m.includes("processing"))
  ) {
    return "in_progress";
  }

  // Condition 3: Status "P" -> warning
  if (s === "p") {
    return "warning";
  }

  // Condition 4: Status "S" AND ("completed" OR "successfully" OR "updated") -> success
  if (
    s === "s" &&
    (m.includes("completed") ||
      m.includes("successfully") ||
      m.includes("updated") ||
      m.includes("established"))
  ) {
    return "success";
  }

  if (
    (s === "f" || s === "e") &&
    (m.includes("error") || m.includes("fail") || m.includes("failed"))
  ) {
    return "error";
  }

  // Generic Fallbacks
  if (s === "s" || s === "success" || s === "completed") return "success";
  if (s === "f" || s === "e" || s === "error" || s === "failed") return "error";
  if (s === "p" || s === "w" || s === "warning") return "warning";
  if (s === "i" || s === "in_progress" || m.includes("progress"))
    return "in_progress";

  return "";
};
