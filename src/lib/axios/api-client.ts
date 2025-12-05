import axios, {
  AxiosError,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import Cookies from "js-cookie";

import { toaster } from "@/components/ui/toaster";
import ClientRoutes from "@/constants/client-routes";
import { type ErrorResponseType } from "@/types/error";

let baseURL = "";

if (window.location.hostname === "localhost") {
  baseURL = "https://qa.datasyncher.com";
} else {
  baseURL = window.location.origin;
}

const AxiosInstance = axios.create({
  baseURL: `${baseURL}/api/v1/`,
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
      toaster.error({
        title: "Trial Period Expired",
        description:
          errorData.message ||
          errorData.error ||
          "Your trial period has expired. Please select a subscription plan.",
      });

      setTimeout(() => {
        window.location.replace(errorData.redirect_to);
      }, 1000);

      return Promise.reject(errorData);
    }

    if (error.response?.status === 401) {
      Cookies.remove("access_token");
      window.location.href = `${ClientRoutes.AUTH}/${ClientRoutes.LOGIN}`;
    } else if (!error.response) {
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
