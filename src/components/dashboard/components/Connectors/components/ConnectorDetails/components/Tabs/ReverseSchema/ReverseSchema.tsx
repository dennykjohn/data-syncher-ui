import { Flex, Grid } from "@chakra-ui/react";

import Destination from "./components/Destination/Destination";
import Mapped from "./components/Mapped/Mapped";
import Source from "./components/Source/Source";

const ReverseSchema = () => {
  return (
    <Flex w="100%" direction="column" gap={4}>
      <Grid templateColumns={["1fr", "repeat(3, 1fr)"]} gap={4} width="100%">
        <Source />
        <Destination />
        <Mapped />
      </Grid>
    </Flex>
  );
};

export default ReverseSchema;
