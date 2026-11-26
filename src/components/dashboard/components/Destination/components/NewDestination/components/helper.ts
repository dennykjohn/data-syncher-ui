import ClientRoutes from "@/constants/client-routes";

const BreadcrumbsForNewDestination = [
  {
    label: "Destinations",
    route: `${ClientRoutes.DASHBOARD}/${ClientRoutes.DESTINATION.ROOT}`,
  },
  {
    label: "Add Destination",
    route: `${ClientRoutes.DASHBOARD}/${ClientRoutes.DESTINATION.ROOT}/${ClientRoutes.DESTINATION.ADD}`,
  },

  { label: "Configure" },
];

const BreadcrumbsForEditDestination = [
  {
    label: "Destinations",
    route: `${ClientRoutes.DASHBOARD}/${ClientRoutes.DESTINATION.ROOT}`,
  },
  { label: "Edit Destination" },
];

export { BreadcrumbsForNewDestination, BreadcrumbsForEditDestination };
