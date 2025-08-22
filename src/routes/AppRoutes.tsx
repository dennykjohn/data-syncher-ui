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
const ConnectorDetails = lazy(
  () =>
    import(
      "@/components/dashboard/components/Connectors/components/ConnectorDetails/ConnectorDetails"
    ),
);
const ConnectorOverview = lazy(
  () =>
    import(
      "@/components/dashboard/components/Connectors/components/ConnectorDetails/components/Tabs/Overview"
    ),
);
const ConnectorSchema = lazy(
  () =>
    import(
      "@/components/dashboard/components/Connectors/components/ConnectorDetails/components/Tabs/Schema"
    ),
);
const ConnectorUsage = lazy(
  () =>
    import(
      "@/components/dashboard/components/Connectors/components/ConnectorDetails/components/Tabs/Usage"
    ),
);
const ConnectorSettings = lazy(
  () =>
    import(
      "@/components/dashboard/components/Connectors/components/ConnectorDetails/components/Tabs/Settings"
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
const DestinationForm = lazy(
  () =>
    import(
      "@/components/dashboard/components/Destination/components/NewDestination/components/DestinationForm"
    ),
);
const Plans = lazy(
  () => import("@/components/dashboard/components/Plans/Plans"),
);
const Profile = lazy(
  () =>
    import("@/components/dashboard/components/UserSettings/Profile/Profile"),
);
const Users = lazy(
  () => import("@/components/dashboard/components/UserSettings/Users/Users"),
);
const AccountSettings = lazy(
  () =>
    import("@/components/dashboard/components/AccountSettings/AccountSettings"),
);

// Layouts
const AuthLayout = lazy(() => import("@/layouts/AuthLayout"));
const DashboardLayout = lazy(() => import("@/layouts/DashboardLayout"));
const WebsiteLayout = lazy(() => import("@/layouts/WebsiteLayout"));

// Pages
const LoginPage = lazy(() => import("@/pages/auth/LoginPage"));
const RegisterPage = lazy(() => import("@/pages/auth/RegisterPage"));
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
          {
            path: `${ClientRoutes.CONNECTORS.ROOT}/${ClientRoutes.CONNECTORS.EDIT}/:connectionId`,
            element: <ConnectorDetails />,
            children: [
              {
                index: true,
                element: (
                  <Navigate to={ClientRoutes.CONNECTORS.OVERVIEW} replace />
                ),
              },
              {
                path: ClientRoutes.CONNECTORS.OVERVIEW,
                element: <ConnectorOverview />,
              },
              {
                path: ClientRoutes.CONNECTORS.SCHEMA,
                element: <ConnectorSchema />,
              },
              {
                path: ClientRoutes.CONNECTORS.USAGE,
                element: <ConnectorUsage />,
              },
              {
                path: ClientRoutes.CONNECTORS.SETTINGS,
                element: <ConnectorSettings />,
              },
            ],
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
            element: <DestinationForm mode="add" />,
          },
          {
            path: `${ClientRoutes.DESTINATION.ROOT}/${ClientRoutes.DESTINATION.EDIT}/:destinationId`,
            element: <DestinationForm mode="edit" />,
          },
          /** End Destination Routes */
          { path: ClientRoutes.PLANS, element: <Plans /> },
          /** Start User Settings Routes */
          {
            path: `${ClientRoutes.USER_SETTINGS.ROOT}/${ClientRoutes.USER_SETTINGS.USERS}`,
            element: <Users />,
          },
          {
            path: `${ClientRoutes.USER_SETTINGS.ROOT}/${ClientRoutes.USER_SETTINGS.PROFILE}`,
            element: <Profile />,
          },
          /** End User Settings Routes */
          {
            path: ClientRoutes.ACCOUNT_SETTINGS.ROOT,
            element: <AccountSettings />,
          },
        ],
      },
    ],
  },
]);
