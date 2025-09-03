import { Flex } from "@chakra-ui/react";

import PageHeader from "@/components/dashboard/wrapper/PageHeader";
import { VIEW_CONFIG } from "@/constants/view-config";

import ProfileForm from "./Form";

const Profile = () => {
  return (
    <Flex direction="column" gap={VIEW_CONFIG.pageGap}>
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
