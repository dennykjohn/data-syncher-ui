import { Drawer, Portal } from "@chakra-ui/react";

import Sidebar from "./Sidebar";

const SidebarMobile = ({
  showSidebar,
  setShowSidebar,
}: {
  showSidebar: boolean;
  setShowSidebar: (_open: boolean) => void;
}) => {
  return (
    <Drawer.Root
      open={showSidebar}
      onOpenChange={() => {
        setShowSidebar(false);
      }}
      placement="start"
      size="xs"
    >
      <Portal>
        <Drawer.Backdrop />
        <Drawer.Positioner>
          <Drawer.Content maxW="240px">
            <Sidebar
              sidebarWidth="240px"
              isDrawer={true}
              onMenuItemClick={() => setShowSidebar(false)}
            />
          </Drawer.Content>
        </Drawer.Positioner>
      </Portal>
    </Drawer.Root>
  );
};

export default SidebarMobile;
