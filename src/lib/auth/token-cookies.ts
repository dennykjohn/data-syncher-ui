import Cookies from "js-cookie";

export const AUTH_COOKIE_DOMAIN = "gcp.datasyncher.com";

const isGcpDomain =
  typeof window !== "undefined" &&
  (window.location.hostname === AUTH_COOKIE_DOMAIN ||
    window.location.hostname.endsWith(`.${AUTH_COOKIE_DOMAIN}`));

const TOKEN_COOKIE_OPTIONS = {
  expires: 7,
  secure:
    typeof window !== "undefined" && window.location.protocol === "https:",
  sameSite: "strict" as const,
  ...(isGcpDomain ? { domain: AUTH_COOKIE_DOMAIN } : {}),
};

const TOKEN_COOKIE_REMOVE_OPTIONS = isGcpDomain
  ? { domain: AUTH_COOKIE_DOMAIN }
  : {};

export const getAccessToken = () =>
  Cookies.get("access_token") ?? localStorage.getItem("access_token");

export const getRefreshToken = () =>
  Cookies.get("refresh_token") ?? localStorage.getItem("refresh_token");

export const setAuthTokens = (accessToken: string, refreshToken: string) => {
  Cookies.set("access_token", accessToken, TOKEN_COOKIE_OPTIONS);
  Cookies.set("refresh_token", refreshToken, TOKEN_COOKIE_OPTIONS);
  localStorage.setItem("access_token", accessToken);
  localStorage.setItem("refresh_token", refreshToken);
};

export const clearAuthTokens = () => {
  Cookies.remove("access_token", TOKEN_COOKIE_REMOVE_OPTIONS);
  Cookies.remove("refresh_token", TOKEN_COOKIE_REMOVE_OPTIONS);
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
};
