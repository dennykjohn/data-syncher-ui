export type PipelineBatchRef = {
  id: number;
  name: string;
  table_count: number;
  execution_order: "parallel" | "sequential";
  time_frequency: string;
};

export type PipelineConnectionItem = {
  connection_id: number;
  connection_name: string;
  batches: PipelineBatchRef[];
};

export type PipelineNodeDto = {
  id: number;
  pipeline_id: number;
  node_kind?: "start" | "batch";
  connection_id: number | null;
  batch_id: number | null;
  batch_name: string;
  node_label: string;
  x: number;
  y: number;
  order_index: number;
  execution_order: "parallel" | "sequential";
  schedule_type: string;
  time_frequency: string;
  schedule_config: Record<string, unknown>;
  sync_start_date: string | null;
  sync_end_date?: string | null;
  notify_on_completion?: boolean;
};

export type PipelineEdgeDto = {
  id: number;
  pipeline_id: number;
  from_node_id: number;
  to_node_id: number;
};

export type PipelineDetail = {
  id: number;
  name: string;
  status: "active" | "paused";
  schedule_type: string;
  time_frequency: string;
  schedule_config: Record<string, unknown>;
  sync_start_date: string | null;
  sync_end_date?: string | null;
  notify_on_flow_finish: boolean;
  notification_email_group_ids: number[];
  notification_emails: string[];
  created_at: string;
  updated_at: string;
  nodes: PipelineNodeDto[];
  edges: PipelineEdgeDto[];
  root_node_ids?: number[];
  start_node_id?: number | null;
  readable_schedule?: string;
  next_run_at?: string | null;
  validated_at?: string | null;
  validated_graph_fingerprint?: string | null;
  draft_node_ids?: number[];
  canvas_changed_since_publish?: boolean;
  has_published_graph?: boolean;
  published_graph?: PipelinePublishedGraph | null;
};

export type PipelinePublishedGraph = {
  fingerprint?: string | null;
  validated_at?: string | null;
  start_node_id?: number | null;
  node_ids: number[];
  edges: Array<{ from_node_id: number; to_node_id: number }>;
};

export type CreatePipelinePayload = {
  name?: string;
  schedule_type?: string;
  time_frequency?: string;
  schedule_config?: Record<string, unknown>;
  sync_start_date?: string | null;
  sync_end_date?: string | null;
};

export type PatchPipelinePayload = {
  name?: string;
  status?: "active" | "paused";
  schedule_type?: string;
  time_frequency?: string;
  schedule_config?: Record<string, unknown>;
  sync_start_date?: string | null;
  sync_end_date?: string | null;
  notify_on_flow_finish?: boolean;
  notification_email_group_ids?: number[];
  notification_emails?: string[];
};

export type AddPipelineNodePayload = {
  batch_id: number;
  connection_id: number;
  x: number;
  y: number;
  insert_between?: {
    from_node_id: number;
    to_node_id: number;
  };
};

export type PatchPipelineNodePayload = {
  x?: number;
  y?: number;
  order_index?: number;
  node_label?: string;
  execution_order?: "parallel" | "sequential";
  notify_on_completion?: boolean;
};

export type PipelineNodeRunStatus =
  | "pending"
  | "waiting"
  | "running"
  | "completed"
  | "failed"
  | "timeout"
  | "skipped";

export type PipelineRunOverall = {
  nodes_total: number;
  nodes_completed: number;
  nodes_failed: number;
  nodes_running: number;
  nodes_skipped?: number;
  tables_completed: number;
  tables_total: number;
  tables_failed: number;
  status: string;
};

export type PipelineRunNodeDetail = {
  node_id: number;
  batch_id: number;
  batch_name: string;
  connection_id: number;
  node_label: string;
  execution_order: "parallel" | "sequential" | string;
  status: PipelineNodeRunStatus | string;
  migration_session_id?: number | null;
  started_at?: string | null;
  finished_at?: string | null;
  error?: string | null;
  table_count: number;
  migration_status?: {
    overall_status?: string;
    tables?: Array<{
      table_name: string;
      status: string;
      status_icon?: string;
      record_count?: number;
      duration?: string | null;
      error_message?: string | null;
    }>;
    total_tables?: number;
  } | null;
};

export type PipelineRunMode = "published" | "draft";

export type PipelineRunDetail = {
  pipeline_run_id: number;
  pipeline_id: number;
  run_mode?: PipelineRunMode;
  status: string;
  started_at: string | null;
  finished_at: string | null;
  current_node_id: number | null;
  current_node_ids?: number[];
  overall: PipelineRunOverall;
  nodes: PipelineRunNodeDetail[];
  error?: string | null;
};

export type PipelineRunSummary = {
  pipeline_run_id: number;
  run_mode?: PipelineRunMode;
  status: string;
  started_at: string | null;
  finished_at: string | null;
  overall: PipelineRunOverall;
  error?: string | null;
};

export type PipelineValidationLevel = {
  level: number;
  node_count: number;
  node_ids: number[];
  batch_names: string[];
};

export type PipelineValidationResult = {
  valid: boolean;
  errors: string[];
  warnings: string[];
  levels: PipelineValidationLevel[];
  max_nodes_per_level: number;
  draft_node_ids?: number[];
  has_published_graph?: boolean;
  published_at?: string | null;
  canvas_changed_since_publish?: boolean;
};
