import { type BodyFieldOption } from "./types";

export const BODY_FIELDS_OPTIONS: BodyFieldOption[] = [
  { id: "service", label: "Service name" },
  { id: "connection", label: "Connection Name" },
  { id: "company", label: "Company Name" },
  { id: "table", label: "Table Name" },
  { id: "file", label: "File" },
  { id: "rows", label: "Rows Exported" },
  { id: "columns", label: "Columns Exported" },
  { id: "path", label: "Destination Path" },
  { id: "timestamp", label: "Completed Timestamp" },
];

export const DEFAULT_BODY_FIELDS: string[] = [];

export const DEFAULT_SUBJECT_TEMPLATE =
  "The {destination} export for {table} finished successfully.";
export const DEFAULT_BODY_CONTENT = "";
export const DEFAULT_TEAM_NAME = "Thanks & Regards,";
