import { Outlet } from "react-router";

export default function DashboardLayout() {
  return (
    <div>
      <nav>Dashboard Navigation</nav>
      <Outlet />
    </div>
  );
}
