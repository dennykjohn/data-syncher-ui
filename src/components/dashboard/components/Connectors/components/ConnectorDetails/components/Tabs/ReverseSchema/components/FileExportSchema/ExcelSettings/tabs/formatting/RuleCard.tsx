import { useCallback, useMemo } from "react";

import {
  Box,
  Checkbox,
  Field,
  Flex,
  Grid,
  HStack,
  IconButton,
  NativeSelect,
  Text,
  VStack,
} from "@chakra-ui/react";

import { IoMdTrash } from "react-icons/io";

import {
  getRenameInfoForSource,
  isGeneratedColumn,
} from "../../../helpers/targetFieldUtils";
import { MultiColumnSelect } from "../../components/MultiColumnSelect";
import RuleStyleEditor from "../../components/RuleStyleEditor";
import {
  type RuleCardProps,
  getColumnDataType,
  isRuleTypeAllowed,
  normalizeRuleType,
} from "../../helpers";
import RuleTypeConfig from "./RuleTypeConfig";

export default function RuleCard({
  rule,
  index,
  colNames,
  tableFields,
  targetFields,
  onUpdateRule,
  onUpdateRuleStyle,
  onDeleteRule,
}: RuleCardProps) {
  const ruleStyle = rule.style || {};
  const typeNorm = normalizeRuleType(rule.type);
  const columnLabelsMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const col of colNames) {
      const meta = targetFields?.[col];
      if (meta && isGeneratedColumn(meta)) {
        map[col] = col;
      } else {
        const renameInfo = getRenameInfoForSource(col, targetFields);
        if (renameInfo.isRenamed) {
          map[col] = renameInfo.targetName;
        } else {
          map[col] = col;
        }
      }
    }
    if (targetFields) {
      for (const [targetName, meta] of Object.entries(targetFields)) {
        if (meta.source_name && meta.source_name !== targetName) {
          map[targetName] = targetName;
        } else {
          map[targetName] = targetName;
        }
      }
    }
    return map;
  }, [colNames, targetFields]);

  const resolveColOptionValue = useCallback(
    (name?: string | null): string => {
      if (!name) return "";
      if (colNames.includes(name)) return name;
      const caseMatch = colNames.find(
        (c) => c.toLowerCase() === name.toLowerCase(),
      );
      if (caseMatch) return caseMatch;

      if (targetFields) {
        // If name is a target name (e.g. TOTAL), see if its source_name (TOTAL_AMOUNT) is in colNames
        const meta = targetFields[name];
        if (meta?.source_name) {
          const match = colNames.find(
            (c) => c.toLowerCase() === meta.source_name!.toLowerCase(),
          );
          if (match) return match;
        }

        // If name is a source name (TOTAL_AMOUNT), see if its targetName (TOTAL) is in colNames
        for (const [targetName, tMeta] of Object.entries(targetFields)) {
          if (
            tMeta.source_name &&
            tMeta.source_name.toLowerCase() === name.toLowerCase()
          ) {
            const match = colNames.find(
              (c) => c.toLowerCase() === targetName.toLowerCase(),
            );
            if (match) return match;
          }
        }
      }
      return name;
    },
    [colNames, targetFields],
  );

  const resolveSourceColName = useCallback(
    (name: string): string => {
      if (!name || !targetFields) return name;
      const meta = targetFields[name];
      if (meta?.source_name) {
        return meta.source_name;
      }
      return name;
    },
    [targetFields],
  );

  const evalCol = resolveSourceColName(
    rule.condition_column_name || rule.column_name || "",
  );
  const rawType = tableFields[evalCol] || "";
  const colDataType = getColumnDataType(rawType);

  const getColLabel = useCallback(
    (col: string) => columnLabelsMap[col] || col,
    [columnLabelsMap],
  );

  const isStylingInternally = ["colorscale", "databar", "iconset"].includes(
    typeNorm,
  );

  const renderRuleTypeField = () => (
    <Field.Root gap={0}>
      <Field.Label
        fontSize="xs"
        fontWeight="semibold"
        color="gray.600"
        mb={0.5}
      >
        Rule Type
      </Field.Label>
      <NativeSelect.Root size="xs">
        <NativeSelect.Field
          bg="white"
          h="28px"
          value={typeNorm}
          onChange={(e) =>
            onUpdateRule(index, {
              type: e.target.value,
            })
          }
        >
          {isRuleTypeAllowed("cellis", colDataType) && (
            <option value="cellis">By Single Field</option>
          )}
          <option value="multipleconditions">By Multiple Fields</option>
          {isRuleTypeAllowed("containstext", colDataType) && (
            <option value="containstext">Contains Text</option>
          )}
          {isRuleTypeAllowed("notcontainstext", colDataType) && (
            <option value="notcontainstext">Does Not Contain Text</option>
          )}
          {isRuleTypeAllowed("beginswith", colDataType) && (
            <option value="beginswith">Begins With</option>
          )}
          {isRuleTypeAllowed("endswith", colDataType) && (
            <option value="endswith">Ends With</option>
          )}
          {isRuleTypeAllowed("duplicaterecords", colDataType) && (
            <option value="duplicaterecords">Duplicate Values</option>
          )}
          {isRuleTypeAllowed("uniquerecords", colDataType) && (
            <option value="uniquerecords">Unique Values</option>
          )}
          {isRuleTypeAllowed("aboveaverage", colDataType) && (
            <option value="aboveaverage">Above/Below Average</option>
          )}
          {isRuleTypeAllowed("top10", colDataType) && (
            <option value="top10">Top/Bottom 10</option>
          )}
          {isRuleTypeAllowed("formula", colDataType) && (
            <option value="formula">Custom Formula</option>
          )}
          {isRuleTypeAllowed("colorscale", colDataType) && (
            <option value="colorscale">Color Scale</option>
          )}
          {isRuleTypeAllowed("databar", colDataType) && (
            <option value="databar">Data Bar</option>
          )}
          {isRuleTypeAllowed("iconset", colDataType) && (
            <option value="iconset">Icon Set</option>
          )}
        </NativeSelect.Field>
        <NativeSelect.Indicator />
      </NativeSelect.Root>
    </Field.Root>
  );

  const selectedCols = useMemo(() => {
    const raw =
      rule.target_columns && rule.target_columns.length > 0
        ? rule.target_columns
        : rule.column_name
          ? rule.column_name
              .split(",")
              .map((s: string) => s.trim())
              .filter(Boolean)
          : [];
    return raw.map((c: string) => resolveColOptionValue(c));
  }, [rule.target_columns, rule.column_name, resolveColOptionValue]);

  const isScopeSelectedColumns = rule.highlight_scope !== "entire_row";

  return (
    <Box
      id={`excel-rule-${index}`}
      p={2}
      bg="white"
      border="1px solid"
      borderColor="gray.200"
      borderRadius="md"
      shadow="xs"
    >
      {/* Header Row */}
      <Flex
        justifyContent="space-between"
        alignItems="center"
        mb={1.5}
        pb={1}
        borderBottom="1px solid"
        borderColor="gray.100"
      >
        <Text fontSize="xs" fontWeight="bold" color="brand.600">
          Rule #{index + 1}
        </Text>
        <IconButton
          aria-label="Delete Rule"
          size="xs"
          variant="ghost"
          colorPalette="red"
          onClick={(e) => onDeleteRule(e, index)}
        >
          <IoMdTrash />
        </IconButton>
      </Flex>

      <Grid
        templateColumns={{
          base: "1fr",
          md: "minmax(0, 1fr) minmax(0, 1fr)",
        }}
        gap={3}
      >
        {/* Left: Criteria */}
        <VStack align="stretch" gap={1.5} minW="0" w="100%">
          {typeNorm === "multipleconditions" ? (
            <Grid templateColumns="1fr" gap={2} alignItems="end">
              {renderRuleTypeField()}
            </Grid>
          ) : (
            <VStack align="stretch" gap={1}>
              {rule.condition_column_name ? (
                <>
                  <Grid templateColumns="1fr" gap={2} alignItems="end">
                    {renderRuleTypeField()}
                  </Grid>
                  <Grid
                    templateColumns="repeat(2, 1fr)"
                    gap={2}
                    alignItems="end"
                  >
                    <Field.Root gap={0}>
                      <Field.Label
                        fontSize="xs"
                        fontWeight="semibold"
                        color="gray.600"
                        mb={0.5}
                      >
                        Condition Column (Evaluate)
                      </Field.Label>
                      <NativeSelect.Root size="xs">
                        <NativeSelect.Field
                          bg="white"
                          h="28px"
                          value={resolveColOptionValue(
                            rule.condition_column_name,
                          )}
                          onChange={(e) =>
                            onUpdateRule(index, {
                              condition_column_name:
                                resolveSourceColName(e.target.value) ||
                                undefined,
                            })
                          }
                        >
                          <option value="">
                            -- Select Condition Column --
                          </option>
                          {colNames.map((col: string) => (
                            <option key={col} value={col}>
                              {getColLabel(col)}
                            </option>
                          ))}
                        </NativeSelect.Field>
                        <NativeSelect.Indicator />
                      </NativeSelect.Root>
                    </Field.Root>

                    <Field.Root gap={0}>
                      <Field.Label
                        fontSize="xs"
                        fontWeight="semibold"
                        color="gray.600"
                        mb={0.5}
                      >
                        Apply Highlight To
                      </Field.Label>
                      <HStack gap={3} h="28px" align="center">
                        {/* Chosen Columns Option */}
                        <Flex
                          align="center"
                          gap={1.5}
                          cursor="pointer"
                          userSelect="none"
                          onClick={() =>
                            onUpdateRule(index, {
                              highlight_scope: "selected_columns",
                              target_columns:
                                selectedCols.length > 0
                                  ? selectedCols
                                  : colNames[0]
                                    ? [colNames[0]]
                                    : [],
                              column_name: (selectedCols.length > 0
                                ? selectedCols
                                : colNames[0]
                                  ? [colNames[0]]
                                  : []
                              ).join(","),
                            })
                          }
                        >
                          <Box
                            w="13px"
                            h="13px"
                            borderRadius="full"
                            border="1.5px solid"
                            borderColor={
                              isScopeSelectedColumns ? "brand.500" : "gray.300"
                            }
                            bg="white"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                          >
                            {isScopeSelectedColumns && (
                              <Box
                                w="5px"
                                h="5px"
                                borderRadius="full"
                                bg="brand.500"
                              />
                            )}
                          </Box>
                          <Text
                            fontSize="xs"
                            color="gray.700"
                            fontWeight="medium"
                            whiteSpace="nowrap"
                          >
                            Chosen Columns
                          </Text>
                        </Flex>

                        {/* Entire Row Option */}
                        <Flex
                          align="center"
                          gap={1.5}
                          cursor="pointer"
                          userSelect="none"
                          onClick={() =>
                            onUpdateRule(index, {
                              highlight_scope: "entire_row",
                            })
                          }
                        >
                          <Box
                            w="13px"
                            h="13px"
                            borderRadius="full"
                            border="1.5px solid"
                            borderColor={
                              !isScopeSelectedColumns ? "brand.500" : "gray.300"
                            }
                            bg="white"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                          >
                            {!isScopeSelectedColumns && (
                              <Box
                                w="5px"
                                h="5px"
                                borderRadius="full"
                                bg="brand.500"
                              />
                            )}
                          </Box>
                          <Text
                            fontSize="xs"
                            color="gray.700"
                            fontWeight="medium"
                            whiteSpace="nowrap"
                          >
                            Entire Row
                          </Text>
                        </Flex>
                      </HStack>
                    </Field.Root>
                  </Grid>

                  {/* Show Target Column(s) picker only when Chosen Columns is selected */}
                  {isScopeSelectedColumns && (
                    <Field.Root gap={0}>
                      <Field.Label
                        fontSize="xs"
                        fontWeight="semibold"
                        color="gray.600"
                        mb={0.5}
                      >
                        Target Column(s) (Style)
                      </Field.Label>
                      <MultiColumnSelect
                        allColumns={colNames}
                        selectedColumns={selectedCols}
                        columnLabels={columnLabelsMap}
                        placeholder="Select Target Column(s)"
                        onChange={(newCols: string[]) =>
                          onUpdateRule(index, {
                            target_columns: newCols.map((c) =>
                              resolveSourceColName(c),
                            ),
                            column_name: newCols
                              .map((c) => resolveSourceColName(c))
                              .join(","),
                            range: undefined,
                          })
                        }
                      />
                    </Field.Root>
                  )}
                </>
              ) : (
                <Grid templateColumns="repeat(2, 1fr)" gap={2} alignItems="end">
                  {renderRuleTypeField()}
                  <Field.Root gap={0}>
                    <Field.Label
                      fontSize="xs"
                      fontWeight="semibold"
                      color="gray.600"
                      mb={0.5}
                    >
                      Column Name
                    </Field.Label>
                    <NativeSelect.Root size="xs">
                      <NativeSelect.Field
                        bg="white"
                        h="28px"
                        value={resolveColOptionValue(rule.column_name)}
                        onChange={(e) =>
                          onUpdateRule(index, {
                            column_name: resolveSourceColName(e.target.value),
                            target_columns: undefined,
                            range: undefined,
                          })
                        }
                      >
                        <option value="">-- Select Column --</option>
                        {colNames.map((col: string) => (
                          <option key={col} value={col}>
                            {getColLabel(col)}
                          </option>
                        ))}
                      </NativeSelect.Field>
                      <NativeSelect.Indicator />
                    </NativeSelect.Root>
                  </Field.Root>
                </Grid>
              )}

              <Checkbox.Root
                size="xs"
                colorPalette="brand"
                checked={!!rule.condition_column_name}
                onCheckedChange={(details) => {
                  if (!details.checked) {
                    onUpdateRule(index, {
                      condition_column_name: undefined,
                      highlight_scope: "cell",
                      column_name:
                        (rule.target_columns && rule.target_columns[0]) ||
                        rule.column_name ||
                        colNames[0] ||
                        "",
                    });
                  } else {
                    const currentCols =
                      rule.target_columns && rule.target_columns.length > 0
                        ? rule.target_columns
                        : rule.column_name
                          ? [rule.column_name]
                          : colNames[0]
                            ? [colNames[0]]
                            : [];
                    onUpdateRule(index, {
                      condition_column_name:
                        rule.column_name || colNames[0] || "",
                      target_columns: currentCols,
                      column_name: currentCols.join(","),
                      highlight_scope:
                        rule.highlight_scope === "entire_row"
                          ? "entire_row"
                          : "selected_columns",
                    });
                  }
                }}
                mt={0.5}
              >
                <Checkbox.HiddenInput />
                <Checkbox.Control />
                <Checkbox.Label fontSize="10px" color="gray.600">
                  Evaluate condition based on a different column
                </Checkbox.Label>
              </Checkbox.Root>
            </VStack>
          )}

          {/* Specific rule parameters */}
          <RuleTypeConfig
            rule={rule}
            typeNorm={typeNorm}
            colDataType={colDataType}
            colNames={colNames}
            tableFields={tableFields}
            columnLabels={columnLabelsMap}
            onUpdateRule={(patch) => onUpdateRule(index, patch)}
          />
        </VStack>

        {/* Right: Style / Format to Apply */}
        <Box minW="0" w="100%">
          {!isStylingInternally ? (
            <RuleStyleEditor
              rule={rule}
              ruleStyle={ruleStyle}
              onUpdateRule={(patch) => onUpdateRule(index, patch)}
              onUpdateRuleStyle={(patch) => onUpdateRuleStyle(index, patch)}
            />
          ) : (
            <VStack
              align="stretch"
              justify="center"
              h="100%"
              pl={{ base: 0, md: 5 }}
              borderLeft={{ base: "none", md: "1px solid" }}
              borderColor="gray.200"
              gap={2.5}
            >
              <Text fontSize="xs" fontWeight="semibold" color="gray.600">
                Visual Scale Preview
              </Text>

              {typeNorm === "databar" && (
                <Box
                  p={2.5}
                  borderWidth={1}
                  borderColor="gray.200"
                  borderRadius="md"
                  bg="white"
                >
                  <Text fontSize="2xs" color="gray.500" mb={1.5}>
                    Sample Cell (
                    {rule.show_value !== false ? "Bar + Value" : "Bar Only"})
                  </Text>
                  <Box
                    position="relative"
                    h="26px"
                    borderWidth={1}
                    borderColor="gray.300"
                    borderRadius="sm"
                    overflow="hidden"
                    bg="gray.50"
                  >
                    <Box
                      position="absolute"
                      left={0}
                      top={0}
                      bottom={0}
                      w="65%"
                      bg={`#${(rule.color || "638EC6").replace(/^#/, "")}`}
                      opacity={0.85}
                    />
                    {rule.show_value !== false ? (
                      <Flex
                        position="relative"
                        h="100%"
                        px={2}
                        align="center"
                        justify="flex-end"
                        fontSize="xs"
                        fontWeight="semibold"
                        color="gray.800"
                      >
                        65.00
                      </Flex>
                    ) : null}
                  </Box>
                  <Text
                    fontSize="2xs"
                    color="gray.400"
                    mt={1}
                    fontStyle="italic"
                  >
                    {rule.show_value !== false
                      ? "Value displayed over bar."
                      : "Value is hidden in Excel; bar only is displayed."}
                  </Text>
                </Box>
              )}

              {typeNorm === "iconset" && (
                <Box
                  p={2.5}
                  borderWidth={1}
                  borderColor="gray.200"
                  borderRadius="md"
                  bg="white"
                >
                  <Text fontSize="2xs" color="gray.500" mb={1.5}>
                    Sample Cell (
                    {rule.show_value !== false ? "Icon + Value" : "Icon Only"})
                  </Text>
                  <Flex
                    h="26px"
                    borderWidth={1}
                    borderColor="gray.300"
                    borderRadius="sm"
                    px={2}
                    align="center"
                    gap={2}
                    bg="white"
                  >
                    <Box
                      w="10px"
                      h="10px"
                      borderRadius="full"
                      bg="green.500"
                      flexShrink={0}
                    />
                    {rule.show_value !== false ? (
                      <Text
                        fontSize="xs"
                        fontWeight="semibold"
                        color="gray.800"
                      >
                        120.00
                      </Text>
                    ) : (
                      <Text fontSize="2xs" color="gray.400" fontStyle="italic">
                        (value hidden)
                      </Text>
                    )}
                  </Flex>
                  <Text
                    fontSize="2xs"
                    color="gray.400"
                    mt={1}
                    fontStyle="italic"
                  >
                    {rule.show_value !== false
                      ? "Value displayed beside icon."
                      : "Value is hidden in Excel; icon only is displayed."}
                  </Text>
                </Box>
              )}

              {typeNorm === "colorscale" && (
                <Box
                  p={2.5}
                  borderWidth={1}
                  borderColor="gray.200"
                  borderRadius="md"
                  bg="white"
                >
                  <Text fontSize="2xs" color="gray.500" mb={1.5}>
                    Color Scale Gradient
                  </Text>
                  <Flex
                    h="22px"
                    borderRadius="sm"
                    overflow="hidden"
                    borderWidth={1}
                    borderColor="gray.300"
                  >
                    <Flex
                      flex={1}
                      bg={
                        rule.colors?.[0]
                          ? `#${rule.colors[0].replace(/^#/, "")}`
                          : "#F8696B"
                      }
                      align="center"
                      justify="center"
                      fontSize="2xs"
                      color="white"
                      fontWeight="bold"
                    >
                      Min
                    </Flex>
                    {rule.colors?.length === 3 && (
                      <Flex
                        flex={1}
                        bg={`#${rule.colors[1].replace(/^#/, "")}`}
                        align="center"
                        justify="center"
                        fontSize="2xs"
                        color="gray.800"
                        fontWeight="bold"
                      >
                        Mid
                      </Flex>
                    )}
                    <Flex
                      flex={1}
                      bg={
                        rule.colors?.[rule.colors.length - 1]
                          ? `#${rule.colors[rule.colors.length - 1].replace(/^#/, "")}`
                          : "#63BE7B"
                      }
                      align="center"
                      justify="center"
                      fontSize="2xs"
                      color="white"
                      fontWeight="bold"
                    >
                      Max
                    </Flex>
                  </Flex>
                </Box>
              )}

              <Text fontSize="xs" fontWeight="semibold" color="gray.600">
                Visual Scale Preview
              </Text>

              {typeNorm === "databar" && (
                <Box
                  p={2.5}
                  borderWidth={1}
                  borderColor="gray.200"
                  borderRadius="md"
                  bg="white"
                >
                  <Text fontSize="2xs" color="gray.500" mb={1.5}>
                    Sample Cell (
                    {rule.show_value !== false ? "Bar + Value" : "Bar Only"})
                  </Text>
                  <Box
                    position="relative"
                    h="26px"
                    borderWidth={1}
                    borderColor="gray.300"
                    borderRadius="sm"
                    overflow="hidden"
                    bg="gray.50"
                  >
                    <Box
                      position="absolute"
                      left={0}
                      top={0}
                      bottom={0}
                      w="65%"
                      bg={`#${(rule.color || "638EC6").replace(/^#/, "")}`}
                      opacity={0.85}
                    />
                    {rule.show_value !== false ? (
                      <Flex
                        position="relative"
                        h="100%"
                        px={2}
                        align="center"
                        justify="flex-end"
                        fontSize="xs"
                        fontWeight="semibold"
                        color="gray.800"
                      >
                        65.00
                      </Flex>
                    ) : null}
                  </Box>
                  <Text
                    fontSize="2xs"
                    color="gray.400"
                    mt={1}
                    fontStyle="italic"
                  >
                    {rule.show_value !== false
                      ? "Value displayed over bar."
                      : "Value is hidden in Excel; bar only is displayed."}
                  </Text>
                </Box>
              )}

              {typeNorm === "iconset" && (
                <Box
                  p={2.5}
                  borderWidth={1}
                  borderColor="gray.200"
                  borderRadius="md"
                  bg="white"
                >
                  <Text fontSize="2xs" color="gray.500" mb={1.5}>
                    Sample Cell (
                    {rule.show_value !== false ? "Icon + Value" : "Icon Only"})
                  </Text>
                  <Flex
                    h="26px"
                    borderWidth={1}
                    borderColor="gray.300"
                    borderRadius="sm"
                    px={2}
                    align="center"
                    gap={2}
                    bg="white"
                  >
                    <Box
                      w="10px"
                      h="10px"
                      borderRadius="full"
                      bg="green.500"
                      flexShrink={0}
                    />
                    {rule.show_value !== false ? (
                      <Text
                        fontSize="xs"
                        fontWeight="semibold"
                        color="gray.800"
                      >
                        120.00
                      </Text>
                    ) : (
                      <Text fontSize="2xs" color="gray.400" fontStyle="italic">
                        (value hidden)
                      </Text>
                    )}
                  </Flex>
                  <Text
                    fontSize="2xs"
                    color="gray.400"
                    mt={1}
                    fontStyle="italic"
                  >
                    {rule.show_value !== false
                      ? "Value displayed beside icon."
                      : "Value is hidden in Excel; icon only is displayed."}
                  </Text>
                </Box>
              )}

              {typeNorm === "colorscale" && (
                <Box
                  p={2.5}
                  borderWidth={1}
                  borderColor="gray.200"
                  borderRadius="md"
                  bg="white"
                >
                  <Text fontSize="2xs" color="gray.500" mb={1.5}>
                    Color Scale Gradient
                  </Text>
                  <Flex
                    h="22px"
                    borderRadius="sm"
                    overflow="hidden"
                    borderWidth={1}
                    borderColor="gray.300"
                  >
                    <Flex
                      flex={1}
                      bg={
                        rule.colors?.[0]
                          ? `#${rule.colors[0].replace(/^#/, "")}`
                          : "#F8696B"
                      }
                      align="center"
                      justify="center"
                      fontSize="2xs"
                      color="white"
                      fontWeight="bold"
                    >
                      Min
                    </Flex>
                    {rule.colors?.length === 3 && (
                      <Flex
                        flex={1}
                        bg={`#${rule.colors[1].replace(/^#/, "")}`}
                        align="center"
                        justify="center"
                        fontSize="2xs"
                        color="gray.800"
                        fontWeight="bold"
                      >
                        Mid
                      </Flex>
                    )}
                    <Flex
                      flex={1}
                      bg={
                        rule.colors?.[rule.colors.length - 1]
                          ? `#${rule.colors[rule.colors.length - 1].replace(/^#/, "")}`
                          : "#63BE7B"
                      }
                      align="center"
                      justify="center"
                      fontSize="2xs"
                      color="white"
                      fontWeight="bold"
                    >
                      Max
                    </Flex>
                  </Flex>
                </Box>
              )}

              <Text
                fontSize="2xs"
                color="gray.400"
                fontStyle="italic"
                textAlign="center"
              >
                Formatting is managed internally by Excel's visual scale engine.
              </Text>
            </VStack>
          )}
        </Box>
      </Grid>
    </Box>
  );
}
