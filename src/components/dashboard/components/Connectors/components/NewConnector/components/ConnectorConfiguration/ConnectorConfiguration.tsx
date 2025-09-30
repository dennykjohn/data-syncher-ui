import { Flex } from "@chakra-ui/react";

import DynamicForm from "@/components/dashboard/helpers/DynamicForm";
import PageHeader from "@/components/dashboard/wrapper/PageHeader";
import LoadingSpinner from "@/components/shared/Spinner";
import ClientRoutes from "@/constants/client-routes";
import { VIEW_CONFIG } from "@/constants/view-config";
import useFetchFormSchema from "@/queryOptions/useFetchFormSchema";

import { type ConnectorFormState } from "../../type";

const ConnectorConfiguration = ({
  state,
  handlePrevious,
}: {
  state: ConnectorFormState;
  handlePrevious: () => void;
}) => {
  const handleFormSubmit = (values: Record<string, string>) => {
    console.log(values);
  };

  const { data: formSchema, isLoading } = useFetchFormSchema({
    type: state?.source || "",
    source: "source",
  });

  if (isLoading || !formSchema) {
    return <LoadingSpinner />;
  }

  return (
    <Flex direction="column" gap={VIEW_CONFIG.pageGap}>
      <PageHeader
        breadcrumbs={[
          {
            label: "Connector",
            route: `${ClientRoutes.DASHBOARD}/${ClientRoutes.CONNECTORS.ROOT}`,
          },
          { label: "Configure" },
        ]}
        title="Enter authorization details"
        subtitle="Provide the necessary details to authorize the connector"
      />
      <DynamicForm
        config={{ fields: formSchema }}
        onSubmit={(values) => {
          handleFormSubmit(values);
        }}
        loading={false}
        hanldeBackButtonClick={handlePrevious}
      />
    </Flex>
  );
};
export default ConnectorConfiguration;
