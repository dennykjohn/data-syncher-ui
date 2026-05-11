import { useEffect, useRef, useState } from "react";

import {
  Button,
  Checkbox,
  Field,
  Fieldset,
  Flex,
  Image,
  Input,
  Span,
  Stack,
  Text,
} from "@chakra-ui/react";

import { AxiosError } from "axios";
import { Link, useNavigate } from "react-router";

import Logo from "@/assets/logo.svg";
import { PasswordInput } from "@/components/ui/password-input";
import ClientRoutes from "@/constants/client-routes";
import ServerRoutes from "@/constants/server-routes";
import useAuth from "@/context/Auth/useAuth";
import AxiosInstance from "@/lib/axios/api-client";
import { type LoginResponse } from "@/types/auth";

export default function Form() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const passwordRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState(
    "Invalid Username or Password",
  );
  const [email, setEmail] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    const rememberedEmail = localStorage.getItem("remembered_email");
    if (rememberedEmail) {
      setEmail(rememberedEmail);
      setRememberMe(true);
    }
  }, []);

  useEffect(() => {
    if (passwordRef.current) {
      passwordRef.current.value = "";
    }
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // Handle form submission logic here
    const formData = new FormData(event.currentTarget);
    const emailValue = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (!emailValue || !password) {
      setHasError(true);
      return;
    }

    if (rememberMe) {
      localStorage.setItem("remembered_email", emailValue);
    } else {
      localStorage.removeItem("remembered_email");
    }

    const data = {
      username: emailValue,
      password: password,
    };
    try {
      setIsLoading(true);
      setHasError(false);
      setUnverifiedEmail(null);
      const { data: respData }: { data: LoginResponse } = await AxiosInstance({
        method: "POST",
        url: ServerRoutes.auth.login(),
        data,
      });
      await login(respData);
      navigate(ClientRoutes.DASHBOARD, { replace: true });
    } catch (err) {
      const error = err as AxiosError<{ error?: string }>;
      setIsLoading(false);
      if (error.response?.status === 403) {
        setUnverifiedEmail(data.username);
        setErrorMessage(
          error.response.data?.error ||
            "Please verify your email before logging in.",
        );
      } else {
        setHasError(true);
        setErrorMessage("Invalid Username or Password");
        if (passwordRef.current) {
          passwordRef.current.value = "";
          passwordRef.current.focus();
        }
      }
    }
  };

  const handleResendOtp = async () => {
    if (!unverifiedEmail) return;
    try {
      setIsLoading(true);
      await AxiosInstance.post(ServerRoutes.auth.resendOtp(), {
        email: unverifiedEmail,
      });
      navigate(`${ClientRoutes.AUTH}/${ClientRoutes.VERIFY_EMAIL}`, {
        state: { email: unverifiedEmail },
      });
    } catch (err) {
      const error = err as AxiosError<{ error?: string }>;
      setHasError(true);
      setErrorMessage(error.response?.data?.error || "Failed to resend OTP.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form style={{ width: "100%" }} onSubmit={handleSubmit} autoComplete="off">
      <Flex justifyContent="center" alignItems="center">
        <Fieldset.Root
          size="lg"
          w="100%"
          justifyContent="center"
          invalid={hasError || !!unverifiedEmail}
        >
          <Stack gap={4} mb={2}>
            <Image
              src={Logo}
              alt="Logo"
              width="48px"
              height="48px"
              aspectRatio={1}
            />
            <Fieldset.Legend fontSize={32} fontWeight="semibold">
              Sign in
            </Fieldset.Legend>
            <Text fontSize="sm" color="gray.500">
              Don't have an account?{" "}
              <Span
                color="brand.500"
                cursor="pointer"
                onClick={() =>
                  navigate(`${ClientRoutes.AUTH}/${ClientRoutes.REGISTER}`)
                }
              >
                Sign up
              </Span>
            </Text>
          </Stack>
          <Fieldset.Content>
            <Field.Root required>
              <Field.Label fontSize="16px">
                Email Id <Field.RequiredIndicator />
              </Field.Label>
              <Input
                name="email"
                type="email"
                placeholder="Enter your email id"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Field.Root>
            <Field.Root required>
              <Field.Label fontSize="16px">
                Password <Field.RequiredIndicator />
              </Field.Label>
              <PasswordInput
                name="password"
                placeholder="Enter your password"
                ref={passwordRef}
              />
            </Field.Root>
          </Fieldset.Content>
          <Fieldset.ErrorText>{errorMessage}</Fieldset.ErrorText>

          {unverifiedEmail && (
            <Button
              variant="outline"
              colorPalette="brand"
              size="sm"
              mt={2}
              onClick={handleResendOtp}
              loading={isLoading}
            >
              Resend OTP & Verify
            </Button>
          )}
          <Flex justifyContent="space-between" alignItems="center" mb={2}>
            <Checkbox.Root
              colorPalette="brand"
              size="md"
              checked={rememberMe}
              onCheckedChange={(e) => setRememberMe(!!e.checked)}
            >
              <Checkbox.HiddenInput name="rememberMe" />
              <Checkbox.Control />
              <Checkbox.Label>Remember me</Checkbox.Label>
            </Checkbox.Root>
            <Link to={`${ClientRoutes.AUTH}/${ClientRoutes.FORGOT_PASSWORD}`}>
              <Span color="brand.500" fontSize="14px">
                Forgot password ?
              </Span>
            </Link>
          </Flex>
          <Button
            type="submit"
            alignSelf="center"
            colorPalette="brand"
            w="70%"
            loading={isLoading}
          >
            Submit
          </Button>
        </Fieldset.Root>
      </Flex>
    </form>
  );
}
