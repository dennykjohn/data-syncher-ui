import { Flex, Text } from "@chakra-ui/react";

const Profile = () => {
  return (
    <Flex direction="column" p={4}>
      <Text fontSize="2xl" mb={4}>
        User Profile
      </Text>
      {/* User profile components go here */}
    </Flex>
  );
};

export default Profile;
