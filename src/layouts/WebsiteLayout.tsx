import { Outlet } from "react-router";

export default function WebsiteLayout() {
  return (
    <div>
      <header>App Header</header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
