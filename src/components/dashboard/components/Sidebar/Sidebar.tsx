import {
  Box,
  Flex,
  GridItem,
  Image,
  Text,
  useBreakpointValue,
} from "@chakra-ui/react";

import { FaUsers } from "react-icons/fa6";
import { MdCategory, MdOutlineArrowRightAlt, MdWrapText } from "react-icons/md";

import { useLocation, useNavigate } from "react-router";

import CustomerIcon from "@/assets/images/customer-icon.svg";
import Logo from "@/assets/images/logo.svg";
import ClientRoutes from "@/constants/client-routes";
import useAuth from "@/context/Auth/useAuth";

import SidebarAccordion from "./Accordion";
import MenuItem from "./MenuItem";

const Sidebar = ({
  sidebarWidth,
  isDrawer,
  onMenuItemClick,
}: {
  sidebarWidth: string;
  isDrawer: boolean;
  onMenuItemClick?: () => void;
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const breakpointDisplay = useBreakpointValue({ base: "none", md: "block" });
  const sidebarDisplay = isDrawer ? "block" : breakpointDisplay;
  const isActive = (path: string, exact = false) =>
    exact ? location.pathname === path : location.pathname.includes(path);
  const {
    authState: { user },
  } = useAuth();

  const NavLinks = [
    {
      label: "Connectors",
      icon: <MdOutlineArrowRightAlt size={24} />,
      path: ClientRoutes.CONNECTORS.ROOT,
      isAccordion: false,
    },
    {
      label: "Destination",
      icon: <MdWrapText size={24} />,
      path: ClientRoutes.DESTINATION.ROOT,
      isAccordion: false,
    },
    {
      label: "User Settings",
      icon: <FaUsers size={24} />,
      path: ClientRoutes.USER_SETTINGS.ROOT,
      isAccordion: true,
    },
    {
      label: "Plans",
      icon: <MdCategory size={24} />,
      path: ClientRoutes.PLANS,
      isAccordion: false,
    },
  ];

  return (
    <GridItem
      paddingBlock={4}
      area="sidebar"
      bg="gray.800"
      display={sidebarDisplay}
      position="fixed"
      top={0}
      left={0}
      width={sidebarWidth}
      height="100vh"
      overflowY="auto"
      zIndex="1000"
      color="white"
    >
      <Flex justifyContent="flex-start" alignItems="center" gap={2} p={2}>
        <Image
          src={Logo}
          alt="Logo"
          width={{ base: "40px", md: "30px" }}
          height={{ base: "40px", md: "30px" }}
          cursor="pointer"
          transition="transform 0.2s"
          _hover={{ transform: "scale(1.05)" }}
          onClick={() => navigate(ClientRoutes.CONNECTORS.ROOT)}
        />
        <Text fontSize="2xl" fontWeight="semibold" color="white">
          Datasyncher
        </Text>
      </Flex>
      <Flex marginBlock={8}>
        <Flex
          borderLeft="3px solid"
          borderColor="#9370DB"
          alignItems="center"
          gap={4}
          h="50px"
        >
          <Image
            src={CustomerIcon}
            alt="Customer Icon"
            width="28px"
            height="28px"
            ml={2}
          />
          <Box>
            <Text fontSize="xl" fontWeight="semibold" color="white">
              {user?.company?.cmp_name}
            </Text>
          </Box>
        </Flex>
      </Flex>
      <Flex flexDirection={"column"} gap={2}>
        {NavLinks.map((props) => {
          const { label, icon, path, isAccordion } = props;
          const active = isActive(path);

          if (isAccordion) {
            return (
              <SidebarAccordion
                key={label}
                active={active}
                isActive={isActive}
                onMenuItemClick={onMenuItemClick}
              />
            );
          }

          return (
            <MenuItem
              key={label}
              label={label}
              icon={icon}
              isActive={isActive}
              path={path}
              active={active}
              onMenuItemClick={onMenuItemClick}
            />
          );
        })}
      </Flex>
    </GridItem>
  );
};

export default Sidebar;
