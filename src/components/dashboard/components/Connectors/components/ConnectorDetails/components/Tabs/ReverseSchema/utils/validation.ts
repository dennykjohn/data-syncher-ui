import { type ConnectorTable } from "@/types/connectors";

export const isPrimaryKey = (
  fieldName: string,
  fieldInfo: string | { data_type?: string; is_primary_key?: boolean },
): boolean => {
  if (
    typeof fieldInfo === "object" &&
    typeof fieldInfo?.is_primary_key === "boolean"
  ) {
    return fieldInfo.is_primary_key;
  }
  const primaryKeyPatterns = [/^id$/i, /_id$/i, /^pk_/i, /primary_key/i];
  return primaryKeyPatterns.some((pattern) => pattern.test(fieldName));
};

export const findPrimaryKey = (tableData: ConnectorTable): string | null => {
  for (const [fieldName, fieldInfo] of Object.entries(tableData.table_fields)) {
    if (isPrimaryKey(fieldName, fieldInfo)) {
      return fieldName;
    }
  }
  return null;
};

export const hasMatchingFields = (
  sourceTableData: ConnectorTable,
  destinationTableData: ConnectorTable,
): boolean => {
  const sourceFields = Object.keys(sourceTableData.table_fields);
  const destinationFields = Object.keys(destinationTableData.table_fields);

  return sourceFields.some((sourceField) =>
    destinationFields.some(
      (destField) => sourceField.toLowerCase() === destField.toLowerCase(),
    ),
  );
};

export type ValidationResult = {
  isValid: boolean;
  error?: {
    title: string;
    description: string;
  };
};

export const validateTableMapping = (
  sourceTableData: ConnectorTable,
  destinationTableData: ConnectorTable,
  sourceField: string,
  destinationField: string,
): ValidationResult => {
  const sourcePK = findPrimaryKey(sourceTableData);
  const destinationPK = findPrimaryKey(destinationTableData);

  if (!sourcePK || !destinationPK) {
    return {
      isValid: false,
      error: {
        title: "Primary Key Not Found",
        description:
          "Both source and destination tables must have primary keys to create a mapping.",
      },
    };
  }

  if (sourcePK.toLowerCase() !== destinationPK.toLowerCase()) {
    return {
      isValid: false,
      error: {
        title: "Primary Key Mismatch",
        description: `Primary keys do not match. Source: "${sourcePK}", Destination: "${destinationPK}".`,
      },
    };
  }

  if (!hasMatchingFields(sourceTableData, destinationTableData)) {
    return {
      isValid: false,
      error: {
        title: "No Matching Fields",
        description:
          "Source and destination tables must have at least one matching field name to create a mapping.",
      },
    };
  }

  const sourceFieldInfo = sourceTableData.table_fields[sourceField];
  const destinationFieldInfo =
    destinationTableData.table_fields[destinationField];

  if (!sourceFieldInfo || !destinationFieldInfo) {
    return {
      isValid: false,
      error: {
        title: "Error",
        description: "Could not find field data for mapping.",
      },
    };
  }

  const sourceIsPK = isPrimaryKey(sourceField, sourceFieldInfo);
  const destIsPK = isPrimaryKey(destinationField, destinationFieldInfo);

  if (!sourceIsPK || !destIsPK) {
    return {
      isValid: false,
      error: {
        title: "Primary Key Field Required",
        description:
          "You can only map primary key fields. Please drag the primary key field.",
      },
    };
  }

  return { isValid: true };
};

export const validateTableToTableMapping = (
  sourceTableData: ConnectorTable,
  destinationTableData: ConnectorTable,
): ValidationResult => {
  const sourcePK = findPrimaryKey(sourceTableData);
  const destinationPKs = Object.entries(destinationTableData.table_fields)
    .filter(([fieldName, fieldInfo]) => isPrimaryKey(fieldName, fieldInfo))
    .map(([fieldName]) => fieldName);

  if (!sourcePK || destinationPKs.length === 0) {
    return {
      isValid: false,
      error: {
        title: "Primary Key Not Found",
        description:
          "Both source and destination tables must have primary keys to create a mapping.",
      },
    };
  }

  const primaryKeyMatch = destinationPKs.some(
    (destPK) => destPK.toLowerCase() === sourcePK.toLowerCase(),
  );

  if (!primaryKeyMatch) {
    return {
      isValid: false,
      error: {
        title: "Primary Key Mismatch",
        description: `At least one primary key must match in both tables. Source: "${sourcePK}", Destination: "${destinationPKs.join(", ")}".`,
      },
    };
  }

  const sourceFields = Object.keys(sourceTableData.table_fields).filter(
    (field) => !isPrimaryKey(field, sourceTableData.table_fields[field]),
  );
  const destinationFields = Object.keys(
    destinationTableData.table_fields,
  ).filter(
    (field) => !isPrimaryKey(field, destinationTableData.table_fields[field]),
  );

  const hasCommonField = sourceFields.some((sourceField) =>
    destinationFields.some(
      (destField) => sourceField.toLowerCase() === destField.toLowerCase(),
    ),
  );

  if (!hasCommonField) {
    return {
      isValid: false,
      error: {
        title: "No Matching Fields",
        description:
          "At least one other field (excluding primary keys) must be the same in both tables.",
      },
    };
  }

  return { isValid: true };
};
