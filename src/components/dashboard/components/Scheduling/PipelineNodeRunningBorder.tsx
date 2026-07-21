import { type ReactNode } from "react";

import { Box } from "@chakra-ui/react";

import { PIPELINE_NODE } from "./pipelineNodeStyles";

/** Matches @xyflow/react animated edge dash (stroke-dasharray: 5, dashdraw). */
const RUNNING_STROKE = {
  fill: "none",
  stroke: PIPELINE_NODE.edgeActive,
  strokeWidth: 2,
  strokeDasharray: "5",
  vectorEffect: "non-scaling-stroke" as const,
  style: { animation: "dashdraw 0.5s linear infinite" },
};

type PipelineNodeRunningBorderProps = {
  active: boolean;
  shape?: "rect" | "circle";
  borderRadius?: number;
  children: ReactNode;
};

const PipelineNodeRunningBorder = ({
  active,
  shape = "rect",
  borderRadius = 6,
  children,
}: PipelineNodeRunningBorderProps) => (
  <Box position="relative" display="inline-block">
    {children}
    {active && (
      <svg
        aria-hidden
        style={{
          position: "absolute",
          top: -2,
          left: -2,
          width: "calc(100% + 4px)",
          height: "calc(100% + 4px)",
          pointerEvents: "none",
          overflow: "visible",
        }}
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        {shape === "circle" ? (
          <ellipse cx="50" cy="50" rx="49" ry="49" {...RUNNING_STROKE} />
        ) : (
          <rect
            x="1"
            y="1"
            width="98"
            height="98"
            rx={Math.min(borderRadius * 2, 20)}
            ry={Math.min(borderRadius * 2, 20)}
            {...RUNNING_STROKE}
          />
        )}
      </svg>
    )}
  </Box>
);

export default PipelineNodeRunningBorder;
