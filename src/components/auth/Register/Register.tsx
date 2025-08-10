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
import ClientRoutes from "@/constants/client-routes";

type FormState = {
  fullName: string;
  email: string;
  password: string;
  company: string;
  terms: boolean;
};

const initialForm: FormState = {
  fullName: "",
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

  const validate = () => {
    const e: Partial<Record<keyof FormState, string>> = {};
    if (!form.fullName.trim()) e.fullName = "Full name is required";
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(form.email.trim()))
      e.email = "Enter a valid email";
    if (!form.password) e.password = "Password is required";
    else if (form.password.length < 8)
      e.password = "Password must be at least 8 characters";
    if (!form.company.trim()) e.company = "Company is required";
    if (!form.terms) e.terms = "You must accept the Terms and Privacy policy";
    return e;
  };

  const onChange = (key: keyof FormState) => (value: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const eMap = validate();
    setErrors(eMap);
    if (Object.values(eMap).some(Boolean)) return;

    setSubmitting(true);
    try {
      // await AxiosInstance.post(ServerRoutes.auth.register(), { ...form })
      toaster.success({
        title: "Account created.",
        description: "You can now sign in.",
      });
      navigate(`${ClientRoutes.AUTH}/${ClientRoutes.LOGIN}`);
    } catch {
      toaster.error({
        title: "Registration failed",
        description: "Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Flex minH="100vh" direction="column" w="100%">
      <Stack as="form" gap={5} onSubmit={onSubmit}>
        <Fieldset.Root size="md" gap={5}>
          <Stack gap={4} mb={2}>
            <Image
              src={Logo}
              alt="Logo"
              width="48px"
              height="48px"
              aspectRatio={1}
            />
            <Fieldset.Legend fontSize={32} fontWeight="bold">
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
          {/* Full name */}
          <Field.Root required invalid={!!errors.fullName}>
            <Field.Label>Full name</Field.Label>
            <Input
              placeholder="Enter your full name"
              value={form.fullName}
              onChange={(ev) => onChange("fullName")(ev.target.value)}
            />
            <Field.ErrorText>{errors.fullName}</Field.ErrorText>
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
          <Field.Root required invalid={!!errors.password}>
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
            <Field.ErrorText>{errors.password}</Field.ErrorText>
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
            <Checkbox.Root colorPalette="brand" size="md">
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
        >
          Create your account
        </Button>
      </Stack>
    </Flex>
  );
};

export default Register;
