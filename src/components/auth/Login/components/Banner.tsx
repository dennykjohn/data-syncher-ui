import { Box, BoxProps } from "@chakra-ui/react";

import Logo from "@/assets/logo.svg?url";

type BannerProps = BoxProps;

const Banner = (props: BannerProps) => {
  return (
    <Box
      {...props}
      display={{ base: "none", md: "block" }}
      width="100%"
      height="100%"
      backgroundColor="brand.100"
      backgroundImage={`url(${Logo})`}
      backgroundSize="contain"
      backgroundRepeat="no-repeat"
      backgroundPosition="center"
    />
  );
};
export default Banner;
