import { useEffect, useState } from "react";

import {
  Box,
  ButtonGroup,
  Table as ChakraTable,
  Flex,
  IconButton,
  Pagination,
  Spinner,
  Stack,
} from "@chakra-ui/react";

import { LuChevronLeft, LuChevronRight } from "react-icons/lu";

type RenderFunction<T> = (_value: T[keyof T], _row: T) => React.ReactNode;

type Column<T> = {
  header: string;
  accessor: keyof T | "actions" | "index";
  render?: RenderFunction<T>;
  hideOnMobile?: boolean;
};

type TableProps<T> = {
  data: T[];
  columns: Column<T>[];
  pageSize?: number;
  totalNumberOfPages: number;
  updateCurrentPage: (_currentPage: number) => void;
  isLoading?: boolean;
};

const Table = <T,>({
  data,
  columns,
  totalNumberOfPages,
  updateCurrentPage,
  isLoading = false,
}: TableProps<T>) => {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = totalNumberOfPages;

  useEffect(() => {
    updateCurrentPage(currentPage);
  }, [updateCurrentPage, currentPage]);

  return (
    <Stack w="100%">
      <ChakraTable.ScrollArea
        w="100%"
        h="100%"
        borderWidth="1px"
        borderColor="gray.200"
        rounded="md"
      >
        <ChakraTable.Root
          interactive
          size="sm"
          variant="outline"
          striped
          colorPalette="gray"
        >
          {isLoading && (
            <Box
              position="absolute"
              top="0"
              left="0"
              width="100%"
              height="100%"
              display="flex"
              justifyContent="center"
              alignItems="center"
              backgroundColor="rgba(255, 255, 255, 0.8)"
              zIndex="1"
            >
              <Spinner size="xl" />
            </Box>
          )}
          <ChakraTable.Header h={12} bg="white">
            <ChakraTable.Row>
              {columns.map((column) => (
                <ChakraTable.ColumnHeader
                  key={String(column.accessor)}
                  display={{
                    base: column.hideOnMobile ? "none" : "table-cell",
                    md: "table-cell",
                  }}
                >
                  {column.header}
                </ChakraTable.ColumnHeader>
              ))}
            </ChakraTable.Row>
          </ChakraTable.Header>
          <ChakraTable.Body>
            {data.map((item, index) => (
              <ChakraTable.Row key={index} h={12}>
                {columns.map((column) => (
                  <ChakraTable.Cell
                    key={String(column.accessor)}
                    display={{
                      base: column.hideOnMobile ? "none" : "table-cell",
                      md: "table-cell",
                    }}
                  >
                    {column.render
                      ? column.render(item[column.accessor as keyof T], item)
                      : String(item[column.accessor as keyof T])}
                  </ChakraTable.Cell>
                ))}
              </ChakraTable.Row>
            ))}
          </ChakraTable.Body>
        </ChakraTable.Root>
      </ChakraTable.ScrollArea>
      <Flex justifyContent={"flex-end"} mt={4}>
        <Pagination.Root
          count={totalPages}
          pageSize={5}
          page={currentPage}
          onPageChange={(e) => setCurrentPage(e.page)}
        >
          <ButtonGroup variant="ghost" size="sm" wrap="wrap">
            <Pagination.PrevTrigger asChild>
              <IconButton>
                <LuChevronLeft /> Previous
              </IconButton>
            </Pagination.PrevTrigger>
            <Pagination.Items
              render={(page) => (
                <IconButton variant={{ base: "ghost", _selected: "outline" }}>
                  {page.value}
                </IconButton>
              )}
            />
            <Pagination.NextTrigger asChild>
              <IconButton>
                Next <LuChevronRight />
              </IconButton>
            </Pagination.NextTrigger>
          </ButtonGroup>
        </Pagination.Root>
      </Flex>
    </Stack>
  );
};

export { Table as default, type Column };
