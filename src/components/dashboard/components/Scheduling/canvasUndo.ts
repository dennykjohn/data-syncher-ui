import { type AddPipelineNodePayload } from "@/types/pipeline";

export type CanvasUndoEntry =
  | {
      type: "positions";
      positions: Array<{ nodeId: number; x: number; y: number }>;
    }
  | {
      type: "removeNode";
      nodeId: number;
    }
  | {
      type: "readdNode";
      payload: AddPipelineNodePayload;
    }
  | {
      type: "removeEdge";
      edgeId: number;
    }
  | {
      type: "readdEdge";
      from_node_id: number;
      to_node_id: number;
    };

export const MAX_CANVAS_UNDO = 20;

export function pushCanvasUndo(
  stack: CanvasUndoEntry[],
  entry: CanvasUndoEntry,
): CanvasUndoEntry[] {
  return [...stack, entry].slice(-MAX_CANVAS_UNDO);
}
