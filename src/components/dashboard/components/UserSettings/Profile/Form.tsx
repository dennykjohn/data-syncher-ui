import { useEffect, useState } from "react";

import { Button, Field, Fieldset, Input, Stack } from "@chakra-ui/react";

import { format, parseISO } from "date-fns";

import LoadingSpinner from "@/components/shared/Spinner";
import { toaster } from "@/components/ui/toaster";
import useFetchCurrentUserProfile from "@/queryOptions/user/useFetchCurrentUserProfile";
import { useUpdateCurrentUserProfile } from "@/queryOptions/user/useUpdateCurrentUserProfile";
import { type UpdateCurrentUserPayload } from "@/types/user";

import { type FormState, initialState } from "./helper";

const ProfileForm = () => {
  const [form, setForm] = useState<FormState>(initialState);
  const [errors, setErrors] = useState<
    Partial<Record<keyof FormState, string>>
  >({});
  const { data: userProfile, isLoading } = useFetchCurrentUserProfile();
  const { mutate: updateProfile, isPending } = useUpdateCurrentUserProfile();

  useEffect(() => {
    if (userProfile) {
      const regex = /(\.\d{3})\d+Z$/;
      const cleanedStartDate = parseISO(
        userProfile.company?.start_date.replace(regex, "$1Z"),
      );
      const cleanedEndDate = parseISO(
        userProfile.company?.end_date.replace(regex, "$1Z"),
      );
      setForm((prev) => ({
        ...prev,
        firstName: userProfile.first_name,
        lastName: userProfile.last_name,
        email: userProfile.email,
        cmp_name: userProfile.company?.cmp_name,
        start_date: format(cleanedStartDate, "yyyy-MM-dd"),
        end_date: format(cleanedEndDate, "yyyy-MM-dd"),
      }));
    }
  }, [userProfile]);

  const onChange = (key: keyof FormState) => (value: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const payload: UpdateCurrentUserPayload = {
      first_name: form.firstName,
      last_name: form.lastName,
      ...form,
    };
    updateProfile(payload, {
      onSuccess: () => {
        toaster.success({
          title: "Profile updated successfully",
          description: `Your profile has been updated.`,
        });
      },
    });
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <Stack
      as="form"
      gap={4}
      onSubmit={onSubmit}
      maxW={{ base: "100%", md: "500px" }}
    >
      <Fieldset.Root size="md" gap={4}>
        <Fieldset.Content>
          {/* First name */}
          <Field.Root required invalid={!!errors.firstName}>
            <Field.Label>First name</Field.Label>
            <Input
              placeholder="Enter your first name"
              value={form.firstName}
              onChange={(ev) => onChange("firstName")(ev.target.value)}
            />
            <Field.ErrorText>{errors.firstName}</Field.ErrorText>
          </Field.Root>
          {/* Last name */}
          <Field.Root required invalid={!!errors.lastName}>
            <Field.Label>Last name</Field.Label>
            <Input
              placeholder="Enter your last name"
              value={form.lastName}
              onChange={(ev) => onChange("lastName")(ev.target.value)}
            />
            <Field.ErrorText>{errors.lastName}</Field.ErrorText>
          </Field.Root>
          {/* Email */}
          <Field.Root required invalid={!!errors.email}>
            <Field.Label>Email</Field.Label>
            <Input
              placeholder="Enter your email"
              value={form.email}
              onChange={(ev) => onChange("email")(ev.target.value)}
            />
            <Field.ErrorText>{errors.email}</Field.ErrorText>
          </Field.Root>
          {/* Company name */}
          <Field.Root required invalid={!!errors.cmp_name}>
            <Field.Label>Company name</Field.Label>
            <Input
              placeholder="Enter your company name"
              value={form.cmp_name}
              onChange={(ev) => onChange("cmp_name")(ev.target.value)}
            />
            <Field.ErrorText>{errors.cmp_name}</Field.ErrorText>
          </Field.Root>
          {/* Start date */}
          <Field.Root required invalid={!!errors.start_date}>
            <Field.Label>Start date</Field.Label>
            <Input
              type="date"
              placeholder="Enter your start date"
              value={form.start_date}
              onChange={(ev) => onChange("start_date")(ev.target.value)}
            />
            <Field.ErrorText>{errors.start_date}</Field.ErrorText>
          </Field.Root>
          {/* End date */}
          <Field.Root required invalid={!!errors.end_date}>
            <Field.Label>End date</Field.Label>
            <Input
              type="date"
              placeholder="Enter your end date"
              value={form.end_date}
              onChange={(ev) => onChange("end_date")(ev.target.value)}
            />
            <Field.ErrorText>{errors.end_date}</Field.ErrorText>
          </Field.Root>
        </Fieldset.Content>
      </Fieldset.Root>
      <Button
        type="submit"
        colorPalette="brand"
        size="md"
        alignSelf="flex-end"
        mt={2}
        loading={isLoading || isPending}
      >
        Update profile
      </Button>
    </Stack>
  );
};

export default ProfileForm;
