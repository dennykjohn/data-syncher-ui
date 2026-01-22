import { useMemo, useState } from "react";

import { Flex } from "@chakra-ui/react";

import { useNavigate, useParams } from "react-router";

import PrimaryKeySelection from "@/components/dashboard/components/Connectors/components/NewConnector/components/PrimaryKeySelection/PrimaryKeySelection";
import S3DynamicForm, {
  type S3FieldSchema,
} from "@/components/dashboard/helpers/S3DynamicForm";
import PageHeader from "@/components/dashboard/wrapper/PageHeader";
import LoadingSpinner from "@/components/shared/Spinner";
import { toaster } from "@/components/ui/toaster";
import ClientRoutes from "@/constants/client-routes";
import { VIEW_CONFIG } from "@/constants/view-config";
import useCreateConnection from "@/queryOptions/connector/useCreateConnection";
import useFetchConnectorConfig from "@/queryOptions/connector/useFetchConnectorConfig";
import { useFetchConnectorById } from "@/queryOptions/connector/useFetchConnectorDetailsById";
import useSuggestPrimaryKeys, {
  type SuggestPrimaryKeysRequest,
} from "@/queryOptions/connector/useSuggestPrimaryKeys";
import useUpdateConnectorConfig from "@/queryOptions/connector/useUpdateConnectorConfig";
import useFetchFormSchema from "@/queryOptions/useFetchFormSchema";
import { type CreateConnectionPayload } from "@/types/connectors";

import { type ConnectorFormState } from "../../type";

