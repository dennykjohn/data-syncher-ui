import { useEffect, useReducer } from "react";

import { Button, Flex } from "@chakra-ui/react";

import { CiTrash } from "react-icons/ci";
import { MdRefresh } from "react-icons/md";

import { useLocation, useNavigate, useParams } from "react-router";

import DynamicForm from "@/components/dashboard/helpers/DynamicForm";
import PageHeader from "@/components/dashboard/wrapper/PageHeader";
import LoadingSpinner from "@/components/shared/Spinner";
import { toaster } from "@/components/ui/toaster";
import ClientRoutes from "@/constants/client-routes";
import ServerRoutes from "@/constants/server-routes";
import { VIEW_CONFIG } from "@/constants/view-config";
import AxiosInstance from "@/lib/axios/api-client";
import useCreateDestination from "@/queryOptions/destination/useCreateDestination";
import { useFetchDestinationById } from "@/queryOptions/destination/useFetchDestinationById";
import useTriggerDestination from "@/queryOptions/destination/useTriggerDestination";
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
    useUpdateDestination({ id: params.destinationId || "" });

  const { data: formSchema, isLoading: isFormSchemaLoading } =
    useFetchFormSchema({
      type: destinationData?.dst || destinationName || "",
      source: "destinations",
    });

  const { mutate: triggerBackend, isPending: isTriggeringBackend } =
    useTriggerDestination(params.destinationId || "");

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

  const handleDelete = async () => {
    if (!params.destinationId) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete this destination? Note: This action is irreversible",
    );
    if (!confirmed) return;

    try {
      await AxiosInstance.delete(
        ServerRoutes.destination.deleteDestination(
          Number(params.destinationId),
        ),
      );
      toaster.success({
        title: "Destination deleted successfully",
        description: "The destination has been deleted.",
      });
      navigate(`${ClientRoutes.DASHBOARD}/${ClientRoutes.DESTINATION.ROOT}`);
    } catch (error) {
      console.error("Failed to delete destination:", error);
      toaster.error({
        title: "Failed to delete destination",
        description: "An error occurred while deleting the destination.",
      });
    }
  };

  const handleFormSubmit = (values: Record<string, string>) => {
    const payload: Destination = {
      dst: mode === "add" ? destinationName : destinationData?.dst,
      name: values["destination_name"],
      config_data: { ...values },
    };
    if (mode === "edit") {
      updateDestination(payload, {
        onSuccess: (response) => {
          if (response.auth_url) {
            window.location.href = response.auth_url;
          } else {
            toaster.success({
              title: "Destination updated successfully",
              description: `Your ${formState.destinationName} destination has been updated.`,
            });
          }
        },
      });
      return;
    }
    createDestination(payload, {
      onSuccess: (response) => {
        if (response.auth_url) {
          window.location.href = response.auth_url;
        } else {
          toaster.success({
            title: "Destination created successfully",
            description: `Your ${destinationName} destination has been created.`,
          });
          navigate(
            `${ClientRoutes.DASHBOARD}/${ClientRoutes.DESTINATION.ROOT}`,
          );
        }
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
        mode={mode === "add" ? "create" : "edit"}
        destinationName={
          mode === "add" ? destinationName : destinationData?.dst
        }
        config={{
          fields:
            mode === "edit" && destinationData?.fields
              ? destinationData.fields
              : formSchema || [],
        }}
        onSubmit={(values) => {
          handleFormSubmit(values);
        }}
        loading={isPending || isUpdateDestinationPending}
        defaultValues={
          mode === "edit" && destinationData
            ? destinationData.config_data
            : undefined
        }
        leftButtons={
          mode === "edit" && params.destinationId ? (
            <Button
              variant="outline"
              colorPalette="red"
              color="red.500"
              onClick={handleDelete}
            >
              <CiTrash />
              Delete
            </Button>
          ) : undefined
        }
        rightButtons={
          mode === "edit" && params.destinationId ? (
            <Button
              variant="ghost"
              colorPalette="red"
              color="red.500"
              loading={isTriggeringBackend}
              onClick={() =>
                triggerBackend(undefined, {
                  onSuccess: (response) => {
                    if (response.auth_url) {
                      window.location.href = response.auth_url;
                    } else if (response.message) {
                      toaster.success({
                        title: response.message,
                      });
                    }
                  },
                })
              }
            >
              <MdRefresh />
              Test destination
            </Button>
          ) : undefined
        }
      />
    </Flex>
  );
};

export default DestinationForm;
