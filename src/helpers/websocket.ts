import Cookies from "js-cookie";

export const getWebSocketUrl = (path: string): string | null => {
  if (!path) return null;

  const envWs =
    (import.meta.env.VITE_WS_ORIGIN as string | undefined) ||
    (import.meta.env.VITE_API_ORIGIN as string | undefined);

  let socketBaseUrl = "";

  if (envWs) {
    const u = new URL(
      envWs.replace(/^ws:/, "http:").replace(/^wss:/, "https:"),
    );
    u.protocol = u.protocol === "https:" ? "wss:" : "ws:";
    socketBaseUrl = u.origin;
  } else if (window.location.hostname === "localhost") {
    socketBaseUrl = "wss://qa.datasyncher.com";
  } else {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    socketBaseUrl = `${protocol}//${window.location.host}`;
  }

  const token = Cookies.get("access_token");

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  if (!token) return null;

  return `${socketBaseUrl}${normalizedPath}?token=${token}`;
};
