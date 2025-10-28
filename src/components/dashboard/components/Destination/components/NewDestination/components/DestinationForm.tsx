import { useEffect, useReducer } from "react";

import { Flex } from "@chakra-ui/react";

import { useLocation, useNavigate, useParams } from "react-router";

import DynamicForm from "@/components/dashboard/helpers/DynamicForm";
import PageHeader from "@/components/dashboard/wrapper/PageHeader";
import LoadingSpinner from "@/components/shared/Spinner";
import { toaster } from "@/components/ui/toaster";
import ClientRoutes from "@/constants/client-routes";
import { VIEW_CONFIG } from "@/constants/view-config";
import useCreateDestination from "@/queryOptions/destination/useCreateDestination";
import { useFetchDestinationById } from "@/queryOptions/destination/useFetchDestinationById";
import { useUpdateDestination } from "@/queryOptions/destination/useUpdateDestination";
import useFetchFormSchema from "@/queryOptions/useFetchFormSchema";
import { type Destination } from "@/types/destination";

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

  const { data: formSchema, isLoading: isFormSchemaLoading } =
    useFetchFormSchema({
      type: destinationData?.dst || destinationName || "",
      source: "destinations",
    });

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

  const [formState] = useReducer(newDestinationFormReducer, initialState);

  const handleFormSubmit = (values: Record<string, string>) => {
    const payload: Destination = {
      dst: values["destination_name"],
      name: mode === "add" ? destinationName : destinationData?.dst,
      config_data: { ...values },
    };

    // If mode is edit, update the existing destination
    if (mode === "edit") {
      updateDestination(payload, {
        onSuccess: () => {
          toaster.success({
            title: "Destination updated successfully",
            description: `Your ${formState.destinationName} destination has been updated.`,
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
    });
  };

  if (mode === "edit" && isFetchDestinationByIdPending) {
    return <LoadingSpinner />;
  }

  if (isFormSchemaLoading || !formSchema) {
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
      <DynamicForm
        config={{ fields: formSchema }}
        onSubmit={(values) => {
          handleFormSubmit(values);
        }}
        loading={isPending || isUpdateDestinationPending}
        defaultValues={
          mode === "edit" && destinationData
            ? destinationData.config_data
            : undefined
        }
      />
    </Flex>
  );
};

export default DestinationForm;
