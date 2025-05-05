import { Outlet } from "react-router";

export default function AuthLayout() {
  return (
    <div>
      <h2>Auth Area</h2>
      <Outlet />
    </div>
  );
}
