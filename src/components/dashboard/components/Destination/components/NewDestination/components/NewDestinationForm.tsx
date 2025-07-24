import { useReducer } from "react";

import { Button, Field, Fieldset, Flex, Input } from "@chakra-ui/react";

import { MdKeyboardBackspace, MdOutlineSave } from "react-icons/md";

import { useNavigate } from "react-router";

import PageHeader from "@/components/dashboard/wrapper/PageHeader";
import ClientRoutes from "@/constants/client-routes";
import { VIEW_CONFIG } from "@/constants/view-config";
import { type NewDestinationFormState } from "@/types/destination";

import { initialState, newDestinationFormReducer } from "./reducer";

const NewDestinationForm = () => {
  const navigate = useNavigate();
  const [formState, dispatch] = useReducer(
    newDestinationFormReducer,
    initialState,
  );

  const handleInputChange = (
    field: keyof NewDestinationFormState,
    value: string,
  ) => {
    dispatch({ type: "UPDATE_FIELD", field, value });
  };

  const handleFormSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    // console.log("Form submitted with data:", formState);
  };

  return (
    <Flex direction="column" gap={VIEW_CONFIG.pageGap}>
      <PageHeader
        breadcrumbs={[
          {
            label: "Destinations",
            route: `${ClientRoutes.DASHBOARD}/${ClientRoutes.DESTINATION.ROOT}`,
          },
          {
            label: "Add destination",
            route: `${ClientRoutes.DASHBOARD}/${ClientRoutes.DESTINATION.ROOT}/${ClientRoutes.DESTINATION.ADD}`,
          },
          { label: "Configure" },
        ]}
        title="Configure your Snowflake destination"
        subtitle="Follow guide to setup your destination"
      />

      <form onSubmit={handleFormSubmit}>
        <Fieldset.Root size="lg" maxW="lg">
          <Fieldset.Content>
            <Field.Root required>
              <Field.Label>
                Destination name <Field.RequiredIndicator />
              </Field.Label>
              <Input
                placeholder="Enter your destination name"
                value={formState.destinationName}
                onChange={(e) =>
                  handleInputChange("destinationName", e.target.value)
                }
              />
              <Field.HelperText>
                A unique name for your destination
              </Field.HelperText>
            </Field.Root>
            <Field.Root required>
              <Field.Label>
                Account name <Field.RequiredIndicator />
              </Field.Label>
              <Input
                placeholder="Enter your account name"
                value={formState.accountName}
                onChange={(e) =>
                  handleInputChange("accountName", e.target.value)
                }
              />
            </Field.Root>
            <Field.Root required>
              <Field.Label>
                Database name <Field.RequiredIndicator />
              </Field.Label>
              <Input
                placeholder="Enter your database name"
                value={formState.databaseName}
                onChange={(e) =>
                  handleInputChange("databaseName", e.target.value)
                }
              />
            </Field.Root>
            <Field.Root required>
              <Field.Label>
                Warehouse name
                <Field.RequiredIndicator />
              </Field.Label>
              <Input
                placeholder="Enter your warehouse name"
                value={formState.warehouseName}
                onChange={(e) =>
                  handleInputChange("warehouseName", e.target.value)
                }
              />
            </Field.Root>
            <Field.Root required>
              <Field.Label>
                Username
                <Field.RequiredIndicator />
              </Field.Label>
              <Input
                placeholder="Enter your username"
                value={formState.username}
                onChange={(e) => handleInputChange("username", e.target.value)}
              />
            </Field.Root>
            <Field.Root required>
              <Field.Label>
                Password
                <Field.RequiredIndicator />
              </Field.Label>
              <Input
                placeholder="Enter your password"
                value={formState.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
              />
            </Field.Root>
          </Fieldset.Content>
          <Flex justifyContent={"space-between"} mt={8}>
            <Button
              type="button"
              onClick={() => navigate(-1)}
              variant={"outline"}
            >
              <MdKeyboardBackspace />
              Back
            </Button>
            <Button type="submit" colorPalette="brand">
              <MdOutlineSave />
              Save & authorize
            </Button>
          </Flex>
        </Fieldset.Root>
      </form>
    </Flex>
  );
};

export default NewDestinationForm;
