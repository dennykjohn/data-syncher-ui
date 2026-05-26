import ServerRoutes from "@/constants/server-routes";
import AxiosInstance from "@/lib/axios/api-client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

type UpdateTableEmailGroupsPayload = {
  tableName: string;
  notification_email_group_ids: number[];
};

const updateTableEmailGroups = (
  connectorId: number,
  payload: UpdateTableEmailGroupsPayload,
) =>
  AxiosInstance.patch(
    ServerRoutes.connector.updateTableEmailGroups(
      connectorId,
      payload.tableName,
    ),
    { notification_email_group_ids: payload.notification_email_group_ids },
  );

const useUpdateTableEmailGroups = ({
  connectorId,
}: {
  connectorId: number;
}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateTableEmailGroupsPayload) =>
      updateTableEmailGroups(connectorId, payload),

    onSuccess: async () => {
      queryClient.invalidateQueries({
        queryKey: ["ReverseSchema", connectorId],
      });
    },
  });
};

export default useUpdateTableEmailGroups;
