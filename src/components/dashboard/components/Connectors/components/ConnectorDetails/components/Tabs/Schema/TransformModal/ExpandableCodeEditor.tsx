import { useCallback, useMemo, useState } from "react";

import { Box, Button, Flex, IconButton, Text } from "@chakra-ui/react";

import { FiCopy, FiDownload, FiMaximize2, FiMinimize2 } from "react-icons/fi";

import { Tooltip } from "@/components/ui/tooltip";
import {
  MAX_SCRIPT_BYTES,
  MAX_SCRIPT_LINES,
} from "@/constants/transform-limits";

import { python } from "@codemirror/lang-python";
import CodeMirror from "@uiw/react-codemirror";

interface ExpandableCodeEditorProps {
  value: string;
  onChange: (_value: string) => void;
  readOnly?: boolean;
}

const ExpandableCodeEditor = ({
  value,
  onChange,
  readOnly = false,
}: ExpandableCodeEditorProps) => {
  const [expanded, setExpanded] = useState(false);
  const lineCount = useMemo(
    () => (value ? value.split("\n").length : 0),
    [value],
  );
  const byteSize = useMemo(() => new Blob([value]).size, [value]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(value);
  }, [value]);

  const handleDownload = useCallback(() => {
    const blob = new Blob([value], { type: "text/x-python" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "transform.py";
    a.click();
    URL.revokeObjectURL(url);
  }, [value]);

  const editorHeight = expanded ? "calc(100vh - 160px)" : "280px";

  const shell = (
    <Box
      borderWidth={1}
      borderColor="gray.200"
      borderRadius="md"
      overflow="hidden"
      bg="gray.900"
      position={expanded ? "fixed" : "relative"}
      inset={expanded ? 0 : undefined}
      zIndex={expanded ? 1400 : undefined}
      p={expanded ? 4 : 0}
    >
      {expanded && (
        <Flex justify="space-between" align="center" mb={2} color="white">
          <Text fontSize="sm">
            {lineCount} lines · {(byteSize / 1024).toFixed(1)} KB /{" "}
            {MAX_SCRIPT_BYTES / 1024} KB max · max {MAX_SCRIPT_LINES} lines
          </Text>
          <Button
            size="sm"
            variant="outline"
            colorPalette="gray"
            onClick={() => setExpanded(false)}
          >
            <FiMinimize2 /> Collapse
          </Button>
        </Flex>
      )}
      <Flex
        justify="flex-end"
        gap={1}
        p={1}
        bg="gray.800"
        display={expanded ? "none" : "flex"}
      >
        <Tooltip content="Expand editor">
          <IconButton
            aria-label="Expand"
            size="xs"
            variant="ghost"
            color="white"
            onClick={() => setExpanded(true)}
          >
            <FiMaximize2 />
          </IconButton>
        </Tooltip>
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
      </Flex>
      <CodeMirror
        value={value}
        height={editorHeight}
        theme="dark"
        extensions={[python()]}
        editable={!readOnly}
        onChange={onChange}
        basicSetup={{ lineNumbers: true, foldGutter: true }}
      />
      {expanded && (
        <Box
          position="fixed"
          inset={0}
          bg="blackAlpha.700"
          zIndex={-1}
          onClick={() => setExpanded(false)}
        />
      )}
    </Box>
  );

  return shell;
};

export default ExpandableCodeEditor;
