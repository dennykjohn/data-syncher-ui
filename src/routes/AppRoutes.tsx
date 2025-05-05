import { createBrowserRouter } from "react-router";

import AuthLayout from "@/layouts/AuthLayout";
import DashboardLayout from "@/layouts/DashboardLayout";
import AppLayout from "@/layouts/WebsiteLayout";
import LoginPage from "@/pages/auth/LoginPage";
import RegisterPage from "@/pages/auth/RegisterPage";
import DashboardHome from "@/pages/dashboard/DashboardHome";
import SettingsPage from "@/pages/dashboard/SettingsPage";
import HomePage from "@/pages/website/HomePage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [{ index: true, element: <HomePage /> }],
  },
  {
    path: "/auth",
    element: <AuthLayout />,
    children: [
      { path: "login", element: <LoginPage /> },
      { path: "register", element: <RegisterPage /> },
    ],
  },
  {
    path: "/dashboard",
    element: <DashboardLayout />,
    children: [
      { index: true, element: <DashboardHome /> },
      { path: "settings", element: <SettingsPage /> },
    ],
  },
]);
