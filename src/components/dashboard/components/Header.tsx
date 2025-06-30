import { Box, GridItem, useBreakpointValue } from "@chakra-ui/react";

import { LuPanelLeftClose } from "react-icons/lu";

const Header = ({ sidebarWidth }: { sidebarWidth: string }) => {
  const sidebarDisplay = useBreakpointValue({ base: "none", md: "block" });

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
      pl={6}
      display="flex"
      alignItems="center"
      boxShadow={"0 2px 4px rgba(0, 0, 0, 0.1)"}
    >
      <Box color="gray.500">
        <LuPanelLeftClose size={24} cursor="pointer" />
      </Box>
    </GridItem>
  );
};
export default Header;
