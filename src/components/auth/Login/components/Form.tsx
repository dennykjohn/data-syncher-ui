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

export default function Form() {
  return (
    <Flex justifyContent="center" alignItems="center" p={{ base: 6 }}>
      <Fieldset.Root size="lg" maxW={{ base: "lg", md: "md" }} w="100%">
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
            <Input name="email" type="text" placeholder="Enter your email id" />
          </Field.Root>
          <Field.Root required>
            <Field.Label fontSize="16px">
              Password <Field.RequiredIndicator />
            </Field.Label>
            <PasswordInput name="password" placeholder="Enter your password" />
          </Field.Root>
        </Fieldset.Content>
        <Flex justifyContent="space-between" alignItems="center" mb={2}>
          <Checkbox.Root>
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
        <Button type="submit" alignSelf="center" colorPalette="brand" w="70%">
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
  );
}
