import { GridItem, useBreakpointValue } from "@chakra-ui/react";

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
    >
      Header
    </GridItem>
  );
};
export default Header;
