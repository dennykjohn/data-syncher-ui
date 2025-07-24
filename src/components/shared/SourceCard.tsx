import { Flex, Image, Text } from "@chakra-ui/react";

const SourceCard = ({ title, image }: { title: string; image: string }) => {
  return (
    <Flex
      direction="column"
      boxShadow={"sm"}
      p={6}
      borderRadius="md"
      alignItems="center"
      justifyContent={"center"}
      gap={6}
      minW={"208px"}
      maxW="208px"
      flexWrap={"wrap"}
      cursor={"pointer"}
      _hover={{ boxShadow: "lg" }}
    >
      <Image src={image} alt={title} h="86px" />
      <Text fontSize="md" wordBreak={"break-word"} textAlign="center">
        {title}
      </Text>
    </Flex>
  );
};
export default SourceCard;
