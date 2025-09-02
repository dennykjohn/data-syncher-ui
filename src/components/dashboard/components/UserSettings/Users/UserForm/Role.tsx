import { Portal, Select, createListCollection } from "@chakra-ui/react";

import useFetchUserRoleList from "@/queryOptions/user/useFetchUserRoleList";

import { type UserState } from "./reducer";

const RoleDropdown = ({
  handleRoleChange,
  formState,
}: {
  handleRoleChange: (_value: string) => void;
  formState: UserState;
}) => {
  const { data: userRoles } = useFetchUserRoleList();
  const roleItems =
    userRoles?.map((role) => ({
      label: role.role_name,
      value: role.role_name,
    })) ?? [];

  const frameworks = createListCollection({
    items: roleItems,
  });

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
