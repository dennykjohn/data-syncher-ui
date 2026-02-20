import Cookies from "js-cookie";

export const getWebSocketUrl = (path: string): string | null => {
  if (!path) return null;

  let socketBaseUrl = "";

  if (window.location.hostname === "localhost") {
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
