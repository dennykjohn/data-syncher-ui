import { Flex } from "@chakra-ui/react";

import { useNavigate, useParams } from "react-router";

import DynamicForm from "@/components/dashboard/helpers/DynamicForm";
import PageHeader from "@/components/dashboard/wrapper/PageHeader";
import LoadingSpinner from "@/components/shared/Spinner";
import { toaster } from "@/components/ui/toaster";
import ClientRoutes from "@/constants/client-routes";
import { VIEW_CONFIG } from "@/constants/view-config";
import useCreateConnection from "@/queryOptions/connector/useCreateConnection";
import useFetchConnectorConfig from "@/queryOptions/connector/useFetchConnectorConfig";
import { useFetchConnectorById } from "@/queryOptions/connector/useFetchConnectorDetailsById";
import useUpdateConnectorConfig from "@/queryOptions/connector/useUpdateConnectorConfig";
import useFetchFormSchema from "@/queryOptions/useFetchFormSchema";

import { type ConnectorFormState } from "../../type";

const ConnectorConfiguration = ({
  state,
  handlePrevious,
  mode = "create",
}: {
  state?: ConnectorFormState;
  handlePrevious?: () => void;
  mode: "create" | "edit";
}) => {
  const navigate = useNavigate();
  const { connectionId } = useParams<{ connectionId: string }>();
  const shouldFetch = mode === "edit" && !!connectionId;

  // Query hooks
  const { data: connectorData, isPending: isFetchConnectorByIdPending } =
    useFetchConnectorById(shouldFetch ? Number(connectionId) : 0);
  const { data: connectorConfig, isPending: isFetchConnectorConfigPending } =
    useFetchConnectorConfig({
      type: connectorData?.source_name || "",
      id: shouldFetch ? Number(connectionId) : 0,
    });
  const { data: formSchema, isLoading } = useFetchFormSchema({
    type: state?.source || connectorData?.source_name || "",
    source: "source",
  });

  // Mutation hooks
  const {
    mutate: updateConnectorConfig,
    isPending: isUpdateConnectorConfigPending,
  } = useUpdateConnectorConfig({
    connectorId: shouldFetch ? Number(connectionId) : 0,
    type: connectorData?.source_name || "",
  });
  const { mutate: createConnection, isPending: isCreateConnectorPending } =
    useCreateConnection(state?.source || "");

  const handleFormSubmit = (values: Record<string, string>) => {
    if (mode === "create") {
      createConnection(
        {
          connection_name: values.connection_name || "Unnamed Connector",
          destination_schema: state?.destination || "",
          form_data: values,
        },
        {
          onSuccess: (response) => {
            if (response.auth_url) {
              window.location.href = response.auth_url;
            } else {
              toaster.success({
                title: response.message || "Connector created successfully",
                description: "The connector has been created.",
              });
              navigate(
                `${ClientRoutes.DASHBOARD}/${ClientRoutes.CONNECTORS.ROOT}`,
              );
            }
          },
        },
      );
    } else {
      updateConnectorConfig(
        {
          connection_name: values.connection_name || "Unnamed Connector",
          destination_schema: connectorConfig?.destination_config.name || "",
          form_data: values,
        },
        {
          onSuccess: (response) => {
            if (response.auth_url) {
              window.location.href = response.auth_url;
            } else {
              toaster.success({
                title: "Connector updated successfully",
                description: "The connector has been updated.",
              });
            }
          },
        },
      );
    }
  };

  if (
    (mode === "create" && (isLoading || !formSchema)) ||
    (mode === "edit" &&
      (isFetchConnectorByIdPending ||
        isFetchConnectorConfigPending ||
        (!connectorConfig?.source_schema && (isLoading || !formSchema))))
  ) {
    return <LoadingSpinner />;
  }
  return (
    <Flex direction="column" gap={VIEW_CONFIG.pageGap}>
      <PageHeader
        breadcrumbs={[
          {
            label: "Connector",
            route: `${ClientRoutes.DASHBOARD}/${ClientRoutes.CONNECTORS.ROOT}`,
          },
          { label: mode === "edit" ? "Edit Connector" : "Configure" },
        ]}
        title={
          mode === "edit" ? "Edit Connector" : "Enter authorization details"
        }
        subtitle={
          mode === "edit"
            ? "Modify the connector configuration"
            : "Provide the necessary details to authorize the connector"
        }
      />
      <DynamicForm
        mode={mode}
        config={{
          fields:
            mode === "edit" &&
            connectorConfig?.source_schema &&
            Array.isArray(connectorConfig.source_schema) &&
            connectorConfig.source_schema.length > 0
              ? connectorConfig.source_schema
              : formSchema || [],
        }}
        sourceName={state?.source || connectorData?.source_name || ""}
        onSubmit={(values) => {
          handleFormSubmit(values);
        }}
        loading={isCreateConnectorPending || isUpdateConnectorConfigPending}
        handleBackButtonClick={handlePrevious}
        defaultValues={
          mode === "edit" && connectorConfig
            ? {
                ...connectorConfig?.initial_data,
              }
            : undefined
        }
      />
    </Flex>
  );
};
export default ConnectorConfiguration;
