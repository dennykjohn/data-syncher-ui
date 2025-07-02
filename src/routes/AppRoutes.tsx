import { Navigate, createBrowserRouter } from "react-router";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Connectors from "@/components/dashboard/components/Connectors/Connectors";
import Destination from "@/components/dashboard/components/Destination/Destination";
import Plans from "@/components/dashboard/components/Plans/Plans";
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
      {
        index: true,
        element: <Navigate to={ClientRoutes.LOGIN} replace />,
      },
      { path: ClientRoutes.LOGIN, element: <LoginPage /> },
      { path: ClientRoutes.REGISTER, element: <RegisterPage /> },
    ],
  },
  // 🌟 PROTECTED ROUTES
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: ClientRoutes.DASHBOARD,
        element: <DashboardLayout />,
        children: [
          {
            index: true,
            element: <Navigate to={ClientRoutes.CONNECTORS} replace />,
          },
          { path: ClientRoutes.CONNECTORS, element: <Connectors /> },
          { path: ClientRoutes.DESTINATION, element: <Destination /> },
          { path: ClientRoutes.PLANS, element: <Plans /> },
          { path: "settings", element: <SettingsPage /> },
        ],
      },
    ],
  },
]);
