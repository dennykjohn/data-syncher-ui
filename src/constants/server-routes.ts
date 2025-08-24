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
    listDestinationsByPage: ({ page, size }: { page: number; size: number }) =>
      `destinations?page=${page}&size=${size}`,
    fetchDestinationById: (id: string) => `destinations/detail/${id}`,
    // Below API to be corrected
    fetchAllUserCreatedDestinationList: () => "/destinations/?page=1&size=100",
    updateDestination: (id: string) => `destinations/update/${id}/`,
  },
  connector: {
    listConnectorsByPage: ({ page, size }: { page: number; size: number }) =>
      `home?page=${page}&size=${size}`,
    fetchConnectorById: (id: string) => `connection/setup/${id}`,
  },
  user: {
    listUsersByPage: ({ page, size }: { page: number; size: number }) =>
      `users?page=${page}&size=${size}`,
    fetchUserById: (id: string) => `users/detail/${id}`,
  },
} as const;

export default ServerRoutes;
