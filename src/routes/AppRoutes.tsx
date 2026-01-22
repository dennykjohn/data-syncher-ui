import { lazy } from "react";

import { Navigate, createBrowserRouter } from "react-router";

import ConnectorConfiguration from "@/components/dashboard/components/Connectors/components/NewConnector/components/ConnectorConfiguration/ConnectorConfiguration";
import LoadingSpinner from "@/components/shared/Spinner";
import ClientRoutes from "@/constants/client-routes";
import useAuth from "@/context/Auth/useAuth";
import usePermissions from "@/hooks/usePermissions";
import NotFound from "@/shared/NotFound";
import RouteError from "@/shared/RouteError";

import {
  ForgotPassword,
  LoginPage,
  RegisterPage,
  ResetPassword,
} from "./AuthRoutes";
import {
  ConnectorDetails,
  ConnectorOverview,
  ConnectorSchema,
  ConnectorSettings,
  ConnectorUsage,
  Connectors,
  NewConnector,
  ReverseSchema,
} from "./ConnectorRoutes";
import {
  Destination,
  DestinationForm,
  NewDestination,
} from "./DestinationRoutes";
import { AuthLayout, DashboardLayout } from "./LayoutRoutes";

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

const EmailSettings = lazy(
  () => import("@/components/dashboard/components/AccountSettings/Email/Email"),
);

// Pages
//const HomePage = lazy(() => import("@/pages/website/HomePage"));

const DashboardIndex = () => {
  const { authState } = useAuth();
  const { can } = usePermissions();
  const user = authState.user;

  // Wait for user profile to load
  if (!user) {
    return <LoadingSpinner />;
  }

  // Priority 1: Connectors (Admin & Analysts usually have this)
  if (can("can_view_connectors")) {
    return <Navigate to={ClientRoutes.CONNECTORS.ROOT} replace />;
  }

  // Priority 2: Billing (Billing role usually has this)
  if (can("can_access_billing")) {
    return (
      <Navigate
        to={`${ClientRoutes.ACCOUNT_SETTINGS.ROOT}/${ClientRoutes.ACCOUNT_SETTINGS.BILLING}`}
        replace
      />
    );
  }

  // Priority 3: Default to Profile (All logged-in users)
  return (
    <Navigate
      to={`${ClientRoutes.USER_SETTINGS.ROOT}/${ClientRoutes.USER_SETTINGS.PROFILE}`}
      replace
    />
  );
};

export const router = createBrowserRouter([
  // Setup Website Routes in the below object
  {
    path: ClientRoutes.HOME,
    element: (
      <Navigate to={`${ClientRoutes.AUTH}/${ClientRoutes.LOGIN}`} replace />
    ),
    //children: [{ index: true, element: <HomePage /> }],
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
      { path: ClientRoutes.RESET_PASSWORD, element: <ResetPassword /> },
    ],
  },
  // 🌟 PROTECTED ROUTES
  {
    element: <ProtectedRoute />,
    errorElement: <RouteError />,
    children: [
      {
        path: ClientRoutes.DASHBOARD,
        element: <DashboardLayout />,
        children: [
          {
            index: true,
            element: <DashboardIndex />,
          },

          /** Start Connectors Routes */
          {
            path: ClientRoutes.CONNECTORS.ROOT,
            element: (
              <ProtectedRoute permission="can_view_connectors">
                <Connectors />
              </ProtectedRoute>
            ),
          },
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
                path: ClientRoutes.CONNECTORS.REVERSE_SCHEMA,
                element: <ReverseSchema />,
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
          {
            path: ClientRoutes.DESTINATION.ROOT,
            element: (
              <ProtectedRoute permission="can_view_destinations">
                <Destination />
              </ProtectedRoute>
            ),
          },
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
          {
            path: ClientRoutes.PLANS,
            element: (
              <ProtectedRoute permission="can_access_billing">
                <Plans />
              </ProtectedRoute>
            ),
          },
          /** Start User Settings Routes */
          {
            path: `${ClientRoutes.USER_SETTINGS.ROOT}/${ClientRoutes.USER_SETTINGS.USERS}`,
            element: (
              <ProtectedRoute permission="can_view_users">
                <Users />
              </ProtectedRoute>
            ),
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
            path: `${ClientRoutes.ACCOUNT_SETTINGS.ROOT}/${ClientRoutes.ACCOUNT_SETTINGS.BILLING}`,
            element: (
              <ProtectedRoute permission="can_access_billing">
                <AccountSettings />
              </ProtectedRoute>
            ),
          },
          {
            path: `${ClientRoutes.ACCOUNT_SETTINGS.ROOT}/${ClientRoutes.ACCOUNT_SETTINGS.EMAIL}`,
            element: (
              <ProtectedRoute permission="can_access_settings">
                <EmailSettings />
              </ProtectedRoute>
            ),
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
