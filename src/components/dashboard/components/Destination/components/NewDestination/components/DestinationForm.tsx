import { useEffect, useReducer } from "react";

import { Button, Field, Fieldset, Flex, Input, Stack } from "@chakra-ui/react";

import { MdKeyboardBackspace, MdOutlineSave } from "react-icons/md";

import { useLocation, useNavigate, useParams } from "react-router";

import PageHeader from "@/components/dashboard/wrapper/PageHeader";
import LoadingSpinner from "@/components/shared/Spinner";
import { toaster } from "@/components/ui/toaster";
import ClientRoutes from "@/constants/client-routes";
import { VIEW_CONFIG } from "@/constants/view-config";
import useCreateDestination from "@/queryOptions/destination/useCreateDestination";
import { useFetchDestinationById } from "@/queryOptions/destination/useFetchDestinationById";
import { useUpdateDestination } from "@/queryOptions/destination/useUpdateDestination";
import {
  type Destination,
  type NewDestinationFormState,
} from "@/types/destination";

import {
  BreadcrumbsForEditDestination,
  BreadcrumbsForNewDestination,
} from "./helper";
import { initialState, newDestinationFormReducer } from "./reducer";

const DestinationForm = ({ mode }: { mode: "edit" | "add" }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams<{ destinationId: string }>();
  const { destinationId, destinationName } = location.state || {};
  const { mutate: createDestination, isPending } = useCreateDestination();
  const { data: destinationData, isPending: isFetchDestinationByIdPending } =
    useFetchDestinationById(params.destinationId || "");
  const { mutate: updateDestination, isPending: isUpdateDestinationPending } =
    useUpdateDestination({
      id: params.destinationId || "",
    });

  // If the mode is edit, we need to pre-fill
  // the form with the existing destination data
  useEffect(() => {
    if (destinationData && mode === "edit") {
      dispatch({
        type: "SET_FORM",
        payload: {
          dst: destinationData.dst,
          destinationName: destinationData.name,
          accountName: destinationData.config_data.account,
          databaseName: destinationData.config_data.database,
          warehouseName: destinationData.config_data.warehouse,
          username: destinationData.config_data.username,
          password: destinationData.config_data.password,
        },
      });
    } else if (mode === "add") {
      // If the mode is add, we reset the form state
      dispatch({ type: "RESET_FORM" });
      // Set dst from location state if available
      if (destinationName) {
        dispatch({
          type: "UPDATE_FIELD",
          field: "dst",
          value: destinationName,
        });
      }
    }
  }, [destinationData, destinationName, mode]);

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
      dst: formState.dst,
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

    // If mode is edit, update the existing destination
    if (mode === "edit") {
      updateDestination(payload, {
        onSuccess: () => {
          toaster.success({
            title: "Destination updated successfully",
            description: `Your ${formState.destinationName} destination has been updated.`,
          });
        },
        onError: (error) => {
          toaster.error({
            title: "Error updating destination",
            description: error.message,
          });
        },
      });
      return;
    }

    // If mode is add, create a new destination
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

  if (mode === "edit" && isFetchDestinationByIdPending) {
    return <LoadingSpinner />;
  }

  return (
    <Flex direction="column" gap={VIEW_CONFIG.pageGap}>
      <PageHeader
        breadcrumbs={
          mode === "add"
            ? BreadcrumbsForNewDestination
            : BreadcrumbsForEditDestination
        }
        title={
          mode === "add"
            ? `Configure your ${formState.dst} destination`
            : `Edit your ${formState.dst} destination`
        }
        subtitle="Follow guide to setup your destination"
      />

      <Stack as="form" onSubmit={handleFormSubmit}>
        <Fieldset.Root size="lg" maxW="lg" position={"relative"}>
          {mode === "edit" && isFetchDestinationByIdPending && (
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
            <Button
              type="submit"
              colorPalette="brand"
              loading={isPending || isUpdateDestinationPending}
            >
              <MdOutlineSave />
              {mode === "edit" ? "Save changes" : "Save & authorize"}
            </Button>
          </Flex>
        </Fieldset.Root>
      </Stack>
    </Flex>
  );
};

export default DestinationForm;
