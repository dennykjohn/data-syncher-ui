import { getAccessToken } from "@/lib/auth/token-cookies";

export const getWebSocketUrl = (path: string): string | null => {
  if (!path) return null;

  let socketBaseUrl = "";

  if (
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
  ) {
    const configuredSocketUrl = import.meta.env.VITE_WS_URL?.trim();
    socketBaseUrl = configuredSocketUrl
      ? configuredSocketUrl.replace(/\/+$/, "").replace(/\/ws$/, "")
      : "wss://qa-kubernetes.datasyncher.com";
  } else {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    socketBaseUrl = `${protocol}//${window.location.host}`;
  }

  const token = getAccessToken();

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  if (!token) return null;

  const socketUrl = new URL(normalizedPath, `${socketBaseUrl}/`);
  socketUrl.searchParams.set("token", token);

  return socketUrl.toString();
};
