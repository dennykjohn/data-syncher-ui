import ServerRoutes from "@/constants/server-routes";
import AxiosInstance from "@/lib/axios/api-client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

type UpdateSelectedTablesPayload = {
  selected_tables: string[];
  truncate_flags?: Record<string, boolean>;
  output_file_names?: Record<string, string>;
  table_export_settings?: Record<
    string,
    {
      output_file_name?: string;
      target_folder?: string;
      file_format?: "csv" | "json" | "parquet";
      csv_delimiter?: string;
      csv_quote_char?: string;
      add_utc_timestamp?: boolean;
    }
  >;
};

const updateSelectedTables = (
  connectorId: number,
  payload: UpdateSelectedTablesPayload,
) =>
  AxiosInstance.post(
    ServerRoutes.connector.updateSelectedTables(connectorId),
    payload,
  );

const useUpdateSelectedTables = ({ connectorId }: { connectorId: number }) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateSelectedTablesPayload) =>
      updateSelectedTables(connectorId, payload),

    onSuccess: async () => {
      // Wait for refetch to complete before resolving
      await queryClient.refetchQueries({
        queryKey: ["ConnectorTable", connectorId],
      });
      await queryClient.refetchQueries({
        queryKey: ["SelectedTables", connectorId],
      });

      queryClient.invalidateQueries({
        queryKey: ["TableStatus", connectorId],
      });
    },
  });
};

export default useUpdateSelectedTables;
