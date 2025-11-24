import { Flex, FlexProps, Spinner, SpinnerProps } from "@chakra-ui/react";

interface LoadingSpinnerProps {
  containerProps?: FlexProps;
  spinnerProps?: SpinnerProps;
}

const LoadingSpinner = ({
  containerProps,
  spinnerProps,
  size = "md",
  ...flexProps
}: LoadingSpinnerProps & FlexProps & { size?: SpinnerProps["size"] }) => (
  <Flex
    justify="center"
    align="center"
    height="100%"
    width="100%"
    {...flexProps}
    {...containerProps}
  >
    <Spinner
      color="brand.500"
      animationDuration="0.8s"
      size={size}
      {...spinnerProps}
    />
  </Flex>
);

export default LoadingSpinner;
