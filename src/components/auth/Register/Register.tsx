import { useState } from "react";

import {
  Button,
  Checkbox,
  Field,
  Fieldset,
  Flex,
  Image,
  Input,
  InputGroup,
  Span,
  Stack,
  Text,
} from "@chakra-ui/react";

import { LuEye, LuEyeOff } from "react-icons/lu";

import { useNavigate } from "react-router";

import Logo from "@/assets/logo.svg";
import { toaster } from "@/components/ui/toaster";
import passwordPolicy from "@/config/password-policy";
import ClientRoutes from "@/constants/client-routes";
import ServerRoutes from "@/constants/server-routes";
import AxiosInstance from "@/lib/axios/api-client";

type FormState = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  company: string;
  terms: boolean;
};

const initialForm: FormState = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  company: "",
  terms: false,
};

const Register = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState>(initialForm);
  const [errors, setErrors] = useState<
    Partial<Record<keyof FormState, string>>
  >({});
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState<{ field: string; message: string } | null>(
    null,
  );

  const validate = () => {
    const e: Partial<Record<keyof FormState, string>> = {};

    if (!form.firstName.trim()) e.firstName = "First name is required";
    if (!form.lastName.trim()) e.lastName = "Last name is required";

    if (!form.email.trim()) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(form.email.trim()))
      e.email = "Enter a valid email";

    if (!form.password) e.password = "Password is required";
    else if (!passwordPolicy.passwordRegex.test(form.password))
      e.password = passwordPolicy.passwordPolicyErrorMessage;

    if (!form.company.trim()) e.company = "Company is required";
    if (!form.terms) e.terms = "You must accept the Terms and Privacy policy";

    return e;
  };

  const onChange = (key: keyof FormState) => (value: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));

    if (key === "password" && error?.field === "password") setError(null);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const eMap = validate();
    setErrors(eMap);
    if (Object.values(eMap).some(Boolean)) return;

    setSubmitting(true);
    const payload = {
      first_name: form.firstName,
      last_name: form.lastName,
      company_email: form.email,
      password: form.password,
      company_name: form.company,
      employee_range: "1-10",
    };

    try {
      await AxiosInstance.post(ServerRoutes.auth.register(), { ...payload });
      toaster.success({
        title: "Account created.",
        description: "You can now sign in.",
      });
      navigate(`${ClientRoutes.AUTH}/${ClientRoutes.LOGIN}`);
    } catch (err: unknown) {
      // Extract error message from backend response
      // The axios interceptor returns error.response?.data
      const error = err as {
        message?: string;
        error?: string;
        description?: string;
        non_field_errors?: string | string[];
        [key: string]: unknown;
      };

      // Handle non_field_errors (general validation errors)
      let errorMessage = "Registration failed";
      if (error?.non_field_errors) {
        const nonFieldErrors = Array.isArray(error.non_field_errors)
          ? error.non_field_errors[0]
          : error.non_field_errors;
        errorMessage = String(nonFieldErrors);

        // If it's a password-related non-field error, show it on the password field
        if (
          errorMessage.toLowerCase().includes("password") ||
          errorMessage.toLowerCase().includes("similar")
        ) {
          setError({ field: "password", message: errorMessage });
          setErrors((prev) => ({ ...prev, password: errorMessage }));
        }
      } else {
        errorMessage =
          error?.message || error?.error || error?.description || errorMessage;
      }

      // Check if there are field-specific errors
      const fieldErrors: Partial<Record<keyof FormState, string>> = {};

      // Common field error patterns from backend (could be arrays or strings)
      if (error?.email) {
        const emailError = Array.isArray(error.email)
          ? error.email[0]
          : error.email;
        fieldErrors.email = String(emailError);
      }
      if (error?.company_email) {
        const emailError = Array.isArray(error.company_email)
          ? error.company_email[0]
          : error.company_email;
        fieldErrors.email = String(emailError);
      }
      if (error?.password) {
        const passwordError = Array.isArray(error.password)
          ? error.password[0]
          : error.password;
        fieldErrors.password = String(passwordError);
        setError({ field: "password", message: String(passwordError) });
      }
      if (error?.first_name) {
        const firstNameError = Array.isArray(error.first_name)
          ? error.first_name[0]
          : error.first_name;
        fieldErrors.firstName = String(firstNameError);
      }
      if (error?.last_name) {
        const lastNameError = Array.isArray(error.last_name)
          ? error.last_name[0]
          : error.last_name;
        fieldErrors.lastName = String(lastNameError);
      }
      if (error?.company_name) {
        const companyError = Array.isArray(error.company_name)
          ? error.company_name[0]
          : error.company_name;
        fieldErrors.company = String(companyError);
      }

      // If there are field-specific errors, show them in the fields
      if (Object.keys(fieldErrors).length > 0) {
        setErrors((prev) => ({ ...prev, ...fieldErrors }));
      }

      // Show toast with error message
      toaster.error({
        title: "Registration failed",
        description: errorMessage,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Flex direction="column" w="100%" h="100%">
      <Stack as="form" gap={2} onSubmit={onSubmit}>
        <Fieldset.Root size="md" gap={2}>
          <Stack gap={4} mb={2}>
            <Image
              src={Logo}
              alt="Logo"
              width="48px"
              height="48px"
              aspectRatio={1}
            />
            <Fieldset.Legend fontSize={32} fontWeight="semibold">
              Sign Up
            </Fieldset.Legend>
            <Text fontSize="sm" color="gray.500">
              Already have an account?{" "}
              <Span
                color="brand.500"
                cursor="pointer"
                onClick={() =>
                  navigate(`${ClientRoutes.AUTH}/${ClientRoutes.LOGIN}`)
                }
              >
                Sign in
              </Span>
            </Text>
          </Stack>

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
            <Field.Label>Email address</Field.Label>
            <Input
              type="email"
              placeholder="Share your email address"
              value={form.email}
              onChange={(ev) => onChange("email")(ev.target.value)}
            />
            <Field.ErrorText>{errors.email}</Field.ErrorText>
          </Field.Root>

          {/* Password */}
          <Field.Root
            required
            invalid={!!errors.password || error?.field === "password"}
          >
            <Field.Label>Password</Field.Label>
            <InputGroup
              endElement={
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPassword((s) => !s)}
                >
                  {showPassword ? <LuEyeOff /> : <LuEye />}
                </Button>
              }
            >
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Enter password"
                value={form.password}
                onChange={(ev) => onChange("password")(ev.target.value)}
              />
            </InputGroup>
            <Field.ErrorText>
              {errors.password ||
                (error?.field === "password" ? error.message : "")}
            </Field.ErrorText>
          </Field.Root>

          {/* Company */}
          <Field.Root required invalid={!!errors.company}>
            <Field.Label>Company</Field.Label>
            <Input
              placeholder="Share your company name"
              value={form.company}
              onChange={(ev) => onChange("company")(ev.target.value)}
            />
            <Field.ErrorText>{errors.company}</Field.ErrorText>
          </Field.Root>

          {/* Terms */}
          <Flex justifyContent="space-between" alignItems="center" mb={2}>
            <Checkbox.Root
              colorPalette="brand"
              size="md"
              onCheckedChange={(e) => onChange("terms")(!!e.checked)}
            >
              <Checkbox.HiddenInput />
              <Checkbox.Control />
              <Checkbox.Label>
                I agree with Terms and Privacy policy
              </Checkbox.Label>
            </Checkbox.Root>
          </Flex>
        </Fieldset.Root>

        <Button
          type="submit"
          colorPalette="brand"
          size="lg"
          mt={2}
          loading={submitting}
          mb={4}
        >
          Create your account
        </Button>
      </Stack>
    </Flex>
  );
};

export default Register;
