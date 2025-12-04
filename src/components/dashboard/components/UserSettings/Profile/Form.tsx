import { Field, Fieldset, Input, Stack } from "@chakra-ui/react";

import LoadingSpinner from "@/components/shared/Spinner";

import { type FormState } from "./helper";

const ProfileForm = ({
  initialData,
  isLoading,
}: {
  initialData: FormState;
  isLoading: boolean;
}) => {
  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <Stack gap={4} maxW={{ base: "100%", md: "500px" }}>
      <Fieldset.Root size="md" gap={4}>
        <Fieldset.Content>
          {/* First name */}
          <Field.Root required>
            <Field.Label>First name</Field.Label>
            <Input
              placeholder="Enter your first name"
              value={initialData.firstName}
              readOnly
              color="gray.500"
            />
          </Field.Root>
          {/* Last name */}
          <Field.Root required>
            <Field.Label>Last name</Field.Label>
            <Input
              placeholder="Enter your last name"
              value={initialData.lastName}
              readOnly
              color="gray.500"
            />
          </Field.Root>
          {/* Email */}
          <Field.Root required>
            <Field.Label>Email</Field.Label>
            <Input
              placeholder="Enter your email"
              value={initialData.company_email}
              readOnly
              color="gray.500"
            />
          </Field.Root>
          {/* Company name */}
          <Field.Root required>
            <Field.Label>Company name</Field.Label>
            <Input
              placeholder="Enter your company name"
              value={initialData.cmp_name}
              readOnly
              color="gray.500"
            />
          </Field.Root>
          {/* Start date */}
          <Field.Root required>
            <Field.Label>Start date</Field.Label>
            <Input
              type="date"
              placeholder="Enter your start date"
              value={initialData.start_date}
              readOnly
              color="gray.500"
            />
          </Field.Root>
          {/* End date */}
          <Field.Root required>
            <Field.Label>End date</Field.Label>
            <Input
              type="date"
              placeholder="Enter your end date"
              value={initialData.end_date}
              readOnly
              color="gray.500"
            />
          </Field.Root>
        </Fieldset.Content>
      </Fieldset.Root>
    </Stack>
  );
};

export default ProfileForm;
