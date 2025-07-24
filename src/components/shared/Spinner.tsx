import { Flex, Spinner } from "@chakra-ui/react";

const LoadingSpinner = () => (
  <Flex
    justify="center"
    align="center"
    height="100%"
    position={"absolute"}
    width="100%"
  >
    <Spinner color="brand.500" animationDuration="0.8s" size="lg" />
  </Flex>
);

export default LoadingSpinner;
