export interface S3ListFilesRequest {
  s3_bucket: string;
  aws_access_key_id: string;
  aws_secret_access_key: string;
  base_folder_path?: string;
  file_type?: string;
}

export interface S3FileItem {
  table: string;
  file_key?: string;
  size?: number;
  last_modified?: string;
}

export interface S3ListFilesResponse {
  tables: S3FileItem[];
  total_count?: number;
}

export interface PreviewPatternRequest {
  s3_bucket: string;
  aws_access_key_id: string;
  aws_secret_access_key: string;
  base_folder_path?: string;
  file_type?: string;
  multi_files_prefix?: string;
}

export interface MatchedTable {
  file_key?: string;
  file_name?: string;
  size_bytes?: number;
  last_modified?: string;
  matches_pattern?: boolean;
  table?: string;
  size?: number;
  matched_pattern?: string;
}

export interface PreviewPatternResponse {
  status?: string;
  pattern?: string;
  total_files_in_folder?: number;
  total_files_by_type?: number;
  matched_files_count?: number;
  matched_files?: MatchedTable[];
  matched_tables?: MatchedTable[];
  total_count?: number;
  pattern_used?: string;
}

export interface SuggestPrimaryKeysRequest {
  connection_id?: number;
  s3_bucket?: string;
  aws_access_key_id?: string;
  aws_secret_access_key?: string;
  base_folder_path?: string;
  file_type?: string;
  [key: string]: unknown;
}

export interface ColumnSuggestion {
  column_name: string;
  data_type: string;
  uniqueness_score: number;
  non_null_score: number;
  pk_suitability_score: number;
  pk_recommendation: string;
  recommendation_reason: string;
  sample_values: unknown[];
  is_suggested_pk: boolean;
  warnings: string[];
  is_selected?: boolean;
}

export interface TableSuggestion {
  table_name: string;
  file_key: string;
  rows_analyzed: number;
  columns: ColumnSuggestion[];
  recommended_pk: string;
  use_custom_pk: boolean;
  fallback_to_file_row: boolean;
}

export interface SuggestPrimaryKeysResponse {
  status: string;
  tables: TableSuggestion[];
  total_files_analyzed: number;
  total_rows_analyzed: number;
}
