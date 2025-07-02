import Cookies from "js-cookie";
import { Navigate, Outlet } from "react-router";

import ClientRoutes from "@/constants/client-routes";

const isAuthenticated = (): boolean => {
  const token = Cookies.get("access_token");
  return Boolean(token);
};

const ProtectedRoute = () => {
  return isAuthenticated() ? (
    <Outlet />
  ) : (
    <Navigate to={ClientRoutes.AUTH} replace />
  );
};

export default ProtectedRoute;
