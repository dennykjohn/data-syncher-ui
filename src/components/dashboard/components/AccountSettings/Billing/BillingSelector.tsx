import { Flex, Portal, Select, createListCollection } from "@chakra-ui/react";

const BillingSelector = ({
  selectedRange,
  setSelectedRange,
}: {
  selectedRange: string[];
  setSelectedRange: (_range: string[]) => void;
}) => {
  return (
    <Flex justifyContent={"flex-end"}>
      <Select.Root
        collection={frameworks}
        size="sm"
        width="300px"
        textAlign={"right"}
        value={selectedRange}
        onValueChange={(e) => setSelectedRange(e.value)}
      >
        <Select.HiddenSelect />
        <Select.Control>
          <Select.Trigger>
            <Select.ValueText placeholder="Select" />
          </Select.Trigger>
          <Select.IndicatorGroup>
            <Select.Indicator />
          </Select.IndicatorGroup>
        </Select.Control>
        <Portal>
          <Select.Positioner>
            <Select.Content>
              {frameworks.items.map((framework) => (
                <Select.Item item={framework} key={framework.value}>
                  {framework.label}
                  <Select.ItemIndicator />
                </Select.Item>
              ))}
            </Select.Content>
          </Select.Positioner>
        </Portal>
      </Select.Root>
    </Flex>
  );
};

const frameworks = createListCollection({
  items: [
    { label: "Last 30 days", value: "current-month" },
    { label: "Last year", value: "last-year" },
  ],
});

export default BillingSelector;
