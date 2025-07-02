const ClientRoutes = {
  // Website
  HOME: "/",

  // Auth
  AUTH: "/auth",
  LOGIN: "login",
  REGISTER: "register",

  // Dashboard
  DASHBOARD: "/dashboard",
  CONNECTORS: "connectors",
  DESTINATION: "destination",
  PLANS: "plans",
} as const;
export default ClientRoutes;
