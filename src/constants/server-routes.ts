const ServerRoutes = {
  auth: {
    login: () => "/authentication/",
    profile: () => "/user/profile/",
    companyDetails: ({ companyId }: { companyId: string }) =>
      `/company-details/${companyId}`,
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
    fetchConnectorById: (id: string) => `connection/setup/${id}`,
  },
  user: {
    createUser: () => "users/",
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
    getCurrentUserProfile: () => "user/profile/",
  },
} as const;

export default ServerRoutes;
