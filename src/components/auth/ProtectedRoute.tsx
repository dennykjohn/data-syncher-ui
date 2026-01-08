import { useContext } from "react";

import Cookies from "js-cookie";
import { Navigate, Outlet, useLocation } from "react-router";

import ClientRoutes from "@/constants/client-routes";
import { AuthContext } from "@/context/Auth/AuthContext";

const isAuthenticated = (): boolean => {
  const token = Cookies.get("access_token");
  return Boolean(token);
};

const ProtectedRoute = () => {
  const location = useLocation();
  const authContext = useContext(AuthContext);

  const isOnPlansPage =
    location.pathname === `${ClientRoutes.DASHBOARD}/${ClientRoutes.PLANS}`;

  if (!isAuthenticated()) {
    return <Navigate to={ClientRoutes.AUTH} replace />;
  }

  // Check trial expiration from user profile
  const isTrialExpired =
    authContext?.authState?.user?.is_trial_expired ?? false;

  if (isTrialExpired && !isOnPlansPage) {
    return (
      <Navigate
        to={`${ClientRoutes.DASHBOARD}/${ClientRoutes.PLANS}`}
        replace
      />
    );
  }

  return <Outlet />;
};

export default ProtectedRoute;
