const ServerRoutes = {
  auth: {
    login: () => "/authentication/",
    profile: () => "/user/profile/",
    companyDetails: ({ companyId }: { companyId: string }) =>
      `/company-details/${companyId}`,
  },
  destination: {
    listAllDestinations: () => "destinations/all/",
  },
} as const;

export default ServerRoutes;
