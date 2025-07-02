import { useRef, useState } from "react";

import {
  Button,
  Checkbox,
  Field,
  Fieldset,
  Flex,
  Image,
  Input,
  Separator,
  Span,
  Stack,
  Text,
} from "@chakra-ui/react";

import { Link } from "react-router";

import GoogleLogo from "@/assets/google-logo.svg";
import Logo from "@/assets/logo.svg";
import { PasswordInput } from "@/components/ui/password-input";
import ClientRoutes from "@/constants/client-routes";
import ServerRoutes from "@/constants/server-routes";
import useAuth from "@/context/Auth/useAuth";
import AxiosInstance from "@/lib/axios/api-client";
import { type LoginResponse } from "@/types/auth";

export default function Form() {
  const { login } = useAuth();

  const passwordRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

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
      login(respData);
    } catch {
      setHasError(true);
      if (passwordRef.current) {
        passwordRef.current.value = "";
        passwordRef.current.focus();
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form style={{ width: "100%" }} onSubmit={handleSubmit}>
      <Flex
        justifyContent="center"
        alignItems="center"
        p={{ base: 6, md: 0 }}
        w={{ base: "100%", md: "70%" }}
        margin={{ base: "auto", md: "0 auto" }}
        h="100%"
      >
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
            <Fieldset.Legend fontSize={32} fontWeight="bold">
              Sign in
            </Fieldset.Legend>
            <Text fontSize="sm" color="gray.500">
              Don't have an account?{" "}
              <Span color="brand.500" cursor="pointer">
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
          <Fieldset.ErrorText>Invalid Username or Password</Fieldset.ErrorText>
          <Flex justifyContent="space-between" alignItems="center" mb={2}>
            <Checkbox.Root colorPalette="brand" size="md">
              <Checkbox.HiddenInput />
              <Checkbox.Control />
              <Checkbox.Label>Remember me</Checkbox.Label>
            </Checkbox.Root>
            <Link to={ClientRoutes.REGISTER}>
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
          <Separator />
          <Button variant="outline" alignSelf="center" w="70%">
            <Image
              src={GoogleLogo}
              alt="Google Logo"
              width="24px"
              height="24px"
              mr={2}
            />
            Sign in with Google
          </Button>
        </Fieldset.Root>
      </Flex>
    </form>
  );
}
