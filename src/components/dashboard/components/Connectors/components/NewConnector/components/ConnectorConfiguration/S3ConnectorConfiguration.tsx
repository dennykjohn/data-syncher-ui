import { useEffect, useMemo, useState } from "react";

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
import { useQueryClient } from "@tanstack/react-query";

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
  const queryClient = useQueryClient();
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
  // For edit mode: store the last submitted form payload so we can re-submit
  // it with custom_primary_key once the user finishes primary key selection.
  const [editPendingPayload, setEditPendingPayload] = useState<{
    connection_name: string;
    destination_schema: string;
    form_data: Record<string, string>;
  } | null>(null);
  // Tables that still need a custom primary key (from the update API response).
  const [pendingKeyTables, setPendingKeyTables] = useState<string[]>([]);

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
    // Create mode: pendingFormData holds the full S3 form fields
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
    }
    // Edit mode: editPendingPayload holds the full submitted form; send it
    // together with the connection_id so the API has full context to analyse
    // only the pending (newly mapped) tables.
    if (editPendingPayload?.form_data && createdConnectionId) {
      const formData = editPendingPayload.form_data;
      return {
        connection_id: createdConnectionId,
        s3_bucket: formData.s3_bucket,
        aws_access_key_id: formData.aws_access_key_id,
        aws_secret_access_key: formData.aws_secret_access_key,
        base_folder_path: formData.base_folder_path,
        file_type: formData.file_type,
        // Tell the backend which tables still need primary key analysis.
        ...(pendingKeyTables.length > 0
          ? { pending_primary_key_tables: pendingKeyTables }
          : {}),
        ...formData,
      };
    }
    // Fallback: only connection_id available
    if (createdConnectionId) {
      return { connection_id: createdConnectionId };
    }
    return null;
  }, [
    pendingFormData,
    editPendingPayload,
    pendingKeyTables,
    createdConnectionId,
  ]);

  // Fetch suggested primary keys when showing primary key selection
  const { data: suggestedPrimaryKeys, isPending: isSuggestPrimaryKeysPending } =
    useSuggestPrimaryKeys(
      suggestPrimaryKeysParams ?? ({} as SuggestPrimaryKeysRequest),
      showPrimaryKeySelection,
    );

  // Ensure edit-mode primary key selection opens only after payload is ready.
  useEffect(() => {
    if (
      mode === "edit" &&
      editPendingPayload &&
      createdConnectionId &&
      !showPrimaryKeySelection
    ) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShowPrimaryKeySelection(true);
    }
  }, [mode, editPendingPayload, createdConnectionId, showPrimaryKeySelection]);

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
          console.warn(`\u26a0\ufe0f S3 - Failed to parse ${field}:`, e);
        }
      }
    });

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

    // Ensure latest mapping fields are preserved as-is from the submitted values.
    if (values["single_file_table_mapping"] !== undefined) {
      stringifiedValues.single_file_table_mapping = String(
        values["single_file_table_mapping"] || "",
      );
    }
    if (values["table_to_files_mapping"] !== undefined) {
      stringifiedValues.table_to_files_mapping = String(
        values["table_to_files_mapping"] || "",
      );
    }
    if (values["multi_files_table_name"] !== undefined) {
      stringifiedValues.multi_files_table_name = String(
        values["multi_files_table_name"] || "",
      );
    }
    if (values["multi_files_prefix"] !== undefined) {
      stringifiedValues.multi_files_prefix = String(
        values["multi_files_prefix"] || "",
      );
    }

    const requiresPrimaryKeySelection =
      parsedValues["load_method"] === "upsert_custom_key" &&
      !(
        parsedValues["file_type"] === "json" &&
        parsedValues["json_mode"] === "packed"
      );

    if (mode === "create") {
      if (requiresPrimaryKeySelection) {
        setPendingFormData({
          connection_name: connectionName,
          destination_schema: state?.destination || "",
          form_data: stringifiedValues,
        });
        setShowPrimaryKeySelection(true);
        return;
      }

      createConnection(
        {
          connection_name: connectionName,
          destination_schema: state?.destination || "",
          form_data: stringifiedValues,
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
      const editPayload = {
        connection_name: connectionName,
        destination_schema: connectorConfig?.destination_config.name || "",
        form_data: stringifiedValues,
      };

      // If user chose custom primary key method, show selection UI before updating
      if (requiresPrimaryKeySelection && !showPrimaryKeySelection) {
        setEditPendingPayload(editPayload);
        setCreatedConnectionId(Number(connectionId));
        // Defer opening until payload is stored so suggest-primary-keys uses latest mapping
        setShowPrimaryKeySelection(false);
        return;
      }

      updateConnectorConfig(editPayload, {
        onSuccess: (response) => {
          if (response.auth_url) {
            window.location.href = response.auth_url;
          } else if (response.requires_primary_key_selection) {
            // Backend says primary key selection is needed for newly mapped tables.
            setEditPendingPayload(editPayload);
            setCreatedConnectionId(
              response.connection_id ?? Number(connectionId),
            );
            setPendingKeyTables(response.pending_primary_key_tables ?? []);
            setShowPrimaryKeySelection(true);
          } else {
            toaster.success({
              title: "S3 Connector updated successfully",
              description: "The S3 connector has been updated.",
            });
            refreshSchemaStatus(connectionId);
            navigate(
              `${ClientRoutes.DASHBOARD}/${ClientRoutes.CONNECTORS.ROOT}/${ClientRoutes.CONNECTORS.EDIT}/${connectionId}/${ClientRoutes.CONNECTORS.SETTINGS}`,
            );
          }
        },
      });
    }
  };
  // -----------------------------------------------------------------

  const refreshSchemaStatus = (id: number | string | null | undefined) => {
    const connectionIdNum = Number(id);
    if (!connectionIdNum) return;
    queryClient.removeQueries({ queryKey: ["SchemaStatus", connectionIdNum] });
    queryClient.invalidateQueries({
      queryKey: ["SchemaStatus", connectionIdNum],
      refetchType: "active",
    });
    queryClient.invalidateQueries({
      queryKey: ["TableStatus", connectionIdNum],
      refetchType: "active",
    });
  };

  const sourceName = state?.source || connectorData?.source_name || "";

  // Get the schema fields - Priority: Backend Config (Edit) > Form Schema (Create)
  const baseSchemaFields = useMemo(() => {
    return mode === "edit"
      ? connectorConfig?.source_schema ||
          connectorConfig?.fields ||
          formSchema ||
          []
      : formSchema || [];
  }, [
    mode,
    connectorConfig?.source_schema,
    connectorConfig?.fields,
    formSchema,
  ]);

  const schemaFields = useMemo(() => {
    const fields = baseSchemaFields as S3FieldSchema[];
    if (!fields || fields.length === 0) return fields;

    // Check if include_subfolders is already in the schema
    const hasIncludeSubfolders = fields.some(
      (f) => f.name === "include_subfolders",
    );
    if (hasIncludeSubfolders) return fields;

    const includeSubfoldersField: S3FieldSchema = {
      name: "include_subfolders",
      label: "Include Subfolders",
      type: "CharField",
      required: true,
      widget: "Checkbox",
      is_visible: true,
      description: "Check to recursively search for files in subfolders.",
      choices: [
        { value: "true", display: "Yes" },
        { value: "false", display: "No" },
      ],
      default_value: "false",
    };

    // Find the index of the base folder path field to insert after it
    const baseFolderIndex = fields.findIndex(
      (f) =>
        f.name === "base_folder_path" ||
        f.name === "basefolder" ||
        f.name === "folder_path" ||
        f.label?.toLowerCase().includes("base folder") ||
        f.label?.toLowerCase().includes("folder path"),
    );

    if (baseFolderIndex !== -1) {
      const newSchema = [...fields];
      newSchema.splice(baseFolderIndex + 1, 0, includeSubfoldersField);
      return newSchema;
    }

    // Default to putting it after the first few fields or at the end
    const bucketIndex = fields.findIndex((f) =>
      f.name.toLowerCase().includes("bucket"),
    );
    if (bucketIndex !== -1) {
      const newSchema = [...fields];
      newSchema.splice(bucketIndex + 1, 0, includeSubfoldersField);
      return newSchema;
    }

    return [...fields, includeSubfoldersField];
  }, [baseSchemaFields]);

  const s3DefaultValues = useMemo(
    () =>
      mode === "edit" && connectorConfig
        ? { ...connectorConfig.initial_data }
        : pendingFormData?.form_data || undefined,
    [mode, connectorConfig, pendingFormData?.form_data],
  );

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
            tables: (() => {
              const tablesFromApi = suggestedPrimaryKeys.tables.map(
                (table) => ({
                  name: table.table_name,
                  pkLocked: table.pk_locked,
                  columns: table.columns.map((col) => ({
                    name: col.column_name,
                    isPrimaryKey:
                      table.existing_primary_keys &&
                      table.existing_primary_keys.length > 0
                        ? table.existing_primary_keys.includes(col.column_name)
                        : (col.is_selected ?? col.is_suggested_pk),
                    cardinality: col.uniqueness_score / 100,
                    warning:
                      col.warnings.length > 0
                        ? col.warnings.join(". ")
                        : undefined,
                  })),
                }),
              );

              const mappedTables: string[] = [];
              try {
                const mappingRaw = formData.single_file_table_mapping;
                if (mappingRaw) {
                  const parsed = JSON.parse(mappingRaw) as Record<
                    string,
                    string
                  >;
                  Object.values(parsed).forEach((tableName) => {
                    if (tableName) mappedTables.push(tableName);
                  });
                }
              } catch {
                // ignore parse errors
              }

              const existing = new Set(
                tablesFromApi.map((t) => t.name.toLowerCase()),
              );
              mappedTables.forEach((tableName) => {
                const normalized = tableName.toLowerCase();
                if (!existing.has(normalized)) {
                  tablesFromApi.push({
                    name: tableName,
                    pkLocked: false,
                    columns: [],
                  });
                  existing.add(normalized);
                }
              });

              return tablesFromApi;
            })(),
          }
        : undefined;

      return (
        <PrimaryKeySelection
          schemaData={schemaData}
          loading={isCreateConnectorPending}
          onBack={() => {
            setShowPrimaryKeySelection(false);
          }}
          onSaveAndContinue={(primaryKeys) => {
            const formDataWithPrimaryKeys = {
              ...pendingFormData,
              form_data: {
                ...formData,
                custom_primary_key: JSON.stringify(primaryKeys),
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
            tables: (() => {
              const tablesFromApi = suggestedPrimaryKeys.tables.map(
                (table) => ({
                  name: table.table_name,
                  pkLocked: table.pk_locked,
                  columns: table.columns.map((col) => ({
                    name: col.column_name,
                    isPrimaryKey:
                      table.existing_primary_keys &&
                      table.existing_primary_keys.length > 0
                        ? table.existing_primary_keys.includes(col.column_name)
                        : (col.is_selected ?? col.is_suggested_pk),
                    cardinality: col.uniqueness_score / 100,
                    warning:
                      col.warnings.length > 0
                        ? col.warnings.join(". ")
                        : undefined,
                  })),
                }),
              );

              const mappedTables: string[] = [];
              try {
                const mappingRaw =
                  editPendingPayload?.form_data.single_file_table_mapping;
                if (mappingRaw) {
                  const parsed = JSON.parse(mappingRaw) as Record<
                    string,
                    string
                  >;
                  Object.values(parsed).forEach((tableName) => {
                    if (tableName) mappedTables.push(tableName);
                  });
                }
              } catch {
                // ignore parse errors
              }

              const existing = new Set(
                tablesFromApi.map((t) => t.name.toLowerCase()),
              );
              mappedTables.forEach((tableName) => {
                const normalized = tableName.toLowerCase();
                if (!existing.has(normalized)) {
                  tablesFromApi.push({
                    name: tableName,
                    pkLocked: false,
                    columns: [],
                  });
                  existing.add(normalized);
                }
              });

              return tablesFromApi;
            })(),
          }
        : undefined;

      // Edit mode: re-submit config with chosen primary keys
      if (mode === "edit" && editPendingPayload) {
        return (
          <PrimaryKeySelection
            schemaData={schemaData}
            loading={isUpdateConnectorConfigPending}
            onBack={() => {
              setShowPrimaryKeySelection(false);
              setCreatedConnectionId(null);
              setEditPendingPayload(null);
              setPendingKeyTables([]);
            }}
            onSaveAndContinue={(primaryKeys) => {
              // Merge existing custom_primary_key (for already-configured tables)
              // with the newly selected keys (for pending tables like LOGS).
              // New selections win on any key collision.
              let existingPrimaryKeys: Record<string, string[]> = {};
              try {
                const raw = editPendingPayload.form_data.custom_primary_key;
                if (raw) {
                  if (typeof raw === "string") {
                    existingPrimaryKeys = JSON.parse(raw) as Record<
                      string,
                      string[]
                    >;
                  } else if (typeof raw === "object") {
                    existingPrimaryKeys = raw as Record<string, string[]>;
                  }
                }
              } catch {
                // ignore parse errors; fall back to empty
              }
              const mergedPrimaryKeys: Record<string, string[]> = {
                ...existingPrimaryKeys,
                ...primaryKeys,
              };
              updateConnectorConfig(
                {
                  ...editPendingPayload,
                  form_data: {
                    ...editPendingPayload.form_data,
                    custom_primary_key: JSON.stringify(mergedPrimaryKeys),
                  },
                },
                {
                  onSuccess: () => {
                    toaster.success({
                      title: "S3 Connector updated successfully",
                      description: "Primary keys have been configured.",
                    });
                    setShowPrimaryKeySelection(false);
                    setCreatedConnectionId(null);
                    setEditPendingPayload(null);
                    setPendingKeyTables([]);
                    refreshSchemaStatus(connectionId);
                    navigate(
                      `${ClientRoutes.DASHBOARD}/${ClientRoutes.CONNECTORS.ROOT}/${ClientRoutes.CONNECTORS.EDIT}/${connectionId}/${ClientRoutes.CONNECTORS.SETTINGS}`,
                    );
                  },
                },
              );
            }}
          />
        );
      }

      // Create mode: navigate away after selecting keys
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
          ...(mode === "edit"
            ? [
                {
                  label: "Settings",
                  route: `${ClientRoutes.DASHBOARD}/${ClientRoutes.CONNECTORS.ROOT}/${ClientRoutes.CONNECTORS.EDIT}/${connectionId}/${ClientRoutes.CONNECTORS.SETTINGS}`,
                },
              ]
            : []),
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
        defaultValues={s3DefaultValues}
        mode={mode}
        sourceName={sourceName}
        connectionId={shouldFetch ? Number(connectionId) : undefined}
        migrationStatus={connectorData?.migration_status}
      />
    </Flex>
  );
};

export default S3ConnectorConfiguration;
