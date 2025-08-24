import { Portal, Select, createListCollection } from "@chakra-ui/react";

import { type UserState } from "./reducer";

const RoleDropdown = ({
  handleRoleChange,
  formState,
}: {
  handleRoleChange: (_value: string) => void;
  formState: UserState;
}) => {
  return (
    <Select.Root
      collection={frameworks}
      value={[formState?.role]}
      onValueChange={({ value }) => {
        handleRoleChange(value[0]);
      }}
      required
    >
      <Select.HiddenSelect />
      <Select.Label>Account role</Select.Label>
      <Select.Control>
        <Select.Trigger>
          <Select.ValueText placeholder="Select role" />
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
  );
};

export default RoleDropdown;

const frameworks = createListCollection({
  items: [{ label: "Administrator", value: "Administrator" }],
});
