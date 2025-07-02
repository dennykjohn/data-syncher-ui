import { createBrowserRouter } from "react-router";

import Connectors from "@/components/dashboard/components/Connectors/Connectors";
import Destination from "@/components/dashboard/components/Destination/Destination";
//Layouts and Pages
import ClientRoutes from "@/constants/client-routes";
import AuthLayout from "@/layouts/AuthLayout";
import DashboardLayout from "@/layouts/DashboardLayout";
import WebsiteLayout from "@/layouts/WebsiteLayout";
import LoginPage from "@/pages/auth/LoginPage";
import RegisterPage from "@/pages/auth/RegisterPage";
//Dashboard components
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
      { index: true, path: ClientRoutes.CONNECTTORS, element: <Connectors /> },
      { path: ClientRoutes.DESTINATION, element: <Destination /> },
      { path: "settings", element: <SettingsPage /> },
    ],
  },
]);
