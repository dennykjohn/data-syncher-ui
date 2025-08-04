import { useEffect, useReducer } from "react";

import { Button, Field, Fieldset, Flex, Input } from "@chakra-ui/react";

import { MdKeyboardBackspace, MdOutlineSave } from "react-icons/md";

import { useLocation, useNavigate, useParams } from "react-router";

import PageHeader from "@/components/dashboard/wrapper/PageHeader";
import LoadingSpinner from "@/components/shared/Spinner";
import { toaster } from "@/components/ui/toaster";
import ClientRoutes from "@/constants/client-routes";
import { VIEW_CONFIG } from "@/constants/view-config";
import useCreateDestination from "@/queryOptions/destination/useCreateDestination";
import { useFetchDestinationById } from "@/queryOptions/destination/useFetchDestinationById";
import {
  type Destination,
  type NewDestinationFormState,
} from "@/types/destination";

import { initialState, newDestinationFormReducer } from "./reducer";

const DestinationForm = ({ mode }: { mode: "edit" | "add" }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams<{ destinationId: string }>();
  const { destinationId, destinationName } = location.state || {};
  const { mutate: createDestination, isPending } = useCreateDestination();
  const { data: destinationData, isPending: isFetchDestinationByIdPending } =
    useFetchDestinationById(params.destinationId || "");

  // If the mode is edit, we need to pre-fill
  // the form with the existing destination data
  useEffect(() => {
    if (destinationData && mode === "edit") {
      dispatch({
        type: "SET_FORM",
        payload: {
          destinationName: destinationData.name,
          accountName: destinationData.config_data.account,
          databaseName: destinationData.config_data.database,
          warehouseName: destinationData.config_data.warehouse,
          username: destinationData.config_data.username,
          password: destinationData.config_data.password,
        },
      });
    }
  }, [destinationData, mode]);

  useEffect(() => {
    // If the user navigates directly to this form
    // without choosing a destination on Add Destination, redirect
    // them back to the Add Destination page.
    if (mode === "add" && (!destinationId || !destinationName)) {
      navigate(
        `${ClientRoutes.DASHBOARD}/${ClientRoutes.DESTINATION.ROOT}/${ClientRoutes.DESTINATION.ADD}`,
        { replace: true },
      );
    }
  }, [destinationId, destinationName, mode, navigate]);

  const [formState, dispatch] = useReducer(
    newDestinationFormReducer,
    initialState,
  );

  const handleInputChange =
    (field: keyof NewDestinationFormState) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      dispatch({ type: "UPDATE_FIELD", field, value: event.target.value });
    };

  const handleFormSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    const payload: Destination = {
      dst: destinationName,
      name: formState.destinationName,
      config_data: {
        account: formState.accountName,
        database: formState.databaseName,
        warehouse: formState.warehouseName,
        username: formState.username,
        password: formState.password,
      },
    };

    if (
      !payload.dst ||
      !payload.name ||
      !payload.config_data.account ||
      !payload.config_data.database ||
      !payload.config_data.warehouse ||
      !payload.config_data.username ||
      !payload.config_data.password
    ) {
      toaster.error({
        title: "Error",
        description: "All fields are required.",
      });
      return;
    }

    createDestination(payload, {
      onSuccess: () => {
        toaster.success({
          title: "Destination created successfully",
          description: `Your ${destinationName} destination has been created.`,
        });
        navigate(`${ClientRoutes.DASHBOARD}/${ClientRoutes.DESTINATION.ROOT}`);
      },
      onError: (error) => {
        toaster.error({
          title: "Error creating destination",
          description: error.message,
        });
      },
    });
  };

  return (
    <Flex direction="column" gap={VIEW_CONFIG.pageGap}>
      <PageHeader
        breadcrumbs={[
          {
            label: "Destinations",
            route: `${ClientRoutes.DASHBOARD}/${ClientRoutes.DESTINATION.ROOT}`,
          },
          ...(mode === "add"
            ? [
                {
                  label: "Add destination",
                  route: `${ClientRoutes.DASHBOARD}/${ClientRoutes.DESTINATION.ROOT}/${ClientRoutes.DESTINATION.ADD}`,
                },
              ]
            : []),
          { label: "Configure" },
        ]}
        title={`Configure your ${destinationName} destination`}
        subtitle="Follow guide to setup your destination"
      />

      <form onSubmit={handleFormSubmit}>
        <Fieldset.Root size="lg" maxW="lg" position={"relative"}>
          {isFetchDestinationByIdPending && (
            <LoadingSpinner
              position="absolute"
              top={0}
              left={0}
              right={0}
              bottom={0}
              zIndex={1000}
            />
          )}
          <Fieldset.Content>
            <Field.Root required>
              <Field.Label>
                Destination name <Field.RequiredIndicator />
              </Field.Label>
              <Input
                placeholder="Enter your destination name"
                value={formState.destinationName}
                onChange={handleInputChange("destinationName")}
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
                onChange={handleInputChange("accountName")}
              />
            </Field.Root>
            <Field.Root required>
              <Field.Label>
                Database name <Field.RequiredIndicator />
              </Field.Label>
              <Input
                placeholder="Enter your database name"
                value={formState.databaseName}
                onChange={handleInputChange("databaseName")}
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
                onChange={handleInputChange("warehouseName")}
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
                onChange={handleInputChange("username")}
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
                onChange={handleInputChange("password")}
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
            <Button type="submit" colorPalette="brand" loading={isPending}>
              <MdOutlineSave />
              Save & authorize
            </Button>
          </Flex>
        </Fieldset.Root>
      </form>
    </Flex>
  );
};

export default DestinationForm;
