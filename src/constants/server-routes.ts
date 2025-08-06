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
    fetchAllUserCreatedDestinationList: () => "/destinations/?page=1&size=100",
  },
  connector: {
    listConnectorsByPage: ({ page, size }: { page: number; size: number }) =>
      `home?page=${page}&size=${size}`,
  },
} as const;

export default ServerRoutes;