const S3ConnectorConfiguration = ({
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

  // State for primary key selection flow
  const [showPrimaryKeySelection, setShowPrimaryKeySelection] = useState(false);
  const [createdConnectionId, setCreatedConnectionId] = useState<number | null>(
    null,
  );
  const [pendingFormData, setPendingFormData] = useState<{
    connection_name: string;
    destination_schema: string;
    form_data: Record<string, string>;
  } | null>(null);

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

  // Prepare params for suggest primary keys API
  const suggestPrimaryKeysParams = useMemo(() => {
    if (pendingFormData?.form_data) {
      const formData = pendingFormData.form_data;
      return {
        s3_bucket: formData.s3_bucket,
        aws_access_key_id: formData.aws_access_key_id,
        aws_secret_access_key: formData.aws_secret_access_key,
        base_folder_path: formData.base_folder_path,
        file_type: formData.file_type,
        ...formData,
      };
    } else if (createdConnectionId) {
      return { connection_id: createdConnectionId };
    }
    return null;
  }, [pendingFormData, createdConnectionId]);

  // Fetch suggested primary keys when showing primary key selection
  const { data: suggestedPrimaryKeys, isPending: isSuggestPrimaryKeysPending } =
    useSuggestPrimaryKeys(
      suggestPrimaryKeysParams ?? ({} as SuggestPrimaryKeysRequest),
      showPrimaryKeySelection,
    );

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

  // ------------------- Strict-safe form submit -------------------
  const handleFormSubmit = (values: Record<string, unknown>) => {
    const connectionName =
      (values["connection_name"] as string) || "Unnamed Connector";
    const parsedValues: Record<string, unknown> = { ...values };
    const jsonFields = ["single_file_table_mapping", "table_to_files_mapping"];

    jsonFields.forEach((field) => {
      if (parsedValues[field] && typeof parsedValues[field] === "string") {
        try {
          parsedValues[field] = JSON.parse(parsedValues[field]);
        } catch (e) {
          console.warn(`⚠️ S3 - Failed to parse ${field}:`, e);
        }
      }
    });

    // ✅ Convert all values to strings to satisfy TS
    const stringifiedValues: Record<string, string> = {};
    Object.entries(parsedValues).forEach(([key, value]) => {
      if (value === undefined || value === null) {
        stringifiedValues[key] = "";
      } else if (typeof value === "object") {
        stringifiedValues[key] = JSON.stringify(value);
      } else {
        stringifiedValues[key] = String(value);
      }
    });

    const requiresPrimaryKeySelection =
      parsedValues["load_method"] === "upsert_custom_key";

    if (mode === "create") {
      if (requiresPrimaryKeySelection) {
        setPendingFormData({
          connection_name: connectionName,
          destination_schema: state?.destination || "",
          form_data: stringifiedValues, // ✅ use stringifiedValues
        });
        setShowPrimaryKeySelection(true);
        return;
      }

      createConnection(
        {
          connection_name: connectionName,
          destination_schema: state?.destination || "",
          form_data: stringifiedValues, // ✅ use stringifiedValues
        },
        {
          onSuccess: (response) => {
            if (response.auth_url) {
              window.location.href = response.auth_url;
            } else {
              toaster.success({
                title: response.message || "S3 Connector created successfully",
                description: "The S3 connector has been created.",
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
          connection_name: connectionName,
          destination_schema: connectorConfig?.destination_config.name || "",
          form_data: stringifiedValues, // ✅ use stringifiedValues
        },
        {
          onSuccess: (response) => {
            if (response.auth_url) {
              window.location.href = response.auth_url;
            } else {
              toaster.success({
                title: "S3 Connector updated successfully",
                description: "The S3 connector has been updated.",
              });
            }
          },
        },
      );
    }
  };
  // -----------------------------------------------------------------

  // ------------------- Loading state -------------------
  if (
    (mode === "create" && (isLoading || !formSchema)) ||
    (mode === "edit" &&
      (isFetchConnectorByIdPending ||
        isFetchConnectorConfigPending ||
        (!connectorConfig?.source_schema && (isLoading || !formSchema))))
  ) {
    return <LoadingSpinner />;
  }

  const sourceName = state?.source || connectorData?.source_name || "";

  // Get the schema fields
  const schemaFields =
    mode === "edit" &&
    connectorConfig?.source_schema &&
    Array.isArray(connectorConfig.source_schema) &&
    connectorConfig.source_schema.length > 0
      ? connectorConfig.source_schema
      : formSchema || [];

  // ------------------- Primary key selection -------------------
  if (showPrimaryKeySelection) {
    if (pendingFormData) {
      if (isSuggestPrimaryKeysPending) return <LoadingSpinner />;

      const formData = pendingFormData.form_data;
      const schemaData = suggestedPrimaryKeys?.tables
        ? {
            schemaName:
              formData.multi_files_table_name ||
              formData.destination_schema ||
              "Schema",
            tables: suggestedPrimaryKeys.tables.map((table) => ({
              name: table.table_name,
              columns: table.columns.map((col) => ({
                name: col.column_name,
                isPrimaryKey: col.is_suggested_pk,
                cardinality: col.uniqueness_score / 100,
                warning:
                  col.warnings.length > 0 ? col.warnings.join(". ") : undefined,
              })),
            })),
          }
        : undefined;

      return (
        <PrimaryKeySelection
          schemaData={schemaData}
          loading={isCreateConnectorPending}
          onBack={() => {
            setShowPrimaryKeySelection(false);
            setPendingFormData(null);
          }}
          onSaveAndContinue={(primaryKeys) => {
            const formDataWithPrimaryKeys = {
              ...pendingFormData,
              form_data: {
                ...formData,
                custom_primary_key: primaryKeys,
              },
            };

            createConnection(
              formDataWithPrimaryKeys as unknown as CreateConnectionPayload,
              {
                onSuccess: () => {
                  toaster.success({
                    title: "S3 Connector created successfully",
                    description: "Primary keys have been configured.",
                  });
                  navigate(
                    `${ClientRoutes.DASHBOARD}/${ClientRoutes.CONNECTORS.ROOT}`,
                  );
                },
                onError: (error) => {
                  toaster.error({
                    title: "Failed to create S3 connector",
                    description: error.message || "An error occurred",
                  });
                },
              },
            );
          }}
        />
      );
    }

    if (createdConnectionId) {
      if (isSuggestPrimaryKeysPending) return <LoadingSpinner />;

      const schemaData = suggestedPrimaryKeys?.tables
        ? {
            schemaName: "Schema",
            tables: suggestedPrimaryKeys.tables.map((table) => ({
              name: table.table_name,
              columns: table.columns.map((col) => ({
                name: col.column_name,
                isPrimaryKey: col.is_suggested_pk,
                cardinality: col.uniqueness_score / 100,
                warning:
                  col.warnings.length > 0 ? col.warnings.join(". ") : undefined,
              })),
            })),
          }
        : undefined;

      return (
        <PrimaryKeySelection
          schemaData={schemaData}
          onBack={() => {
            setShowPrimaryKeySelection(false);
            setCreatedConnectionId(null);
          }}
          onSaveAndContinue={() => {
            toaster.success({
              title: "Primary keys configured",
              description: "Your S3 connector is now ready to use.",
            });
            navigate(
              `${ClientRoutes.DASHBOARD}/${ClientRoutes.CONNECTORS.ROOT}`,
            );
          }}
        />
      );
    }
  }

  // ------------------- Main form -------------------
  return (
    <Flex direction="column" gap={VIEW_CONFIG.pageGap}>
      <PageHeader
        breadcrumbs={[
          {
            label: "Connector",
            route: `${ClientRoutes.DASHBOARD}/${ClientRoutes.CONNECTORS.ROOT}`,
          },
          { label: mode === "edit" ? "Edit S3 Connector" : "Configure S3" },
        ]}
        title={
          mode === "edit"
            ? "Edit S3 Connector"
            : "Enter S3 authorization details"
        }
        subtitle={
          mode === "edit"
            ? "Modify the S3 connector configuration"
            : "Provide the necessary details to authorize the S3 connector"
        }
      />
      <S3DynamicForm
        schema={schemaFields as S3FieldSchema[]}
        onSubmit={handleFormSubmit}
        loading={isCreateConnectorPending || isUpdateConnectorConfigPending}
        handleBackButtonClick={handlePrevious}
        defaultValues={
          mode === "edit" && connectorConfig
            ? { ...connectorConfig.initial_data }
            : undefined
        }
        mode={mode}
        sourceName={sourceName}
      />
    </Flex>
  );
};

export default S3ConnectorConfiguration;
