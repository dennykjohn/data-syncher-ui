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

  useEffect(() => {
    if (passwordRef.current) {
      passwordRef.current.value = "";
    }
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // Handle form submission logic here
    const formData = new FormData(event.currentTarget);
    const data = {
      username: formData.get("email") as string,
      password: formData.get("password") as string,
    };
    if (!data.username || !data.password) {
      setHasError(true);
      return;
    }
    try {
      setIsLoading(true);
      setHasError(false);
      const { data: respData }: { data: LoginResponse } = await AxiosInstance({
        method: "POST",
        url: ServerRoutes.auth.login(),
        data,
      });
      await login(respData);
      navigate(ClientRoutes.DASHBOARD, { replace: true });
    } catch {
      setHasError(true);
      setIsLoading(false);
      if (passwordRef.current) {
        passwordRef.current.value = "";
        passwordRef.current.focus();
      }
    }
  };

  return (
    <form style={{ width: "100%" }} onSubmit={handleSubmit} autoComplete="off">
      <Flex justifyContent="center" alignItems="center">
        <Fieldset.Root
          size="lg"
          w="100%"
          justifyContent="center"
          invalid={hasError}
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
                autoComplete="off"
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
                autoComplete="new-password"
              />
            </Field.Root>
          </Fieldset.Content>
          <Fieldset.ErrorText>Invalid Username or Password</Fieldset.ErrorText>
          <Flex justifyContent="space-between" alignItems="center" mb={2}>
            <Checkbox.Root colorPalette="brand" size="md">
              <Checkbox.HiddenInput />
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
