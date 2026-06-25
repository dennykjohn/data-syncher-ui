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
  connection_id: number;
  batch_id: number;
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
  created_at: string;
  updated_at: string;
  nodes: PipelineNodeDto[];
  edges: PipelineEdgeDto[];
  root_node_ids?: number[];
  readable_schedule?: string;
};

export type CreatePipelinePayload = {
  name?: string;
  schedule_type?: string;
  time_frequency?: string;
  schedule_config?: Record<string, unknown>;
  sync_start_date?: string | null;
};

export type PatchPipelinePayload = {
  name?: string;
  status?: "active" | "paused";
  schedule_type?: string;
  time_frequency?: string;
  schedule_config?: Record<string, unknown>;
  sync_start_date?: string | null;
};

export type AddPipelineNodePayload = {
  batch_id: number;
  connection_id: number;
  x: number;
  y: number;
};

export type PatchPipelineNodePayload = {
  x?: number;
  y?: number;
  order_index?: number;
  node_label?: string;
  execution_order?: "parallel" | "sequential";
};
