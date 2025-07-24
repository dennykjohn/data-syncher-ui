import { Flex } from "@chakra-ui/react";

import { useNavigate } from "react-router";

import DataBricksIllustration from "@/assets/images/databricks.svg";
import SalesforceSandboxIllustration from "@/assets/images/salesforce-sandbox.svg";
import SalesForceIllustration from "@/assets/images/salesforce.svg";
import SnowFlakeIllustration from "@/assets/images/snowflake.svg";
import SourceCard from "@/components/shared/SourceCard";
import LoadingSpinner from "@/components/shared/Spinner";
import ClientRoutes from "@/constants/client-routes";
import useFetchMasterDestinationList from "@/queryOptions/destination/useFetchMasterDestinationList";

const DestinationList = () => {
  const {
    data: { content: destinationList },
    isLoading,
  } = useFetchMasterDestinationList();
  const navigate = useNavigate();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  const handleDestionationClick = () =>
    navigate(
      `${ClientRoutes.DASHBOARD}/${ClientRoutes.DESTINATION.ROOT}/${ClientRoutes.DESTINATION.CONFIGURE}`,
    );

  return (
    <Flex
      direction="column"
      alignItems={"center"}
      h="100%"
      justifyContent={"center"}
    >
      <Flex gap={8} wrap="wrap" justifyContent="center">
        {destinationList.map(({ dst_id, name }) => {
          let image;
          switch (name) {
            case "Snowflake":
              image = SnowFlakeIllustration;
              break;
            case "SalesforceSandbox":
              image = SalesforceSandboxIllustration;
              break;
            case "Salesforce":
              image = SalesForceIllustration;
              break;
            default:
              image = DataBricksIllustration;
          }
          return (
            <SourceCard
              key={dst_id}
              title={name}
              image={image}
              handleClick={handleDestionationClick}
            />
          );
        })}
      </Flex>
    </Flex>
  );
};

export default DestinationList;
