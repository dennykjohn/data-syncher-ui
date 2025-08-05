import { useState } from "react";

import {
  Avatar,
  Flex,
  GridItem,
  Menu,
  Portal,
  useBreakpointValue,
} from "@chakra-ui/react";

import { RxHamburgerMenu } from "react-icons/rx";

import useAuth from "@/context/Auth/useAuth";

import SidebarMobile from "./SidebarMobile";

const Header = ({ sidebarWidth }: { sidebarWidth: string }) => {
  const sidebarDisplay = useBreakpointValue({ base: "none", md: "block" });
  const {
    logout,
    authState: { user },
  } = useAuth();
  const [showSidebar, setShowSidebar] = useState(false);

  return (
    <GridItem
      area="header"
      color="white"
      position="fixed"
      top={0}
      left={sidebarDisplay === "block" ? sidebarWidth : "0"}
      right={0}
      height="60px"
      zIndex="999"
      paddingInline={6}
      display="flex"
      alignItems="center"
      boxShadow={"0 2px 4px rgba(0, 0, 0, 0.1)"}
    >
      {showSidebar && (
        <SidebarMobile
          showSidebar={showSidebar}
          setShowSidebar={setShowSidebar}
        />
      )}
      <Flex
        display={{ base: "flex", md: "none" }}
        alignItems="center"
        justifyContent="space-between"
        cursor="pointer"
        onClick={() => setShowSidebar(true)}
      >
        <RxHamburgerMenu size={24} color="gray" />
      </Flex>
      <Flex
        marginLeft="auto"
        justifyContent="space-between"
        alignItems={"center"}
      >
        <Menu.Root positioning={{ placement: "bottom-end" }}>
          <Menu.Trigger rounded="full">
            <Avatar.Root colorPalette="blue" cursor="pointer">
              <Avatar.Fallback name={user?.first_name} />
            </Avatar.Root>
          </Menu.Trigger>
          <Portal>
            <Menu.Positioner>
              <Menu.Content>
                <Menu.Item value="account" cursor="pointer">
                  My Account
                </Menu.Item>
                <Menu.Item value="settings" cursor="pointer">
                  Settings
                </Menu.Item>
                <Menu.Item
                  value="logout"
                  cursor="pointer"
                  onClick={() => {
                    logout();
                  }}
                >
                  Logout
                </Menu.Item>
              </Menu.Content>
            </Menu.Positioner>
          </Portal>
        </Menu.Root>
      </Flex>
    </GridItem>
  );
};
export default Header;
