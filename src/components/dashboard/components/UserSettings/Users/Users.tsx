import { Flex, Text } from "@chakra-ui/react";

const Users = () => {
  return (
    <Flex direction="column" p={4}>
      <Text fontSize="2xl" mb={4}>
        User Management
      </Text>
      {/* User management components go here */}
    </Flex>
  );
};

export default Users;
