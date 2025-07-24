const ServerRoutes = {
  auth: {
    login: () => "/authentication/",
    profile: () => "/user/profile/",
    companyDetails: ({ companyId }: { companyId: string }) =>
      `/company-details/${companyId}`,
  },
  destination: {
    listMasterDestinations: () => "destinations/all/",
    selectDestination: () => "destinations/select-destination/",
  },
} as const;

export default ServerRoutes;
