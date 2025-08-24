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
    EDIT: "edit",
    OVERVIEW: "overview",
    SCHEMA: "schema",
    USAGE: "usage",
    SETTINGS: "settings",
  },
  DESTINATION: {
    ROOT: "destinations",
    ADD: "add",
    EDIT: "edit",
    CONFIGURE: "configure",
  },
  PLANS: "plans",
  USER_SETTINGS: {
    ROOT: "user-settings",
    USERS: "users",
    USER_ADD: "add",
    USER_EDIT: "edit",
    PROFILE: "profile",
  },
  ACCOUNT_SETTINGS: {
    ROOT: "account",
  },
} as const;
export default ClientRoutes;
