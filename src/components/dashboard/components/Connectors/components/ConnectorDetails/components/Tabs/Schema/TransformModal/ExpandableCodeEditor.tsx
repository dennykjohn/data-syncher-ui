import { useCallback, useMemo, useState } from "react";

import { Box, Button, Flex, IconButton, Text } from "@chakra-ui/react";

import {
  FiCheck,
  FiCopy,
  FiDownload,
  FiMaximize2,
  FiMinimize2,
} from "react-icons/fi";

import { toaster } from "@/components/ui/toaster";
import { Tooltip } from "@/components/ui/tooltip";
import {
  MAX_SCRIPT_BYTES,
  MAX_SCRIPT_LINES,
} from "@/constants/transform-limits";

import { confirmCopy } from "./confirmCopy";
import { coerceScriptSchemaDtype } from "./scriptScaffold";
import { python } from "@codemirror/lang-python";
import { oneDark } from "@codemirror/theme-one-dark";
import CodeMirror from "@uiw/react-codemirror";

export type SchemaFoldField = {
  name: string;
  /** pandas dtype shown in Script schema folds */
  dtype: string;
  /** @deprecated legacy SAP label; coerced to pandas when present */
  typeLabel?: string;
};

export type SchemaFold = {
  name: string;
  fields: SchemaFoldField[];
};

export type EditorExample = {
  id: string;
  label: string;
  description: string;
  code: string;
};

export type EditorValidation = {
  passed: boolean;
  message: string;
  line?: number;
};

interface ExpandableCodeEditorProps {
  value: string;
  onChange: (_value: string) => void;
  readOnly?: boolean;
  exportText?: string;
  lockedHeader?: string;
  lockedFooter?: string;
  schemaFolds?: SchemaFold[];
  examples?: EditorExample[];
  onInsertExample?: (_code: string) => void;
  onValidate?: () => void;
  validateLabel?: string;
  validating?: boolean;
  validation?: EditorValidation | null;
  /** Script step: editor + expand only. Hide validate, copy, and download. */
  compact?: boolean;
}

const EDITOR_BG = "#282c34";
const CHROME_BG = "#21252b";
const STATUS_BG = "#007acc";

