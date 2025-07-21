const ServerRoutes = {
  auth: {
    login: () => "/authentication/",
    profile: () => "/profile-details",
    companyDetails: ({ companyId }: { companyId: string }) =>
      `/company-details/${companyId}`,
  },
} as const;

export default ServerRoutes;
