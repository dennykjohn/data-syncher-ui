import { useState } from "react";

import { Flex, Input, InputGroup } from "@chakra-ui/react";

import { LuSearch } from "react-icons/lu";

import { useNavigate } from "react-router";

import DataBricksIllustration from "@/assets/images/databricks.svg";
import SalesforceSandboxIllustration from "@/assets/images/salesforce-sandbox.svg";
import SalesForceIllustration from "@/assets/images/salesforce.svg";
import SnowFlakeIllustration from "@/assets/images/snowflake.svg";
import SourceCard from "@/components/shared/SourceCard";
import LoadingSpinner from "@/components/shared/Spinner";
import ClientRoutes from "@/constants/client-routes";
import { VIEW_CONFIG } from "@/constants/view-config";
import useFetchMasterDestinationList from "@/queryOptions/destination/useFetchMasterDestinationList";
import useSelectDestination from "@/queryOptions/destination/useSelectDestination";

const DestinationList = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDestinationId, setSelectedDestinationId] = useState<
    number | null
  >(null);

  const { data, isLoading: isFetchingDestinationsLoading } =
    useFetchMasterDestinationList();

  const {
    mutate: selectDestination,
    isPending: isSelectingDestinationPending,
  } = useSelectDestination();

  if (!data) {
    return <LoadingSpinner />;
  }
  const destinationList = data.content;

  if (isFetchingDestinationsLoading) {
    return <LoadingSpinner />;
  }

  const handleDestionationClick = ({ dst_id }: { dst_id: number }) => {
    // Prevent multiple clicks while a destination is being selected
    if (isSelectingDestinationPending) return;
    setSelectedDestinationId(dst_id);
    selectDestination(
      { destination: dst_id },
      {
        onSuccess: () => {
          navigate(
            `${ClientRoutes.DASHBOARD}/${ClientRoutes.DESTINATION.ROOT}/${ClientRoutes.DESTINATION.CONFIGURE}`,
            {
              state: {
                destinationId: dst_id,
                destinationName: destinationList.find(
                  (d) => d.dst_id === dst_id,
                )?.name,
              },
            },
          );
        },
      },
    );
  };

  const filteredDestinations = destinationList.filter(({ name }) =>
    name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <Flex
      direction="column"
      alignItems={"center"}
      h="100%"
      justifyContent={"center"}
      gap={VIEW_CONFIG.pageGap}
    >
      <InputGroup endElement={<LuSearch />} maxW="md">
        <Input
          placeholder="Search destination"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </InputGroup>
      <Flex gap={VIEW_CONFIG.pageGap} wrap="wrap" justifyContent="center">
        {filteredDestinations.map(({ dst_id, name }) => {
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
              handleClick={() => handleDestionationClick({ dst_id })}
              isLoading={
                selectedDestinationId === dst_id &&
                isSelectingDestinationPending
              }
            />
          );
        })}
      </Flex>
    </Flex>
  );
};

export default DestinationList;
