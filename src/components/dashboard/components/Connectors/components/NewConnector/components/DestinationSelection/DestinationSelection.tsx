import { useState } from "react";

import { Flex, Input, InputGroup } from "@chakra-ui/react";

import { LuSearch } from "react-icons/lu";

import { getDestinationImage } from "@/components/dashboard/utils/getImage";
import PageHeader from "@/components/dashboard/wrapper/PageHeader";
import SourceCard from "@/components/shared/SourceCard";
import LoadingSpinner from "@/components/shared/Spinner";
import ClientRoutes from "@/constants/client-routes";
import { VIEW_CONFIG } from "@/constants/view-config";
import useFetchAllUserCreatedDestinationList from "@/queryOptions/destination/useFetchAllUserCreatedDestinationList";

const Destination = ({
  selectedDestination,
  onDestinationSelect,
}: {
  selectedDestination: number | null;
  onDestinationSelect: (_destination: number) => void;
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const { data: destinationList, isLoading } =
    useFetchAllUserCreatedDestinationList();
  console.log("Destinations:", destinationList, selectedDestination);

  const filteredDestinations = destinationList?.filter(({ name }) =>
    name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

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
        title="Select destination type"
        subtitle="Select an existing destination or add a new one"
      />
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
        {isLoading && <LoadingSpinner />}
        {!isLoading && (
          <Flex gap={VIEW_CONFIG.pageGap} wrap="wrap" justifyContent="center">
            {filteredDestinations?.map(({ dst, name, dst_config_id }) => {
              const isSelected = dst_config_id === selectedDestination;
              return (
                <SourceCard
                  key={dst_config_id}
                  title={name}
                  image={getDestinationImage(dst)}
                  isSelected={isSelected}
                  handleClick={() => onDestinationSelect(dst_config_id)}
                />
              );
            })}
          </Flex>
        )}
      </Flex>
    </Flex>
  );
};
export default Destination;
