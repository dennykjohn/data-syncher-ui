import Cookies from "js-cookie";

const TOKEN_COOKIE_OPTIONS = {
  expires: 7,
  secure: window.location.protocol === "https:",
  sameSite: "Strict" as const,
};

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
  Cookies.remove("access_token");
  Cookies.remove("refresh_token");
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
};
