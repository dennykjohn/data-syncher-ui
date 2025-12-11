import { forwardRef, useEffect, useImperativeHandle, useState } from "react";

import { Box, Flex, Text } from "@chakra-ui/react";

import { CiTrash } from "react-icons/ci";

import { useOutletContext } from "react-router";

import { toaster } from "@/components/ui/toaster";
import ServerRoutes from "@/constants/server-routes";
import AxiosInstance from "@/lib/axios/api-client";
import { type ReverseSchemaResponse } from "@/queryOptions/connector/reverseSchema/useFetchReverseSchema";
import { type Connector } from "@/types/connectors";
import { type TableMapping, type TableMappingDTO } from "@/types/mappings";

import { validateTableToTableMapping } from "../../utils/validation";

export interface MappedRef {
  handleDrop: (_sourceTable: string, _destinationTable: string) => void;
  hasMapping: (_sourceTable: string, _destinationTable: string) => boolean;
  getMappings: () => TableMapping[];
}

interface MappedProps {
  reverseSchemaData: ReverseSchemaResponse | null;
}

const normalizeMappings = (raw: unknown): TableMapping[] => {
  const list =
    (Array.isArray((raw as { mappings?: TableMappingDTO[] })?.mappings)
      ? (raw as { mappings: TableMappingDTO[] }).mappings
      : Array.isArray(raw)
        ? (raw as TableMappingDTO[])
        : Array.isArray((raw as { data?: TableMappingDTO[] })?.data)
          ? (raw as { data: TableMappingDTO[] }).data
          : []) ?? [];

  return list
    .map((item) => {
      const sourceTable =
        item.source_table ?? (item as { sourceTable?: string }).sourceTable;
      const destinationTable =
        item.destination_table ??
        (item as { destinationTable?: string }).destinationTable;
      if (!sourceTable || !destinationTable) return null;
      return { sourceTable, destinationTable, status: item.status };
    })
    .filter(Boolean) as TableMapping[];
};

const Mapped = forwardRef<MappedRef, MappedProps>((props, ref) => {
  const { reverseSchemaData } = props;
  const context = useOutletContext<Connector>();
  const [mappings, setMappings] = useState<TableMapping[]>([]);

  useEffect(() => {
    const fetchMappings = async () => {
      try {
        const { data } = await AxiosInstance.get(
          ServerRoutes.connector.fetchConnectionMappings(context.connection_id),
        );
        const normalized = normalizeMappings(data);
        setMappings(normalized);
      } catch {
        // Error handled silently
      }
    };

    fetchMappings();
  }, [context.connection_id]);

  // Save mappings
  const saveMappings = async (
    updated: TableMapping[],
    onSuccess?: () => void,
  ) => {
    try {
      await AxiosInstance.post(
        ServerRoutes.connector.saveConnectionMappings(),
        {
          connection_id: context.connection_id,
          mappings: updated.map((m) => ({
            source: m.sourceTable,
            destination: m.destinationTable,
          })),
        },
      );

      setMappings(updated);
      onSuccess?.();
    } catch {
      // Error handled silently
    }
  };

  // Handle drop action
  const handleDrop = (sourceTable: string, destinationTable: string) => {
    if (!sourceTable || sourceTable.trim() === "") {
      toaster.error({
        title: "Error",
        description: "Please drag a source table first.",
      });
      return;
    }

    const existingMapping = mappings.find(
      (m) =>
        m.sourceTable === sourceTable &&
        m.destinationTable === destinationTable,
    );
    if (existingMapping) {
      toaster.warning({
        title: "Mapping Already Exists",
        description: "This mapping already exists.",
      });
      return;
    }

    // Validate table mapping
    if (reverseSchemaData) {
      const sourceTableData = reverseSchemaData.source_tables?.find(
        (t) => t.table === sourceTable,
      );
      const destinationTableData = reverseSchemaData.destination_tables?.find(
        (t) => t.table === destinationTable,
      );

      if (sourceTableData && destinationTableData) {
        const validation = validateTableToTableMapping(
          sourceTableData,
          destinationTableData,
        );

        if (!validation.isValid) {
          toaster.error({
            title: validation.error?.title || "Validation Failed",
            description:
              validation.error?.description ||
              "The mapping is not valid. Please check the table structures.",
          });
          return;
        }
      }
    }

    const newMapping: TableMapping = {
      sourceTable,
      destinationTable,
    };

    const updatedMappings = [...mappings, newMapping];
    saveMappings(updatedMappings, () => {
      toaster.success({
        title: "Mapping Saved",
        description: `The mapping "${sourceTable} → ${destinationTable}" has been saved successfully.`,
      });
    });
  };

  // Check if mapping exists
  const hasMapping = (sourceTable: string, destinationTable: string) => {
    return mappings.some(
      (m) =>
        m.sourceTable === sourceTable &&
        m.destinationTable === destinationTable,
    );
  };

  // Get current mappings
  const getMappings = () => mappings;

  // Expose methods to parent via ref
  useImperativeHandle(ref, () => ({
    handleDrop,
    hasMapping,
    getMappings,
  }));

  // Handle remove mapping
  const handleRemoveMapping = (mappingToRemove: TableMapping) => {
    const updatedMappings = mappings.filter(
      (m) =>
        !(
          m.sourceTable === mappingToRemove.sourceTable &&
          m.destinationTable === mappingToRemove.destinationTable
        ),
    );

    saveMappings(updatedMappings, () => {
      toaster.warning({
        title: "Mapping Deleted",
        description: `The mapping "${mappingToRemove.sourceTable} → ${mappingToRemove.destinationTable}" has been deleted.`,
      });
    });
  };

  const safeMappings = mappings || [];

  return (
    <Flex
      direction="column"
      gap={2}
      borderWidth={1}
      borderColor="gray.300"
      borderRadius="lg"
      padding={4}
      bgColor="white"
      w="100%"
      maxW="100%"
      overflow="hidden"
    >
      <Text fontSize="sm" fontWeight="semibold" mb={4}>
        Mapped Tables
      </Text>

      {safeMappings.length === 0 ? (
        <Flex
          direction="column"
          alignItems="center"
          justifyContent="center"
          p={8}
        >
          <Text fontSize="sm" color="gray.500">
            No mappings yet. Drag and drop tables to create mappings.
          </Text>
        </Flex>
      ) : (
        safeMappings.map((mapping, index) => (
          <Flex
            key={`${mapping.sourceTable}-${mapping.destinationTable}-${index}`}
            direction="row"
            gap={2}
            alignItems="center"
            p={2}
            bgColor="gray.50"
            borderRadius="sm"
            justifyContent="space-between"
          >
            <Text fontSize="sm" color="gray.700" flex={1}>
              {mapping.sourceTable} → {mapping.destinationTable}
            </Text>
            <Box
              as="button"
              onClick={() => handleRemoveMapping(mapping)}
              cursor="pointer"
              color="red.500"
              _hover={{ color: "red.700" }}
              p={1}
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <CiTrash size={18} />
            </Box>
          </Flex>
        ))
      )}
    </Flex>
  );
});

Mapped.displayName = "Mapped";

export default Mapped;
