import {
  Box,
  Flex,
  GridItem,
  Image,
  Text,
  useBreakpointValue,
} from "@chakra-ui/react";

import { MdCategory, MdOutlineArrowRightAlt, MdWrapText } from "react-icons/md";

import { useLocation, useNavigate } from "react-router";

import CustomerIcon from "@/assets/images/customer-icon.svg";
import Logo from "@/assets/images/logo.svg";
import ClientRoutes from "@/constants/client-routes";

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
  const sidebarDisplay = isDrawer
    ? "block"
    : useBreakpointValue({ base: "none", md: "block" });
  const isActive = (path: string, exact = false) =>
    exact ? location.pathname === path : location.pathname.includes(path);

  const NavLinks = [
    {
      label: "Connectors",
      icon: <MdOutlineArrowRightAlt size={24} />,
      path: ClientRoutes.CONNECTORS.ROOT,
    },
    {
      label: "Destination",
      icon: <MdWrapText size={24} />,
      path: ClientRoutes.DESTINATION.ROOT,
    },
    {
      label: "Plans",
      icon: <MdCategory size={24} />,
      path: ClientRoutes.PLANS,
    },
  ];

  return (
    <GridItem
      paddingBlock={4}
      area="sidebar"
      bg="#2A2D3E"
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
          style={{ fill: "white" }}
        />
        <Text fontSize="2xl" fontWeight="semibold">
          Datasyncher
        </Text>
      </Flex>
      <Flex marginBlock={8}>
        <Flex
          borderLeft="3px solid"
          borderColor="brand.accentOrange"
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
            <Text fontSize="xl" fontWeight="semibold">
              Edvanta
            </Text>
          </Box>
        </Flex>
      </Flex>
      <Flex flexDirection={"column"} gap={2}>
        {NavLinks.map(({ label, icon, path }) => {
          const active = isActive(path);

          return (
            <Flex
              key={label}
              alignItems="center"
              paddingBlock={2}
              paddingInline={3}
              cursor={"pointer"}
              gap={2}
              onClick={() => {
                navigate(path);
                onMenuItemClick?.();
              }}
              color={active ? "brand.accentOrange" : "white"}
              _hover={{
                bgColor: "gray.600",
                color: active ? "brand.accentOrange" : "white",
              }}
              transition="background-color 0.2s, color 0.2s"
            >
              {icon}
              {isActive(path)}
              <Text fontSize="lg">{label}</Text>
            </Flex>
          );
        })}
      </Flex>
    </GridItem>
  );
};

export default Sidebar;
