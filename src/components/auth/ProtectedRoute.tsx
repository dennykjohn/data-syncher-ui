import Cookies from "js-cookie";
import { Navigate, Outlet, useLocation } from "react-router";

import ClientRoutes from "@/constants/client-routes";
import useAuth from "@/context/Auth/useAuth";
import usePermissions from "@/hooks/usePermissions";
import { Permissions } from "@/types/auth";

const isAuthenticated = (): boolean => {
  const token = Cookies.get("access_token");
  return Boolean(token);
};

interface ProtectedRouteProps {
  permission?: keyof Permissions;
  children?: React.ReactNode;
}

const ProtectedRoute = ({ permission, children }: ProtectedRouteProps) => {
  const location = useLocation();
  const { authState } = useAuth();
  const { can } = usePermissions();

  const user = authState.user;
  const isTrialExpired = user?.is_trial_expired ?? false;

  const isOnPlansPage =
    location.pathname === `${ClientRoutes.DASHBOARD}/${ClientRoutes.PLANS}`;

  if (!isAuthenticated()) {
    return <Navigate to={ClientRoutes.AUTH} replace />;
  }

  // Check trial expiration
  if (isTrialExpired && !isOnPlansPage) {
    return (
      <Navigate
        to={`${ClientRoutes.DASHBOARD}/${ClientRoutes.PLANS}`}
        replace
      />
    );
  }

  // If a specific permission is required, check it
  if (permission && !can(permission)) {
    return <Navigate to={ClientRoutes.DASHBOARD} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;
