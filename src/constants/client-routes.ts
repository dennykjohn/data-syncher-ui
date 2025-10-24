const ClientRoutes = {
  // Website
  HOME: "/",

  // Auth
  AUTH: "/auth",
  LOGIN: "login",
  REGISTER: "register",
  FORGOT_PASSWORD: "forgot-password",
  RESET_PASSWORD: "reset-password",

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
    EDIT_CONFIGURATION: "edit-configuration",
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
    BILLING: "billing",
    EMAIL: "communication-support",
  },
} as const;
export default ClientRoutes;
