import {
  Avatar,
  Flex,
  GridItem,
  Menu,
  Portal,
  useBreakpointValue,
} from "@chakra-ui/react";

import useAuth from "@/context/Auth/useAuth";

const Header = ({ sidebarWidth }: { sidebarWidth: string }) => {
  const sidebarDisplay = useBreakpointValue({ base: "none", md: "block" });
  const { logout } = useAuth();

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
      <Flex
        marginLeft="auto"
        justifyContent="space-between"
        alignItems={"center"}
      >
        <Menu.Root positioning={{ placement: "bottom-end" }}>
          <Menu.Trigger rounded="full">
            <Avatar.Root colorPalette="blue" cursor="pointer">
              <Avatar.Fallback name="Random" />
              <Avatar.Image src="https://randomuser.me/api/portraits/men/42.jpg" />
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
