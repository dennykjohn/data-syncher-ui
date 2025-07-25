import { lazy } from "react";

import { Navigate, createBrowserRouter } from "react-router";

import ClientRoutes from "@/constants/client-routes";

const ProtectedRoute = lazy(() => import("@/components/auth/ProtectedRoute"));
const Connectors = lazy(
  () => import("@/components/dashboard/components/Connectors/Connectors"),
);
const NewConnector = lazy(
  () =>
    import(
      "@/components/dashboard/components/Connectors/components/NewConnector/NewConnector"
    ),
);
const Destination = lazy(
  () => import("@/components/dashboard/components/Destination/Destination"),
);
const NewDestination = lazy(
  () =>
    import(
      "@/components/dashboard/components/Destination/components/NewDestination/NewDestination"
    ),
);
const NewDestinationForm = lazy(
  () =>
    import(
      "@/components/dashboard/components/Destination/components/NewDestination/components/NewDestinationForm"
    ),
);
const Plans = lazy(
  () => import("@/components/dashboard/components/Plans/Plans"),
);

// Layouts
const AuthLayout = lazy(() => import("@/layouts/AuthLayout"));
const DashboardLayout = lazy(() => import("@/layouts/DashboardLayout"));
const WebsiteLayout = lazy(() => import("@/layouts/WebsiteLayout"));

// Pages
const LoginPage = lazy(() => import("@/pages/auth/LoginPage"));
const RegisterPage = lazy(() => import("@/pages/auth/RegisterPage"));
const SettingsPage = lazy(() => import("@/pages/dashboard/SettingsPage"));
const HomePage = lazy(() => import("@/pages/website/HomePage"));

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
          {
            path: `${ClientRoutes.DESTINATION.ROOT}/${ClientRoutes.DESTINATION.CONFIGURE}`,
            element: <NewDestinationForm />,
          },
          /** End Destination Routes */
          { path: ClientRoutes.PLANS, element: <Plans /> },
          { path: "settings", element: <SettingsPage /> },
        ],
      },
    ],
  },
]);
