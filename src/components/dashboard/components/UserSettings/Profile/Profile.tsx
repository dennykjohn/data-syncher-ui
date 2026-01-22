import { useMemo } from "react";

import { Flex } from "@chakra-ui/react";

import { format, parseISO } from "date-fns";

import PageHeader from "@/components/dashboard/wrapper/PageHeader";
import { VIEW_CONFIG } from "@/constants/view-config";
import useAuth from "@/context/Auth/useAuth";

import ProfileForm from "./Form";
import { initialState } from "./helper";

const Profile = () => {
  const { authState } = useAuth();
  const userProfile = authState.user;
  const isLoading = !userProfile;

  const initialFormState = useMemo(() => {
    if (!userProfile) return initialState;

    const regex = /(\.\d{3})\d+Z$/;
    const cleanedStartDate = parseISO(
      userProfile.company?.start_date.replace(regex, "$1Z"),
    );
    const cleanedEndDate = parseISO(
      userProfile.company?.end_date.replace(regex, "$1Z"),
    );

    return {
      firstName: userProfile.first_name,
      lastName: userProfile.last_name,
      company_email: userProfile.company_email,
      cmp_name: userProfile.company?.cmp_name,
      start_date: format(cleanedStartDate, "yyyy-MM-dd"),
      end_date: format(cleanedEndDate, "yyyy-MM-dd"),
    };
  }, [userProfile]);

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
      <ProfileForm
        key={initialFormState.firstName}
        initialData={initialFormState}
        isLoading={isLoading}
      />
    </Flex>
  );
};

export default Profile;
