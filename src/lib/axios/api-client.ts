import axios, {
  AxiosError,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import Cookies from "js-cookie";

import { toaster } from "@/components/ui/toaster";
import ServerRoutes from "@/constants/server-routes";
import { type ErrorResponseType } from "@/types/error";

const envApiOrigin = import.meta.env.VITE_API_ORIGIN as string | undefined;

/** Use the same loopback hostname as the page (localhost vs 127.0.0.1) to avoid CORS quirks. */
function resolveApiBase(): string {
  const trimmed = envApiOrigin?.replace(/\/$/, "").trim();
  if (!trimmed) {
    if (
      typeof window !== "undefined" &&
      window.location.hostname === "localhost"
    ) {
      return "https://qa.datasyncher.com";
    }
    if (typeof window !== "undefined") {
      return window.location.origin;
    }
    return "";
  }

  if (typeof window === "undefined") {
    return trimmed;
  }

  try {
    const api = new URL(
      trimmed.includes("://") ? trimmed : `http://${trimmed}`,
    );
    const pageHost = window.location.hostname;
    const apiHost = api.hostname;
    const loopbackMismatch =
      (pageHost === "localhost" && apiHost === "127.0.0.1") ||
      (pageHost === "127.0.0.1" && apiHost === "localhost");
    if (loopbackMismatch) {
      api.hostname = pageHost;
      return api.origin.replace(/\/$/, "");
    }
  } catch {
    /* keep trimmed */
  }

  return trimmed;
}

/**
 * In `vite` dev, call `/api/v1/...` on the same origin so Vite proxies to Django (no CORS).
 * In `vite build` / preview, use absolute API origin from env.
 */
function getAxiosBaseURL(): string {
  if (import.meta.env.DEV) {
    return "/api/v1/";
  }
  const apiBase = resolveApiBase();
  return apiBase ? `${apiBase}/api/v1/` : "/api/v1/";
}

function getRefreshTokenURL(): string {
  if (import.meta.env.DEV) {
    return `/api/v1/${ServerRoutes.auth.refresh()}`;
  }
  const apiBase = resolveApiBase();
  return `${apiBase}/api/v1/${ServerRoutes.auth.refresh()}`;
}

const TOKEN_COOKIE_OPTIONS = {
  expires: 7,
  secure:
    typeof window !== "undefined" && window.location.protocol === "https:",
  sameSite: "lax" as const,
};

const AxiosInstance = axios.create({
  baseURL: getAxiosBaseURL(),
  timeout: 30000,
});

type RefreshTokenResponse = {
  access?: string;
  access_token?: string;
  refresh?: string;
  refresh_token?: string;
};

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
  customToken?: string;
};

let refreshPromise: Promise<string> | null = null;

export const refreshAccessToken = async () => {
  if (refreshPromise) return refreshPromise;

  const refreshToken = Cookies.get("refresh_token");

  if (!refreshToken) {
    throw new Error("Refresh token is not available.");
  }

  refreshPromise = axios
    .post<RefreshTokenResponse>(getRefreshTokenURL(), {
      refresh_token: refreshToken,
    })
    .then(({ data }) => {
      const accessToken = data.access_token ?? data.access;
      const nextRefreshToken =
        data.refresh_token ?? data.refresh ?? refreshToken;

      if (!accessToken) {
        throw new Error("Refresh response did not include an access token.");
      }

      Cookies.set("access_token", accessToken, TOKEN_COOKIE_OPTIONS);
      Cookies.set("refresh_token", nextRefreshToken, TOKEN_COOKIE_OPTIONS);

      return accessToken;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
};

// Set Custom Headers
AxiosInstance.defaults.headers.common["Expires"] = "0";
AxiosInstance.defaults.headers.common["Cache-Control"] = "no-cache";
AxiosInstance.defaults.headers.common["Pragma"] = "no-cache";

AxiosInstance.interceptors.request.use(
  (config: RetryableRequestConfig): InternalAxiosRequestConfig => {
    const token =
      config.headers.customToken ?? Cookies.get("access_token") ?? null;

    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    if (config.headers.customToken) {
      delete config.headers.customToken;
    }
    config.timeout = 40000;
    return config;
  },
  (error) => Promise.reject(error),
);

AxiosInstance.interceptors.response.use(
  (response: AxiosResponse): AxiosResponse => response,
  async (error: AxiosError): Promise<AxiosResponse | ErrorResponseType> => {
    const original = error.config as RetryableRequestConfig | undefined;
    const errorData = error.response?.data as ErrorResponseType | undefined;

    if (errorData?.trial_expired && errorData?.redirect_to) {
      const redirectTo = errorData.redirect_to;

      toaster.error({
        title: "Trial Period Expired",
        description:
          errorData.message ||
          errorData.error ||
          "Your trial period has expired. Please select a subscription plan.",
      });

      setTimeout(() => {
        window.location.replace(redirectTo);
      }, 1000);

      return Promise.reject(errorData);
    }

    if (error.response?.status === 401 && original && !original._retry) {
      original._retry = true;

      try {
        const accessToken = await refreshAccessToken();
        original.headers["Authorization"] = `Bearer ${accessToken}`;

        return AxiosInstance(original);
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    }

    if (error.code === "ECONNABORTED") {
      toaster.error({
        title: "Request Timeout",
        description: "The server took too long to respond. Try again soon.",
      });
    } else if (!error.response) {
      const devDetail =
        import.meta.env.DEV && error.message ? ` ${error.message}` : "";
      toaster.error({
        title: "Server Unreachable",
        description: import.meta.env.DEV
          ? `No response from API (use Vite proxy /api → Django on :8000). Is runserver up?${devDetail}`
          : "The server appears to be down or unreachable. Please try again later.",
      });
    }
    return Promise.reject(error.response?.data);
  },
);

export default AxiosInstance;
