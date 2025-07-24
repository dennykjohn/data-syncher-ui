import { Flex, Image, Text } from "@chakra-ui/react";

const SourceCard = ({
  title,
  image,
  handleClick,
}: {
  title: string;
  image: string;
  handleClick: () => void;
}) => {
  return (
    <Flex
      direction="column"
      boxShadow={"sm"}
      p={6}
      borderRadius="md"
      alignItems="center"
      justifyContent={"center"}
      gap={6}
      w="3xs"
      flexWrap={"wrap"}
      cursor={"pointer"}
      _hover={{ boxShadow: "lg" }}
      onClick={handleClick}
    >
      <Image src={image} alt={title} h="86px" />
      <Text fontSize="md" wordBreak={"break-word"} textAlign="center">
        {title}
      </Text>
    </Flex>
  );
};
export default SourceCard;
