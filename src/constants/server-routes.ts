const ServerRoutes = {
  common: {
    fetchFormSchema: ({ type, source }: { type: string; source: string }) =>
      `${source}/schema/${type}/`,
  },
  auth: {
    login: () => "/authentication/",
    profile: () => "/user/profile/",
    companyDetails: ({ companyId }: { companyId: string }) =>
      `/company-details/${companyId}`,
    passwordReset: () => "password-reset/",
  },
  source: {
    listMasterSources: () => "source/all/",
  },
  destination: {
    listMasterDestinations: () => "destinations/all/",
    selectDestination: () => "destinations/select-destination/",
    createDestination: () => "destinations/create/",
    listDestinationsByPage: ({
      page,
      size,
      searchTerm,
    }: {
      page: number;
      size: number;
      searchTerm?: string;
    }) =>
      `destinations?page=${page}&size=${size}${searchTerm ? `&search=${searchTerm}` : ""}`,
    fetchDestinationById: (id: string) => `destinations/detail/${id}`,
    // Below API to be corrected
    fetchAllUserCreatedDestinationList: () => "/destinations/?page=1&size=100",
    updateDestination: (id: string) => `destinations/update/${id}/`,
  },
  connector: {
    listConnectorsByPage: ({
      page,
      size,
      searchTerm,
    }: {
      page: number;
      size: number;
      searchTerm?: string;
    }) =>
      `home?page=${page}&size=${size}${searchTerm ? `&search=${searchTerm}` : ""}`,
    fetchConnectorById: (id: number) => `connection/setup/${id}`,
    fetchConnectorUsageById: (id: number) => `connection/${id}/usage/`,
    fetchConnectorSettings: (id: number) => `connection/setup/${id}/`,
    toggleStatus: (id: number) => `connection/${id}/toggle/`,
    fetchConnectorTableById: (id: number) => `connection/${id}/tables/`,
    refreshSchema: (id: number) => `connection/${id}/refresh-schema/`,
  },
  user: {
    createUser: () => "users/",
    listUserRoles: () => "roles/",
    listUsersByPage: ({
      page,
      size,
      searchTerm,
    }: {
      page: number;
      size: number;
      searchTerm?: string;
    }) =>
      `users?page=${page}&size=${size}${searchTerm ? `&search=${searchTerm}` : ""}`,
    fetchUserById: (id: number) => `users/${id}`,
    updateUser: (id: number) => `users/${id}`,
    getCurrentUserProfile: () => "user/profile/",
    updateCurrentUserProfile: () => `user/profile/`,
  },
  billing: {
    listCurrentMonthBilling: ({ companyId }: { companyId: string }) =>
      `billing/summary/${companyId}`,
    listAnnualBilling: ({ companyId }: { companyId: string }) =>
      `billing/${companyId}/annual-usage/`,
  },
} as const;

export default ServerRoutes;
