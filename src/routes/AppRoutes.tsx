import { Navigate, createBrowserRouter } from "react-router";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Connectors from "@/components/dashboard/components/Connectors/Connectors";
import NewConnector from "@/components/dashboard/components/Connectors/components/NewConnector/NewConnector";
import Destination from "@/components/dashboard/components/Destination/Destination";
import NewDestination from "@/components/dashboard/components/Destination/components/NewDestination/NewDestination";
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
            element: <Navigate to={ClientRoutes.CONNECTORS.ROOT} replace />,
          },
          /** Start Connectors Routes */
          { path: ClientRoutes.CONNECTORS.ROOT, element: <Connectors /> },
          {
            path: `${ClientRoutes.CONNECTORS.ROOT}/${ClientRoutes.CONNECTORS.ADD}`,
            element: <NewConnector />,
          },
          /** End Connectors Routes */
          /** Start Destination Routes */
          { path: ClientRoutes.DESTINATION.ROOT, element: <Destination /> },
          {
            path: `${ClientRoutes.DESTINATION.ROOT}/${ClientRoutes.DESTINATION.ADD}`,
            element: <NewDestination />,
          },
          /** End Destination Routes */
          { path: ClientRoutes.PLANS, element: <Plans /> },
          { path: "settings", element: <SettingsPage /> },
        ],
      },
    ],
  },
]);
