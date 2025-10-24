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
    register: () => "authentication/",
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
      `destinations?page=${page}&size=${size}${searchTerm ? `&name=${searchTerm}` : ""}`,
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
      `home?page=${page}&size=${size}${searchTerm ? `&name=${searchTerm}` : ""}`,
    fetchConnectorById: (id: number) => `connection/setup/${id}/`,
    fetchConnectorConfig: ({ type, id }: { type: string; id: number }) =>
      `source-config/${type}/${id}/`,
    updateConnectorConfig: ({
      connectorId,
      type,
    }: {
      connectorId: number;
      type: string;
    }) => `source-config/${type}/${connectorId}/update/`,
    fetchConnectorUsage: (id: number) => `connection/${id}/usage/`,
    fetchConnectorSettings: (id: number) => `connection/setup/${id}/`,
    fetchConnectorTable: (id: number) => `connection/${id}/tables/`,
    fetchConnectorSelectedTable: (id: number) =>
      `connection/${id}/selected-tables/`,
    fetchConnectionActivity: ({
      id,
      filterDays,
    }: {
      id: number;
      filterDays: number;
    }) =>
      `connection/${id}/activity/?${filterDays < 7 ? `hour=${filterDays}` : `days=${filterDays}`}`,
    fetchConnectionActivityDetails: ({
      connectionId,
      sessionId,
    }: {
      connectionId: number;
      sessionId: number;
    }) => `connection/${connectionId}/session/${sessionId}/`,
    createConnector: (type: string) => `source-config/${type}/create/`,
    updateConnectionSettings: (id: number) => `connection/${id}/update/`,
    toggleStatus: (id: number) => `connection/${id}/toggle/`,
    refreshSchema: (id: number) => `connection/${id}/refresh-schema/`,
    deleteConnection: (id: number) => `connection/${id}/delete/`,
    testStatus: (id: number) => `connection/${id}/test/`,
    updateSelectedTables: (id: number) => `connection/${id}/update-selection/`,
    updateSchema: (id: number) => `connection/${id}/fetch-tables/`,
    reloadSingleTable: () => `reload-single-table/`,
    refreshDeltaTable: () => `refresh-delta-table/`,
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
    updateUser: (id: number) => `users/${id}/`,
    getCurrentUserProfile: () => "user/profile/",
    updateCurrentUserProfile: () => `user/profile/`,
  },
  billing: {
    listCurrentMonthBilling: ({ companyId }: { companyId: number }) =>
      `billing/summary/${companyId}`,
    listAnnualBilling: ({ companyId }: { companyId: string }) =>
      `billing/${companyId}/annual-usage/`,
  },
  communicationSupport: {
    getDetails: () => "account/communication-support/",
    update: () => "account/communication-support/",
  },
} as const;

export default ServerRoutes;
