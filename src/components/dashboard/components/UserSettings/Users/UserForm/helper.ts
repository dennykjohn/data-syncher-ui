import ClientRoutes from "@/constants/client-routes";

const UserHomePage = {
  label: "Users",
  route: `${ClientRoutes.DASHBOARD}/${ClientRoutes.USER_SETTINGS.ROOT}/${ClientRoutes.USER_SETTINGS.USERS}`,
};

const BreadcrumbsForNewUser = [UserHomePage, { label: "Add Member" }];

const BreadcrumbsForEditUser = [UserHomePage, { label: "Edit Member" }];

export { BreadcrumbsForNewUser, BreadcrumbsForEditUser };
