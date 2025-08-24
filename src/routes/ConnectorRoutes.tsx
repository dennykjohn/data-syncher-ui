import { lazy } from "react";

export const Connectors = lazy(
  () => import("@/components/dashboard/components/Connectors/Connectors"),
);
export const NewConnector = lazy(
  () =>
    import(
      "@/components/dashboard/components/Connectors/components/NewConnector/NewConnector"
    ),
);
export const ConnectorDetails = lazy(
  () =>
    import(
      "@/components/dashboard/components/Connectors/components/ConnectorDetails/ConnectorDetails"
    ),
);
export const ConnectorOverview = lazy(
  () =>
    import(
      "@/components/dashboard/components/Connectors/components/ConnectorDetails/components/Tabs/Overview"
    ),
);
export const ConnectorSchema = lazy(
  () =>
    import(
      "@/components/dashboard/components/Connectors/components/ConnectorDetails/components/Tabs/Schema"
    ),
);
export const ConnectorUsage = lazy(
  () =>
    import(
      "@/components/dashboard/components/Connectors/components/ConnectorDetails/components/Tabs/Usage"
    ),
);
export const ConnectorSettings = lazy(
  () =>
    import(
      "@/components/dashboard/components/Connectors/components/ConnectorDetails/components/Tabs/Settings"
    ),
);
