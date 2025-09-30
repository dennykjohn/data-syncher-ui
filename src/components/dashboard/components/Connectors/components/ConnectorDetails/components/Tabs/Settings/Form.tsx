import { Button, Flex } from "@chakra-ui/react";

import { CiTrash } from "react-icons/ci";
import { MdRefresh } from "react-icons/md";

const Form = () => {
  return (
    <Flex flexDirection="column" gap={4}>
      Form
      <Flex justifyContent={"space-between"}>
        <Flex>
          <Button variant="ghost" colorPalette="red" color={"red.500"}>
            <MdRefresh />
            Test connection
          </Button>
        </Flex>
        <Flex gap={4}>
          <Button variant="outline" colorPalette="red" color={"red.500"}>
            <CiTrash />
            Delete
          </Button>
          <Button colorPalette="brand">
            <MdRefresh />
            Update
          </Button>
        </Flex>
      </Flex>
    </Flex>
  );
};

export default Form;
