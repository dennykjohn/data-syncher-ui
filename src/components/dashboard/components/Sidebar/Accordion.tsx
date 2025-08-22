import { Accordion, Flex, Text } from "@chakra-ui/react";

import { FaUsers } from "react-icons/fa6";
import { MdOutlineSettings } from "react-icons/md";

import ClientRoutes from "@/constants/client-routes";

import MenuItem from "./MenuItem";

const SidebarAccordion = ({
  isActive,
  onMenuItemClick,
}: {
  active: boolean;
  isActive: (_path: string) => boolean;
  onMenuItemClick?: () => void;
}) => {
  return (
    <Accordion.Root collapsible paddingInline={3} variant="plain">
      {items.map(({ title, links, value, icon }, index) => (
        <Accordion.Item key={index} value={value} mt={2}>
          <Accordion.ItemTrigger
            justifyContent="space-between"
            cursor="pointer"
          >
            <Flex gap={2} alignItems="center">
              {icon}
              <Text fontSize="lg">{title}</Text>
            </Flex>
            <Accordion.ItemIndicator />
          </Accordion.ItemTrigger>
          <Accordion.ItemContent ml={6}>
            <Accordion.ItemBody>
              {links.map(({ label, path }) => {
                const active = isActive(path);
                return (
                  <MenuItem
                    key={label}
                    label={label}
                    path={path}
                    isActive={isActive}
                    onMenuItemClick={onMenuItemClick}
                    active={active}
                  />
                );
              })}
            </Accordion.ItemBody>
          </Accordion.ItemContent>
        </Accordion.Item>
      ))}
    </Accordion.Root>
  );
};

export default SidebarAccordion;

const items = [
  {
    value: "a",
    title: "User Settings",
    icon: <FaUsers size={24} />,
    links: [
      {
        label: "Profile",
        path: `${ClientRoutes.USER_SETTINGS.ROOT}/${ClientRoutes.USER_SETTINGS.PROFILE}`,
      },
      {
        label: "Users",
        path: `${ClientRoutes.USER_SETTINGS.ROOT}/${ClientRoutes.USER_SETTINGS.USERS}`,
      },
    ],
  },
  {
    value: "b",
    title: "Account Settings",
    icon: <MdOutlineSettings size={24} />,
    links: [{ label: "Billing", path: ClientRoutes.ACCOUNT_SETTINGS.ROOT }],
  },
];
