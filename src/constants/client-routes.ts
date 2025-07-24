const ClientRoutes = {
  // Website
  HOME: "/",

  // Auth
  AUTH: "/auth",
  LOGIN: "login",
  REGISTER: "register",

  // Dashboard
  DASHBOARD: "/dashboard",
  CONNECTORS: {
    ROOT: "connectors",
    ADD: "add",
  },
  DESTINATION: {
    ROOT: "destinations",
    ADD: "add",
  },
  PLANS: "plans",
} as const;
export default ClientRoutes;
