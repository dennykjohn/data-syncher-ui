/** Normalize connector names for file-source API routes. */
export function fileSourceApiSegment(source?: string | null): string {
  const normalizedSource = (source || "")
    .toLowerCase()
    .replace(/[\s\-._]/g, "");

  if (normalizedSource === "sftp") return "sftp";
  if (normalizedSource === "googledrive") return "googledrive";
  if (
    normalizedSource === "azuredatalakestorage" ||
    normalizedSource === "adls"
  ) {
    return "azuredatalakestorage";
  }

  // AmazonS3, amazons3, s3, and an omitted source all use Django's s3 route.
  return "s3";
}

type FileSourceRequest = {
  sourceType?: string;
  isSftp?: boolean;
  [key: string]: unknown;
};

/** Resolve the API route from either sourceType or connector-specific fields. */
export function fileSourceApiSegmentFromRequest(
  data: FileSourceRequest,
): string {
  if (data.sourceType) return fileSourceApiSegment(data.sourceType);

  const isSftp = !!data.isSftp || !!data.sftp_host || !!data.sftp_username;
  if (isSftp) return "sftp";

  const isGoogleDrive =
    !!data.service_account_json ||
    !!data.folder_id ||
    !!data.google_drive_folder_id ||
    (!!data.root_folder && (!!data.client_id || !!data.client_secret));
  if (isGoogleDrive) return "googledrive";

  const isAzureDataLakeStorage =
    !!data.account_name ||
    !!data.storage_account_name ||
    !!data.container_name ||
    !!data.file_system ||
    !!data.connection_string ||
    !!data.sas_token;
  if (isAzureDataLakeStorage) return "azuredatalakestorage";

  return "s3";
}
