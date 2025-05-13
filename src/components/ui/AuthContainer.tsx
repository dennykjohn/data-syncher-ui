import { ReactNode } from "react";

import { Flex, FlexProps } from "@chakra-ui/react";

type AuthContainerProps = FlexProps & {
  children: ReactNode;
};

export default function AuthContainer({
  children,
  ...props
}: AuthContainerProps) {
  return (
    <Flex
      as="main"
      flex={1}
      flexDirection="column"
      alignItems="center"
      overflowY="auto"
      h="100vh"
      {...props}
    >
      {children}
    </Flex>
  );
}
