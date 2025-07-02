import { Flex } from "@chakra-ui/react";

const Destination = () => {
  return (
    <Flex
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      height="100%"
      width="100%"
      padding={4}
    >
      <h1>Destination Page</h1>
      <p>This is where you can manage your destinations.</p>
    </Flex>
  );
};

export default Destination;
