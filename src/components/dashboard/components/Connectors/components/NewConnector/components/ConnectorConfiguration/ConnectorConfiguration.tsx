import { Button, Field, Fieldset, Flex, Input, Stack } from "@chakra-ui/react";

import { IoMdArrowBack } from "react-icons/io";

import PageHeader from "@/components/dashboard/wrapper/PageHeader";
import ClientRoutes from "@/constants/client-routes";
import { VIEW_CONFIG } from "@/constants/view-config";

import { type ConnectorFormState } from "../../type";

const ConnectorConfiguration = ({
  state,
  onConfigurationChange,
  handlePrevious,
}: {
  state: ConnectorFormState;
  onConfigurationChange: (_field: string, _value: string) => void;
  handlePrevious: () => void;
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
  };

  return (
    <Flex direction="column" gap={VIEW_CONFIG.pageGap}>
      <PageHeader
        breadcrumbs={[
          {
            label: "Connector",
            route: `${ClientRoutes.DASHBOARD}/${ClientRoutes.CONNECTORS.ROOT}`,
          },
          { label: "Configure" },
        ]}
        title="Enter authorization details"
        subtitle="Provide the necessary details to authorize the connector"
      />
      <Stack as="form" onSubmit={handleSubmit} gap={4}>
        <Fieldset.Root size="lg" maxW="lg">
          <Fieldset.Content>
            <Field.Root required>
              <Field.Label>
                Destination type and Name <Field.RequiredIndicator />
              </Field.Label>
              <Input
                placeholder="Enter your destination name"
                // value={state.destinationName}
                // onChange={onConfigurationChange("destinationName")}
              />
            </Field.Root>
          </Fieldset.Content>
          <Flex justifyContent="space-between">
            <Button
              alignSelf="center"
              variant="outline"
              onClick={handlePrevious}
            >
              <IoMdArrowBack />
              Back
            </Button>
            <Button type="submit" colorPalette="brand">
              Save & authorize
            </Button>
          </Flex>
        </Fieldset.Root>
      </Stack>
    </Flex>
  );
};
export default ConnectorConfiguration;
