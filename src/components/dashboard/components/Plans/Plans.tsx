import { Flex } from "@chakra-ui/react";

const Plans = () => {
  return (
    <Flex
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      height="100%"
      width="100%"
      padding={4}
    >
      <h1>Plans Page</h1>
      <p>This is where you can manage your plans.</p>
    </Flex>
  );
};

export default Plans;
