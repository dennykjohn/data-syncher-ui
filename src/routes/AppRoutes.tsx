import { lazy } from "react";

import { Navigate, createBrowserRouter } from "react-router";

import ConnectorConfiguration from "@/components/dashboard/components/Connectors/components/NewConnector/components/ConnectorConfiguration/ConnectorConfiguration";
import ClientRoutes from "@/constants/client-routes";
import NotFound from "@/shared/NotFound";

import { ForgotPassword, LoginPage, RegisterPage } from "./AuthRoutes";
import {
  ConnectorDetails,
  ConnectorOverview,
  ConnectorSchema,
  ConnectorSettings,
  ConnectorUsage,
  Connectors,
  NewConnector,
} from "./ConnectorRoutes";
import {
  Destination,
  DestinationForm,
  NewDestination,
} from "./DestinationRoutes";
import { AuthLayout, DashboardLayout, WebsiteLayout } from "./LayoutRoutes";

const ProtectedRoute = lazy(() => import("@/components/auth/ProtectedRoute"));

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
const UserForm = lazy(
  () =>
    import(
      "@/components/dashboard/components/UserSettings/Users/UserForm/UserForm"
    ),
);
const AccountSettings = lazy(
  () =>
    import("@/components/dashboard/components/AccountSettings/Billing/Billing"),
);

// Pages
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
      { path: ClientRoutes.FORGOT_PASSWORD, element: <ForgotPassword /> },
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
            path: `${ClientRoutes.CONNECTORS.ROOT}/${ClientRoutes.CONNECTORS.EDIT_CONFIGURATION}/:connectionId`,
            element: <ConnectorConfiguration mode="edit" />,
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
            path: `${ClientRoutes.USER_SETTINGS.ROOT}/${ClientRoutes.USER_SETTINGS.USERS}/${ClientRoutes.USER_SETTINGS.USER_ADD}`,
            element: <UserForm mode="add" />,
          },
          {
            path: `${ClientRoutes.USER_SETTINGS.ROOT}/${ClientRoutes.USER_SETTINGS.USERS}/${ClientRoutes.USER_SETTINGS.USER_EDIT}/:userId`,
            element: <UserForm mode="edit" />,
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
  {
    path: "*",
    element: <NotFound />,
  },
]);
