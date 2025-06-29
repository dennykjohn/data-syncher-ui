import { Grid } from "@chakra-ui/react";

import Banner from "./components/Banner";
import Form from "./components/Form";

export default function Login() {
  return (
    <Grid
      templateColumns={{ base: "1fr", md: "1fr 1fr" }}
      height="100vh"
      w="100%"
    >
      <Banner />
      <Form />
    </Grid>
  );
}
