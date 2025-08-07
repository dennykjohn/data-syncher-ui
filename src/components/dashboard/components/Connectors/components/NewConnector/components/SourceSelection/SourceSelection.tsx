import { useState } from "react";

import { Flex, Input, InputGroup } from "@chakra-ui/react";

import { LuSearch } from "react-icons/lu";

import { getSourceImage } from "@/components/dashboard/utils/getImage";
import PageHeader from "@/components/dashboard/wrapper/PageHeader";
import SourceCard from "@/components/shared/SourceCard";
import LoadingSpinner from "@/components/shared/Spinner";
import ClientRoutes from "@/constants/client-routes";
import { VIEW_CONFIG } from "@/constants/view-config";
import useFetchMasterSourceList from "@/queryOptions/useFetchMasterSourceList";

const Source = ({
  selectedSource,
  onSourceSelect,
}: {
  selectedSource: string;
  onSourceSelect: (source: string) => void;
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const { data: sourceList, isLoading } = useFetchMasterSourceList();
  console.log("Sources:", sourceList);

  const filteredSourceList = sourceList?.filter(({ name }) =>
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
        title="Select source type"
        subtitle="Select your source type you want to create your connectors from"
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
            {filteredSourceList?.map(({ name, src_id }) => {
              return (
                <SourceCard
                  key={src_id}
                  title={name}
                  image={getSourceImage(name)}
                  handleClick={() => onSourceSelect(src_id.toString())}
                />
              );
            })}
          </Flex>
        )}
      </Flex>
    </Flex>
  );
};
export default Source;
