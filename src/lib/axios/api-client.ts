import axios, {
  AxiosError,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import Cookies from "js-cookie";

import { toaster } from "@/components/ui/toaster";
import ClientRoutes from "@/constants/client-routes";
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

const AxiosInstance = axios.create({
  baseURL: getAxiosBaseURL(),
  timeout: 30000,
});

// Set Custom Headers
AxiosInstance.defaults.headers.common["Expires"] = "0";
AxiosInstance.defaults.headers.common["Cache-Control"] = "no-cache";
AxiosInstance.defaults.headers.common["Pragma"] = "no-cache";

AxiosInstance.interceptors.request.use(
  (
    config: InternalAxiosRequestConfig & { customToken?: string },
  ): InternalAxiosRequestConfig => {
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
  async (error: AxiosError): Promise<ErrorResponseType> => {
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

    if (error.response?.status === 401) {
      Cookies.remove("access_token");
      window.location.href = `${ClientRoutes.AUTH}/${ClientRoutes.LOGIN}`;
    } else if (error.code === "ECONNABORTED") {
      toaster.error({
        title: "Request Timeout",
        description: "The server took too long to respond. Try again soon.",
      });
    } else if (!error.response) {
      // Network-level issue (server down, DNS error, CORS, connection refused, etc.)
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