const ExpandableCodeEditor = ({
  value,
  onChange,
  readOnly = false,
  exportText,
  lockedHeader,
  lockedFooter,
  schemaFolds = [],
  examples = [],
  onInsertExample,
  onValidate,
  validateLabel = "Validate",
  validating = false,
  validation = null,
  compact = false,
}: ExpandableCodeEditorProps) => {
  const textToExport = exportText ?? value;
  const [expanded, setExpanded] = useState(false);
  const [openFolds, setOpenFolds] = useState<Record<string, boolean>>({});
  const [activeExampleId, setActiveExampleId] = useState<string | null>(null);
  const [cursor, setCursor] = useState({ line: 1, col: 1 });
  const lineCount = useMemo(
    () => (value ? value.split("\n").length : 1),
    [value],
  );
  const byteSize = useMemo(() => new Blob([value]).size, [value]);
  const activeExample =
    examples.find((example) => example.id === activeExampleId) ?? null;

  const handleCopy = useCallback(() => {
    void navigator.clipboard.writeText(textToExport).then(() => {
      toaster.success({ title: confirmCopy.copied });
    });
  }, [textToExport]);

  const handleDownload = useCallback(() => {
    const blob = new Blob([textToExport], { type: "text/x-python" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "transform.py";
    a.click();
    URL.revokeObjectURL(url);
  }, [textToExport]);

  const editorHeight = expanded ? "calc(100vh - 280px)" : "280px";

  const shell = (
    <Box
      borderWidth={1}
      borderColor="#181a1f"
      borderRadius="md"
      overflow="hidden"
      bg={EDITOR_BG}
      position={expanded ? "fixed" : "relative"}
      inset={expanded ? 0 : undefined}
      zIndex={expanded ? 1400 : undefined}
      display="flex"
      flexDirection="column"
    >
      <Flex
        align="center"
        gap={2}
        px={2}
        py={1}
        bg={CHROME_BG}
        borderBottomWidth="1px"
        borderColor="whiteAlpha.200"
        flexWrap="wrap"
      >
        <Flex align="center" gap={2} mr={2}>
          <Text fontSize="xs" color="white" fontFamily="mono">
            transform.py
          </Text>
          <Text
            fontSize="2xs"
            color="#9cdcfe"
            bg="whiteAlpha.100"
            px={1.5}
            py={0.5}
            borderRadius="sm"
          >
            Python
          </Text>
        </Flex>
        {examples.map((example) => (
          <Button
            key={example.id}
            size="xs"
            variant={activeExampleId === example.id ? "solid" : "outline"}
            color="white"
            borderColor="whiteAlpha.400"
            bg={
              activeExampleId === example.id ? "whiteAlpha.300" : "transparent"
            }
            _hover={{ bg: "whiteAlpha.200" }}
            onClick={() =>
              setActiveExampleId((current) =>
                current === example.id ? null : example.id,
              )
            }
          >
            {example.label}
          </Button>
        ))}
        <Flex ml="auto" align="center" gap={1}>
          {onValidate && !compact && (
            <Button
              size="xs"
              variant="outline"
              color="white"
              borderColor="whiteAlpha.400"
              bg="transparent"
              _hover={{ bg: "whiteAlpha.200" }}
              loading={validating}
              onClick={onValidate}
            >
              <FiCheck /> {validateLabel}
            </Button>
          )}
          <Tooltip content={expanded ? "Collapse editor" : "Expand editor"}>
            <IconButton
              aria-label={expanded ? "Collapse" : "Expand"}
              size="xs"
              variant="ghost"
              color="white"
              onClick={() => setExpanded((open) => !open)}
            >
              {expanded ? <FiMinimize2 /> : <FiMaximize2 />}
            </IconButton>
          </Tooltip>
          {!compact && (
            <Tooltip content="Copy">
              <IconButton
                aria-label="Copy"
                size="xs"
                variant="ghost"
                color="white"
                onClick={handleCopy}
              >
                <FiCopy />
              </IconButton>
            </Tooltip>
          )}
          {!compact && (
            <Tooltip content="Download">
              <IconButton
                aria-label="Download"
                size="xs"
                variant="ghost"
                color="white"
                onClick={handleDownload}
              >
                <FiDownload />
              </IconButton>
            </Tooltip>
          )}
        </Flex>
      </Flex>

      {activeExample && (
        <Box
          px={3}
          py={2}
          bg="#1e1e1e"
          borderBottomWidth="1px"
          borderColor="whiteAlpha.200"
        >
          <Text fontSize="xs" color="gray.300" mb={2}>
            {activeExample.description}
          </Text>
          <Box
            as="pre"
            m={0}
            p={2}
            bg={EDITOR_BG}
            color="#abb2bf"
            fontSize="xs"
            fontFamily="mono"
            overflowX="auto"
            whiteSpace="pre"
            aria-readonly="true"
          >
            {activeExample.code}
          </Box>
          <Button
            size="xs"
            mt={2}
            variant="outline"
            color="white"
            borderColor="whiteAlpha.400"
            bg="transparent"
            _hover={{ bg: "whiteAlpha.200" }}
            disabled={readOnly || !onInsertExample}
            onClick={() => onInsertExample?.(activeExample.code)}
          >
            Insert
          </Button>
        </Box>
      )}

      <Box flex={expanded ? 1 : undefined} overflow="auto">
        {schemaFolds.map((fold) => {
          const open = Boolean(openFolds[fold.name]);
          return (
            <Box
              key={fold.name}
              bg={EDITOR_BG}
              borderBottomWidth="1px"
              borderColor="whiteAlpha.100"
              aria-readonly="true"
            >
              <Button
                type="button"
                variant="ghost"
                width="100%"
                justifyContent="flex-start"
                height="auto"
                minH="0"
                px={2}
                py={1}
                gap={2}
                bg="transparent"
                color="#abb2bf"
                fontFamily="mono"
                fontSize="xs"
                fontWeight="normal"
                borderRadius="0"
                _hover={{ bg: "whiteAlpha.100" }}
                aria-expanded={open}
                aria-label={`${open ? "Collapse" : "Expand"} ${fold.name}`}
                onClick={() =>
                  setOpenFolds((current) => ({
                    ...current,
                    [fold.name]: !current[fold.name],
                  }))
                }
              >
                <Text as="span" w="16px" color="#636d83">
                  {open ? "▼" : "▶"}
                </Text>
                <Text as="span">
                  {fold.name} · DataFrame · {fold.fields.length} columns ·
                  pandas dtypes
                </Text>
              </Button>
              {open && (
                <Box maxH="180px" overflowY="auto" pb={1}>
                  {fold.fields.length === 0 ? (
                    <Text
                      pl={8}
                      fontSize="xs"
                      fontFamily="mono"
                      color="#7f848e"
                    >
                      No columns in the mapping JSON
                    </Text>
                  ) : (
                    fold.fields.map((field) => (
                      <Flex
                        key={field.name}
                        pl={8}
                        pr={3}
                        gap={6}
                        fontSize="xs"
                        fontFamily="mono"
                        color="#abb2bf"
                      >
                        <Text minW="140px">{field.name}</Text>
                        <Text color="#7f848e">
                          {coerceScriptSchemaDtype(
                            field.dtype || field.typeLabel || "",
                          ) || "—"}
                        </Text>
                      </Flex>
                    ))
                  )}
                </Box>
              )}
            </Box>
          );
        })}

        {lockedHeader && (
          <Box
            as="pre"
            m={0}
            px={3}
            py={2}
            bg={EDITOR_BG}
            color="#7f848e"
            fontSize="13px"
            fontFamily="mono"
            overflowX="auto"
            whiteSpace="pre"
            aria-readonly="true"
          >
            {lockedHeader}
          </Box>
        )}
        <CodeMirror
          value={value}
          height={editorHeight}
          theme={oneDark}
          extensions={[python()]}
          editable={!readOnly}
          onChange={onChange}
          onUpdate={(update) => {
            const pos = update.state.selection.main.head;
            const line = update.state.doc.lineAt(pos);
            const next = { line: line.number, col: pos - line.from + 1 };
            setCursor((current) =>
              current.line === next.line && current.col === next.col
                ? current
                : next,
            );
          }}
          basicSetup={{ lineNumbers: true, foldGutter: true }}
        />
        {lockedFooter && (
          <Box
            as="pre"
            m={0}
            px={3}
            py={2}
            bg={EDITOR_BG}
            color="#7f848e"
            fontSize="13px"
            fontFamily="mono"
            overflowX="auto"
            whiteSpace="pre"
            aria-readonly="true"
          >
            {lockedFooter}
          </Box>
        )}
      </Box>

      <Flex
        align="center"
        gap={4}
        px={3}
        py={1}
        bg={STATUS_BG}
        color="white"
        fontSize="xs"
        flexShrink={0}
      >
        <Text>
          Ln {cursor.line}, Col {cursor.col}
        </Text>
        <Text>
          {lineCount} lines · {(byteSize / 1024).toFixed(1)} KB /{" "}
          {MAX_SCRIPT_BYTES / 1024} KB · max {MAX_SCRIPT_LINES} lines
        </Text>
        <Text ml="auto">Python</Text>
        {validation && (
          <Text color={validation.passed ? "white" : "#ffd2d2"}>
            {validation.message}
            {!validation.passed && validation.line
              ? ` (line ${validation.line})`
              : ""}
          </Text>
        )}
      </Flex>
    </Box>
  );

  return shell;
};

export default ExpandableCodeEditor;
