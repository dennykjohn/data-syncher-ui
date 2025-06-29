import { createBrowserRouter } from "react-router";

import ClientRoutes from "@/constants/client-routes";
import AuthLayout from "@/layouts/AuthLayout";
import DashboardLayout from "@/layouts/DashboardLayout";
import WebsiteLayout from "@/layouts/WebsiteLayout";
import LoginPage from "@/pages/auth/LoginPage";
import RegisterPage from "@/pages/auth/RegisterPage";
import DashboardHome from "@/pages/dashboard/DashboardHome";
import SettingsPage from "@/pages/dashboard/SettingsPage";
import HomePage from "@/pages/website/HomePage";

export const router = createBrowserRouter([
  {
    path: ClientRoutes.HOME,
    element: <WebsiteLayout />,
    children: [{ index: true, element: <HomePage /> }],
  },
  {
    path: ClientRoutes.AUTH,
    element: <AuthLayout />,
    children: [
      { path: ClientRoutes.LOGIN, element: <LoginPage /> },
      { path: ClientRoutes.REGISTER, element: <RegisterPage /> },
    ],
  },
  {
    path: ClientRoutes.DASHBOARD,
    element: <DashboardLayout />,
    children: [
      { index: true, element: <DashboardHome /> },
      { path: "settings", element: <SettingsPage /> },
    ],
  },
]);
