import axios, {
  AxiosError,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";

import { toaster } from "@/components/ui/toaster";
import { getAccessToken } from "@/lib/auth/token-cookies";
import { type ErrorResponseType } from "@/types/error";

let baseURL = "";

if (
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
) {
  baseURL = "https://qa.datasyncher.com";
  // baseURL = "http://127.0.0.1:8000";
} else {
  baseURL = window.location.origin;
}

const AxiosInstance = axios.create({
  baseURL: `${baseURL}/api/v1/`,
  timeout: 30000,
});

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  customToken?: string;
};

// Set Custom Headers
AxiosInstance.defaults.headers.common["Expires"] = "0";
AxiosInstance.defaults.headers.common["Cache-Control"] = "no-cache";
AxiosInstance.defaults.headers.common["Pragma"] = "no-cache";

AxiosInstance.interceptors.request.use(
  (config: RetryableRequestConfig): InternalAxiosRequestConfig => {
    const token = config.headers.customToken ?? getAccessToken();

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

    if (!error.response) {
      // Network-level issue (server down, DNS error, CORS, etc.)
      toaster.error({
        title: "Server Unreachable",
        description:
          "The server appears to be down or unreachable. Please try again later.",
      });
    } else if (error.code === "ECONNABORTED") {
      toaster.error({
        title: "Request Timeout",
        description: "The server took too long to respond. Try again soon.",
      });
    }
    return Promise.reject(error.response?.data);
  },
);

export default AxiosInstance;
