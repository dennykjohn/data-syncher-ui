import { useEffect, useReducer } from "react";

import { Button, Flex } from "@chakra-ui/react";

import { useLocation, useNavigate, useParams } from "react-router";

import DynamicForm from "@/components/dashboard/helpers/DynamicForm";
import PageHeader from "@/components/dashboard/wrapper/PageHeader";
import LoadingSpinner from "@/components/shared/Spinner";
import { toaster } from "@/components/ui/toaster";
import ClientRoutes from "@/constants/client-routes";
import { VIEW_CONFIG } from "@/constants/view-config";
import useCreateDestination from "@/queryOptions/destination/useCreateDestination";
import { useFetchDestinationById } from "@/queryOptions/destination/useFetchDestinationById";
import { useTriggerDestination } from "@/queryOptions/destination/useTriggerDestination";
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

  // Trigger backend (fire-and-forget)
  const { mutate: triggerBackend } = useTriggerDestination(
    params.destinationId || "",
  );

  useEffect(() => {
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
      dst: mode === "add" ? destinationName : destinationData?.dst,
      name: values["destination_name"],
      config_data: { ...values },
    };

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

  if (mode === "edit" && isFetchDestinationByIdPending)
    return <LoadingSpinner />;
  if (isFormSchemaLoading || !formSchema) return <LoadingSpinner />;

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
        onSubmit={handleFormSubmit}
        loading={isPending || isUpdateDestinationPending}
        defaultValues={
          mode === "edit" && destinationData
            ? destinationData.config_data
            : undefined
        }
      />

      {/* Small fire-and-forget "Test Destination" Button */}
      {mode === "edit" && params.destinationId && (
        // example test icon (you can change this)
        <Flex justify="flex-start" align="center" gap={4} mt="-4.5rem" ml={2}>
          <Button
            variant="outline"
            colorPalette="brand"
            color="brand.500"
            borderColor="brand.500"
            borderWidth="1.8px"
            fontWeight="500"
            px={8}
            h="40px"
            borderRadius="md"
            w="120px"
            onClick={() =>
              triggerBackend(undefined, {
                onSuccess: (message: string) =>
                  toaster.success({ title: message }),
                onError: (error: unknown) =>
                  toaster.error({
                    title: "Error",
                    description:
                      error instanceof Error
                        ? error.message
                        : "Something went wrong",
                  }),
              })
            }
          >
            Test Destination
          </Button>
        </Flex>
      )}
    </Flex>
  );
};

export default DestinationForm;
