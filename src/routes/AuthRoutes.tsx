import { lazy } from "react";

export const LoginPage = lazy(() => import("@/components/auth/Login/Login"));
export const RegisterPage = lazy(
  () => import("@/components/auth/Register/Register"),
);
export const ForgotPassword = lazy(
  () => import("@/components/auth/ForgotPassword/ForgotPassword"),
);

export const ResetPassword = lazy(
  () => import("@/components/auth/ResetPassword/ResetPassword"),
);
