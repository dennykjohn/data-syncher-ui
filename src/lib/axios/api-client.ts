import axios, {
  AxiosError,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import Cookies from "js-cookie";

import ClientRoutes from "@/constants/client-routes";
import { type ErrorResponseType } from "@/types/error";

let baseURL = "";

if (window.location.hostname === "localhost") {
  baseURL = "https://dev.datasyncher.com";
} else {
  baseURL = window.location.origin;
}

const AxiosInstance = axios.create({
  baseURL: `${baseURL}/api/v1/`,
});

// Set Custom Headers
AxiosInstance.defaults.headers.common["Expires"] = "0";
AxiosInstance.defaults.headers.common["Cache-Control"] = "no-cache";
AxiosInstance.defaults.headers.common["Pragma"] = "no-chache";

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
    const data = error.response?.data;
    let errorCode: string | undefined = undefined;

    if (typeof data === "object" && data !== null && "error" in data) {
      errorCode = (data as { error: string }).error;
    }

    if (
      error.response?.status === 401 &&
      errorCode === "INVALID_OR_EXPIRED_TOKEN"
    ) {
      Cookies.remove("access_token");
      window.location.href = ClientRoutes.LOGIN;
    }
    return Promise.reject(error.response?.data);
  },
);

export default AxiosInstance;
