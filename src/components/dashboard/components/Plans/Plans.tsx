import { Flex, Grid, Text } from "@chakra-ui/react";

import PageHeader from "../../wrapper/PageHeader";
import Card from "./Card";
import PlanTable from "./Table";
import { CardData } from "./tableData";

const Plans = () => {
  return (
    <Flex flexDirection="column" height="100%" gap={8}>
      <PageHeader
        breadcrumbs={[
          {
            label: "Plans",
            route: "",
          },
        ]}
        title="Plans"
      />
      <Flex alignItems="center" flexDirection="column" gap={4}>
        <Text fontSize="2xl" fontWeight="bold">
          Pay as per your usage
        </Text>
        <Text textAlign="center" maxWidth={{ base: "90%", md: "60%" }}>
          DataSyncher offers both pay-as-you-go and contractual pricing options.
          Contractual pricing provides a 20% reduction in annual charges.
          Additionally, the higher the data transfer volume, the lower the cost
          per unit.
        </Text>
      </Flex>
      <Grid gridTemplateColumns="repeat(3, 1fr)" gap={4}>
        {CardData.map((card) => (
          <Card key={card.id} {...card} />
        ))}
      </Grid>
      <PlanTable />
    </Flex>
  );
};

export default Plans;
