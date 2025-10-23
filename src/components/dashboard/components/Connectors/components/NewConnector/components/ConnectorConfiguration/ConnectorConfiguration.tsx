import { Flex } from "@chakra-ui/react";

import { useParams } from "react-router";

import DynamicForm from "@/components/dashboard/helpers/DynamicForm";
import PageHeader from "@/components/dashboard/wrapper/PageHeader";
import LoadingSpinner from "@/components/shared/Spinner";
import ClientRoutes from "@/constants/client-routes";
import { VIEW_CONFIG } from "@/constants/view-config";
import useCreateConnection from "@/queryOptions/connector/useCreateConnection";
import { useFetchConnectorById } from "@/queryOptions/connector/useFetchConnectorDetailsById";
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
  const { connectionId } = useParams<{ connectionId: string }>();
  const shouldFetch = mode === "edit" && !!connectionId;
  const { data: connectorData, isPending: isFetchConnectorByIdPending } =
    useFetchConnectorById(shouldFetch ? Number(connectionId) : 0);
  console.log("Fetched Connector Data: ", connectorData);

  const { mutate: createConnection, isPending: isCreateConnectorPending } =
    useCreateConnection(state?.source || "");

  const handleFormSubmit = (values: Record<string, string>) => {
    console.log(values, state);
    createConnection(
      {
        connection_name: values.connection_name || "Unnamed Connector",
        destination_schema: state?.destination || "",
        form_data: values,
      },
      {
        onSuccess: (response) => {
          console.log("Connection created successfully: ", response);
          // handle success actions here
        },
      },
    );
  };

  const { data: formSchema, isLoading } = useFetchFormSchema({
    type: state?.source || connectorData?.source_name || "",
    source: "source",
  });

  if (
    isLoading ||
    !formSchema ||
    (mode === "edit" && isFetchConnectorByIdPending)
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
        title="Enter authorization details"
        subtitle="Provide the necessary details to authorize the connector"
      />
      <DynamicForm
        config={{ fields: formSchema }}
        onSubmit={(values) => {
          handleFormSubmit(values);
        }}
        loading={isCreateConnectorPending}
        handleBackButtonClick={handlePrevious}
        // defaultValues={
        //   mode === "edit" && connectorData
        //     ? {
        //         ...connectorData,
        //       }
        //     : undefined
        // }
      />
    </Flex>
  );
};
export default ConnectorConfiguration;
