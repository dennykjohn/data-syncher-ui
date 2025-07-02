import { Flex, Input, InputGroup } from "@chakra-ui/react";

import { MdSearch } from "react-icons/md";

interface TableFilterProps {
  handleSearchInputChange?: (
    _event: React.ChangeEvent<HTMLInputElement>,
  ) => void;
  children?: React.ReactNode;
}

const TableFilter = ({
  handleSearchInputChange,
  children,
}: TableFilterProps) => {
  return (
    <Flex>
      <Flex>
        <InputGroup endElement={<MdSearch size={24} />}>
          <Input
            placeholder="Search"
            size="md"
            onChange={handleSearchInputChange}
          />
        </InputGroup>
      </Flex>
      <Flex>{children}</Flex>
    </Flex>
  );
};

export default TableFilter;
