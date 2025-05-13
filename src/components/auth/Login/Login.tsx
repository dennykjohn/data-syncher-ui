import { Grid } from "@chakra-ui/react";

import Banner from "./components/Banner";
import Form from "./components/Form";

export default function Login() {
  return (
    <Grid templateColumns="1fr 1fr" height="100vh" w="100%">
      <Banner display={{ base: "none", md: "block" }} />
      <Form />
    </Grid>
  );
}
