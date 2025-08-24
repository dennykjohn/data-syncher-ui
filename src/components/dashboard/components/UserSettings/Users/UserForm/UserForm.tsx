import { useReducer, useState } from "react";

import { Button, Field, Fieldset, Flex, Input, Stack } from "@chakra-ui/react";

import PageHeader from "@/components/dashboard/wrapper/PageHeader";
import { PasswordInput } from "@/components/ui/password-input";
import passwordPolicy from "@/config/password-policy";

import RoleDropdown from "./Role";
import { BreadcrumbsForEditUser, BreadcrumbsForNewUser } from "./helper";
import { type UserState, initialState, userReducer } from "./reducer";

const UserForm = ({ mode }: { mode: "edit" | "add" }) => {
  const [formState, dispatch] = useReducer(userReducer, initialState);
  const [error, setError] = useState<{
    message: string;
    field: keyof UserState;
  } | null>(null);

  // Validate password policy on blur
  const handlePasswordBlur = ({ field }: { field: keyof UserState }) => {
    if (!passwordPolicy.passwordRegex.test(formState[field])) {
      setError({
        message: passwordPolicy.passwordPolicyErrorMessage,
        field: field,
      });
    } else if (error?.field === field) {
      setError(null);
    }
  };

  const handleInputChange =
    (field: keyof UserState) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      dispatch({ type: "UPDATE_FIELD", field, value: event.target.value });
    };

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    // Password match check
    if (formState.password !== formState.confirmPassword) {
      setError({ message: "Passwords do not match", field: "confirmPassword" });
      return;
    }
    if (!passwordPolicy.passwordRegex.test(formState.password)) {
      setError({
        message: passwordPolicy.passwordPolicyErrorMessage,
        field: "password",
      });
      return;
    }
    setError(null);
    // Handle form submission
    console.log("Form submitted:", formState);
  };

  const handleRoleChange = (value: string) => {
    dispatch({ type: "UPDATE_FIELD", field: "role", value });
  };

  return (
    <Flex flexDirection="column" gap={8}>
      <PageHeader
        breadcrumbs={
          mode === "add" ? BreadcrumbsForNewUser : BreadcrumbsForEditUser
        }
        title={mode === "add" ? `Add member` : `Edit member detail`}
      />
      <Stack
        as="form"
        gap={4}
        onSubmit={onSubmit}
        maxW={{ base: "100%", md: "500px" }}
      >
        <Fieldset.Root size="md" gap={4}>
          <Fieldset.Content>
            {/** Company email */}
            <Field.Root required>
              <Field.Label>
                Company email <Field.RequiredIndicator />
              </Field.Label>
              <Input
                type="email"
                placeholder="Enter your company email"
                value={formState.companyEmail}
                onChange={handleInputChange("companyEmail")}
              />
            </Field.Root>
            {/** First Name */}
            <Field.Root required>
              <Field.Label>
                First Name <Field.RequiredIndicator />
              </Field.Label>
              <Input
                type="text"
                placeholder="Enter your first name"
                value={formState.firstName}
                onChange={handleInputChange("firstName")}
              />
            </Field.Root>
            {/** Last Name */}
            <Field.Root required>
              <Field.Label>
                Last Name <Field.RequiredIndicator />
              </Field.Label>
              <Input
                type="text"
                placeholder="Enter your last name"
                value={formState.lastName}
                onChange={handleInputChange("lastName")}
              />
            </Field.Root>
            {/** Password */}
            <Field.Root required invalid={error?.field === "password"}>
              <Field.Label>
                Password <Field.RequiredIndicator />
              </Field.Label>
              <PasswordInput
                placeholder="Enter your password"
                value={formState.password}
                onChange={handleInputChange("password")}
                onBlur={() => handlePasswordBlur({ field: "password" })}
              />
              <Field.ErrorText>{error?.message}</Field.ErrorText>
            </Field.Root>
            {/** Confirm Password */}
            <Field.Root required invalid={error?.field === "confirmPassword"}>
              <Field.Label>
                Confirm Password <Field.RequiredIndicator />
              </Field.Label>
              <PasswordInput
                placeholder="Confirm your password"
                value={formState.confirmPassword}
                onChange={handleInputChange("confirmPassword")}
                onBlur={() => handlePasswordBlur({ field: "password" })}
              />
              <Field.ErrorText>{error?.message}</Field.ErrorText>
            </Field.Root>
            <RoleDropdown
              handleRoleChange={handleRoleChange}
              formState={formState}
            />
          </Fieldset.Content>
        </Fieldset.Root>
        <Button type="submit" colorPalette="brand" alignSelf="flex-end" mt={2}>
          {mode === "add" ? "Add Member" : "Update"}
        </Button>
      </Stack>
    </Flex>
  );
};

export default UserForm;
