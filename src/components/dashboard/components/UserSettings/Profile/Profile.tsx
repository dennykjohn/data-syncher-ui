import { Flex } from "@chakra-ui/react";

import PageHeader from "@/components/dashboard/wrapper/PageHeader";

import ProfileForm from "./Form";

const Profile = () => {
  return (
    <Flex direction="column" gap={8}>
      <PageHeader
        breadcrumbs={[
          {
            label: "User Settings",
            route: "",
          },
        ]}
        title="Profile"
        subtitle="You can update your personal details here"
      />
      <ProfileForm />
    </Flex>
  );
};

export default Profile;
