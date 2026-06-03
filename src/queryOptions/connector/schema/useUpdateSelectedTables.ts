import ServerRoutes from "@/constants/server-routes";
import AxiosInstance from "@/lib/axios/api-client";
import {
  type ExcelConditionalFormat,
  type ExcelOptions,
} from "@/types/connectors";

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
      file_format?: "csv" | "json" | "parquet" | "excel";
      csv_delimiter?: string;
      csv_quote_char?: string;
      add_utc_timestamp?: boolean;
      notification_email_group_ids?: number[];
      excel_sheet_name?: string;
      excel_options?: ExcelOptions;
      excel_conditional_formats?: ExcelConditionalFormat[];
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
      await queryClient.refetchQueries({
        queryKey: ["ReverseSchema", connectorId],
      });

      queryClient.invalidateQueries({
        queryKey: ["TableStatus", connectorId],
      });
    },
  });
};

export default useUpdateSelectedTables;
