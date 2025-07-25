import { Flex, Image, Text } from "@chakra-ui/react";

import { VIEW_CONFIG } from "@/constants/view-config";

import LoadingSpinner from "./Spinner";

const SourceCard = ({
  title,
  image,
  handleClick,
  isLoading = false,
}: {
  title: string;
  image: string;
  handleClick: () => void;
  isLoading?: boolean;
}) => {
  return (
    <Flex
      direction="column"
      boxShadow={"sm"}
      p={6}
      borderRadius="md"
      alignItems="center"
      justifyContent={"center"}
      gap={VIEW_CONFIG.pageGap}
      w="3xs"
      flexWrap={"wrap"}
      cursor={isLoading ? "not-allowed" : "pointer"}
      _hover={!isLoading ? { boxShadow: "lg" } : {}}
      onClick={isLoading ? undefined : handleClick}
      position="relative"
      opacity={isLoading ? 0.6 : 1}
    >
      <Image src={image} alt={title} h="86px" />
      <Text fontSize="md" wordBreak={"break-word"} textAlign="center">
        {title}
      </Text>
      {isLoading && <LoadingSpinner />}
    </Flex>
  );
};
export default SourceCard;
