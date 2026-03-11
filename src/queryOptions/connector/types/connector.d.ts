export interface S3ListFilesRequest {
  connection_id?: number;
  s3_bucket: string;
  aws_access_key_id: string;
  aws_secret_access_key: string;
  base_folder_path?: string;
  file_type?: string;
  include_subfolders?: string;
  file_mapping_method?: string;
}

export interface S3FileItem {
  table: string;
  file_key?: string;
  size?: number;
  last_modified?: string;
  already_mapped?: boolean;
  mapped_table?: string | null;
  table_name_locked?: boolean;
  locked_table_name?: string | null;
}

export interface S3ListFilesResponse {
  tables: S3FileItem[];
  total_count?: number;
}

export interface PreviewPatternRequest {
  connection_id?: number;
  s3_bucket: string;
  aws_access_key_id: string;
  aws_secret_access_key: string;
  base_folder_path?: string;
  file_type?: string;
  multi_files_prefix?: string;
  include_subfolders?: string;
  file_mapping_method?: string;
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
  tables?: MatchedTable[];
  results?: MatchedTable[];
  data?: MatchedTable[];
  sample_non_matched_files?: MatchedTable[];
  non_matched_files?: MatchedTable[];
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
  pk_locked: boolean;
  existing_primary_keys?: string[];
}

export interface SuggestPrimaryKeysResponse {
  status: string;
  tables: TableSuggestion[];
  total_files_analyzed: number;
  total_rows_analyzed: number;
}
