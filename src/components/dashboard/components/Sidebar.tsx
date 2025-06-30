import {
  Box,
  Flex,
  GridItem,
  Image,
  Text,
  useBreakpointValue,
} from "@chakra-ui/react";

import Logo from "@/assets/logo.svg";

const Sidebar = ({ sidebarWidth }: { sidebarWidth: string }) => {
  const sidebarDisplay = useBreakpointValue({ base: "none", md: "block" });

  return (
    <GridItem
      paddingBlock={4}
      paddingInline={2}
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
      <Flex justifyContent={"center"} alignItems="center" gap={2}>
        <Image
          src={Logo}
          alt="Logo"
          width={{ base: "40px", md: "50px" }}
          height={{ base: "40px", md: "50px" }}
          cursor="pointer"
          transition="transform 0.2s"
          _hover={{ transform: "scale(1.05)" }}
          color={"white"}
        />
        <Text fontSize="2xl" fontWeight="semibold">
          Datasyncher
        </Text>
      </Flex>
      <Box p={4}>Sidebar Content</Box>
    </GridItem>
  );
};

export default Sidebar;
