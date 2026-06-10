import { Fragment, useEffect, useRef, useState } from "react";

import {
  Box,
  Button,
  Checkbox,
  CloseButton,
  Dialog,
  Flex,
  IconButton,
  Input,
  Portal,
  SimpleGrid,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react";

import {
  LuBold,
  LuCheck,
  LuChevronDown,
  LuItalic,
  LuPencil,
  LuX,
} from "react-icons/lu";

import { useNavigate } from "react-router";

import { Tooltip } from "@/components/ui/tooltip";
import { type EmailGroup } from "@/types/emailGroups";

interface EmailGroupSelectionModalProps {
  open: boolean;
  onClose: () => void;
  tableName: string;
  emailGroups: EmailGroup[];
  initialSelectedGroupIds: number[];
  initialEmailCustomFields?: {
    subject?: string;
    subject_styles?: {
      bold?: boolean;
      italic?: boolean;
      color?: string;
      font_family?: string;
      font_size?: string;
    } | null;
    body_fields?: string[];
    greeting_name?: string;
    greeting_styles?: {
      bold?: boolean;
      italic?: boolean;
      color?: string;
      font_family?: string;
      font_size?: string;
    } | null;
    body_content?: string;
    body_styles?: {
      bold?: boolean;
      italic?: boolean;
      color?: string;
      font_family?: string;
      font_size?: string;
    } | null;
    team_name?: string;
    team_styles?: {
      bold?: boolean;
      italic?: boolean;
      color?: string;
      font_family?: string;
      font_size?: string;
    } | null;
    styles?: {
      bold?: boolean;
      italic?: boolean;
      color?: string;
      font_family?: string;
      font_size?: string;
    } | null;
  } | null;
  destinationName?: string;
  pathLabel?: string | null;
  onSave: (
    _groupIds: number[],
    _customFields: {
      subject?: string;
      subject_styles?: {
        bold?: boolean;
        italic?: boolean;
        color?: string;
        font_family?: string;
        font_size?: string;
      } | null;
      body_fields: string[];
      greeting_name?: string;
      greeting_styles?: {
        bold?: boolean;
        italic?: boolean;
        color?: string;
        font_family?: string;
        font_size?: string;
      } | null;
      body_content?: string;
      body_styles?: {
        bold?: boolean;
        italic?: boolean;
        color?: string;
        font_family?: string;
        font_size?: string;
      } | null;
      team_name?: string;
      team_styles?: {
        bold?: boolean;
        italic?: boolean;
        color?: string;
        font_family?: string;
        font_size?: string;
      } | null;
      styles?: {
        bold?: boolean;
        italic?: boolean;
        color?: string;
        font_family?: string;
        font_size?: string;
      } | null;
    },
  ) => void;
  isSaving?: boolean;
  rootFolder?: string | null;
  targetFolder?: string | null;
  outputFileName?: string | null;
  fileFormat?: string | null;
  connectionName?: string;
  companyName?: string;
  sourceDisplayName?: string;
  columnsCount?: number;
}

const BODY_FIELDS_OPTIONS = [
  { id: "service", label: "Service name" },
  { id: "connection", label: "Connection name" },
  { id: "company", label: "Company name" },
  { id: "table", label: "Table name" },
  { id: "rows", label: "Rows Exported" },
  { id: "columns", label: "Columns Exported" },
  { id: "path", label: "Destination Path" },
  { id: "timestamp", label: "Completed timestamp" },
];

const DEFAULT_BODY_FIELDS: string[] = [];

const DEFAULT_SUBJECT_TEMPLATE =
  "The {destination} export for {table} finished successfully.";
const DEFAULT_BODY_CONTENT = "";
const DEFAULT_TEAM_NAME = "Thanks & Regards,";

const getPathLabel = (dest: string, customPathLabel?: string | null) => {
  if (customPathLabel) return customPathLabel;
  const normalized = dest?.toLowerCase() || "destination";
  if (normalized === "sharepoint") return "SharePoint Path";
  if (normalized === "s3") return "S3 Path";
  if (normalized === "googledrive") return "Google Drive Path";
  return "Destination Path";
};

const getDestinationTitle = (dest: string) => {
  if (!dest) return "SharePoint";
  return dest.charAt(0).toUpperCase() + dest.slice(1).toLowerCase();
};

const renderTemplateText = (
  template: string,
  tableName: string,
  destination: string,
  resolvedPath?: string,
  connectionName?: string,
  companyName?: string,
  sourceDisplayName?: string,
  columnsCount?: number,
) => {
  if (!template) return "";
  let val = template;
  val = val.replace(/{table}/g, tableName || "CRYSTAL_VAULT");
  val = val.replace(/{destination}/g, getDestinationTitle(destination));
  val = val.replace(/{connection}/g, connectionName || "OC_CONNECTOR");
  val = val.replace(
    /{service}/g,
    `${sourceDisplayName || "Snowflake"} to ${getDestinationTitle(destination)}`,
  );
  val = val.replace(/{status}/g, "successfully");
  val = val.replace(/{company}/g, companyName || "ATC");
  val = val.replace(/{rows}/g, "1,250");
  val = val.replace(
    /{columns}/g,
    columnsCount !== undefined ? String(columnsCount) : "7",
  );
  val = val.replace(
    /{path}/g,
    resolvedPath || `Snowflake data/${tableName || "CRYSTAL_VAULT"}.xlsx`,
  );
  val = val.replace(/{timestamp}/g, "2026-05-29 07:35:47 UTC");
  return val;
};

const renderSubject = (
  template: string,
  tableName: string,
  destination: string,
  resolvedPath?: string,
  connectionName?: string,
  companyName?: string,
  sourceDisplayName?: string,
  columnsCount?: number,
) => {
  return renderTemplateText(
    template || DEFAULT_SUBJECT_TEMPLATE,
    tableName,
    destination,
    resolvedPath,
    connectionName,
    companyName,
    sourceDisplayName,
    columnsCount,
  );
};

const GRAYSCALE_COLORS = [
  "#000000",
  "#434343",
  "#666666",
  "#999999",
  "#cccccc",
  "#efefef",
  "#f3f3f3",
  "#ffffff",
];
const VIVID_COLORS = [
  "#ff0000",
  "#ff9900",
  "#ffff00",
  "#00ff00",
  "#00ffff",
  "#0000ff",
  "#9900ff",
  "#ff00ff",
];
const PALETTE_SHADES = [
  [
    "#f4cccc",
    "#fce5cd",
    "#fff2cc",
    "#d9ead3",
    "#d0e0e3",
    "#cfe2f3",
    "#d9d2e9",
    "#ead1dc",
  ],
  [
    "#ea9999",
    "#f9cb9c",
    "#ffe599",
    "#b6d7a8",
    "#a2c4c9",
    "#9fc5e8",
    "#b4a7d6",
    "#d5a6bd",
  ],
  [
    "#e06666",
    "#f6b26b",
    "#ffd966",
    "#93c47d",
    "#76a5af",
    "#6fa8dc",
    "#8e7cc3",
    "#c27ba0",
  ],
  [
    "#cc0000",
    "#e69138",
    "#f1c232",
    "#6aa84f",
    "#45818e",
    "#3d85c6",
    "#674ea7",
    "#a64d79",
  ],
  [
    "#990000",
    "#b45f06",
    "#bf9000",
    "#38761d",
    "#134f5c",
    "#0b5394",
    "#351c75",
    "#741b47",
  ],
  [
    "#660000",
    "#783f04",
    "#7f6000",
    "#274e13",
    "#0c343d",
    "#073763",
    "#20124d",
    "#4c1130",
  ],
];

const EmailGroupSelectionModalNew = ({
  open,
  onClose,
  tableName,
  emailGroups,
  initialSelectedGroupIds,
  initialEmailCustomFields,
  destinationName = "SharePoint",
  pathLabel,
  onSave,
  isSaving,
  rootFolder,
  targetFolder,
  outputFileName,
  fileFormat,
  connectionName,
  companyName,
  sourceDisplayName,
  columnsCount,
}: EmailGroupSelectionModalProps) => {
  const navigate = useNavigate();

  const getFileExtension = (format: string | null | undefined): string => {
    const norm = format?.toLowerCase() || "";
    if (norm === "excel") return ".xlsx";
    if (norm === "parquet") return ".parquet";
    if (norm === "json") return ".json";
    return ".csv";
  };

  const buildPreviewPath = (): string => {
    let fileName = (outputFileName || "").trim();
    if (!fileName) {
      const ext = getFileExtension(fileFormat);
      fileName = `${tableName || "CRYSTAL_VAULT"}${ext}`;
    } else {
      const hasExt = /\.(csv|xlsx|xls|json|parquet)$/i.test(fileName);
      if (!hasExt) {
        const ext = getFileExtension(fileFormat);
        fileName = `${fileName}${ext}`;
      }
    }

    const parts = [rootFolder, targetFolder, fileName].map((p) =>
      (p || "").trim(),
    );
    const pathParts = parts
      .filter(Boolean)
      .map((p) => {
        return p.replace(/^\/+|\/+$/g, "");
      })
      .filter(Boolean);

    let fullPath = pathParts.join("/");

    const startsWithSlash = rootFolder && rootFolder.trim().startsWith("/");
    if (startsWithSlash && !fullPath.startsWith("/")) {
      fullPath = "/" + fullPath;
    }

    return fullPath || `Snowflake data/${tableName || "CRYSTAL_VAULT"}.xlsx`;
  };

  const resolvedPath = buildPreviewPath();
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [selectedBodyFields, setSelectedBodyFields] =
    useState<string[]>(DEFAULT_BODY_FIELDS);

  const [greetingName, setGreetingName] = useState<string>("");
  const [bodyContent, setBodyContent] = useState<string>("");
  const [teamName, setTeamName] = useState<string>("");
  const [subjectTemplate, setSubjectTemplate] = useState<string>(
    DEFAULT_SUBJECT_TEMPLATE,
  );

  const [subjectStyles, setSubjectStyles] = useState({
    bold: false,
    italic: false,
    color: "#000000",
    fontFamily: "system-ui",
    fontSize: "12px",
  });
  const [greetingStyles, setGreetingStyles] = useState({
    bold: false,
    italic: false,
    color: "#000000",
    fontFamily: "system-ui",
    fontSize: "12px",
  });
  const [bodyStyles, setBodyStyles] = useState({
    bold: false,
    italic: false,
    color: "#000000",
    fontFamily: "system-ui",
    fontSize: "12px",
  });
  const [teamStyles, setTeamStyles] = useState({
    bold: false,
    italic: false,
    color: "#000000",
    fontFamily: "system-ui",
    fontSize: "12px",
  });
  const [activeSection, setActiveSection] = useState<
    "subject" | "greeting" | "body" | "team" | ""
  >("body");

  const getActiveStyle = () => {
    switch (activeSection) {
      case "subject":
        return subjectStyles;
      case "greeting":
        return greetingStyles;
      case "body":
        return bodyStyles;
      case "team":
        return teamStyles;
      default:
        return bodyStyles;
    }
  };

  const updateActiveStyle = (
    updates: Partial<{
      bold: boolean;
      italic: boolean;
      color: string;
      fontFamily: string;
      fontSize: string;
    }>,
  ) => {
    switch (activeSection) {
      case "subject":
        setSubjectStyles((prev) => ({ ...prev, ...updates }));
        break;
      case "greeting":
        setGreetingStyles((prev) => ({ ...prev, ...updates }));
        break;
      case "body":
        setBodyStyles((prev) => ({ ...prev, ...updates }));
        break;
      case "team":
        setTeamStyles((prev) => ({ ...prev, ...updates }));
        break;
    }
  };

  // Inline editing active states
  const [isEditingSubject, setIsEditingSubject] = useState(false);
  const [isEditingGreeting, setIsEditingGreeting] = useState(false);
  const [isEditingBody, setIsEditingBody] = useState(false);
  const [isEditingTeam, setIsEditingTeam] = useState(false);

  // Temporary editing text states
  const [tempSubject, setTempSubject] = useState("");
  const [tempGreeting, setTempGreeting] = useState("");
  const [tempBody, setTempBody] = useState("");
  const [tempTeam, setTempTeam] = useState("");

  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const [isMetadataDropdownOpen, setIsMetadataDropdownOpen] = useState(false);
  const [isToDropdownOpen, setIsToDropdownOpen] = useState(false);
  const colorPickerRef = useRef<HTMLDivElement>(null);
  const metadataDropdownRef = useRef<HTMLDivElement>(null);
  const toDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        colorPickerRef.current &&
        !colorPickerRef.current.contains(event.target as Node)
      ) {
        setIsColorPickerOpen(false);
      }
      if (
        metadataDropdownRef.current &&
        !metadataDropdownRef.current.contains(event.target as Node)
      ) {
        setIsMetadataDropdownOpen(false);
      }
      if (
        toDropdownRef.current &&
        !toDropdownRef.current.contains(event.target as Node)
      ) {
        setIsToDropdownOpen(false);
      }
    };
    if (isColorPickerOpen || isMetadataDropdownOpen || isToDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isColorPickerOpen, isMetadataDropdownOpen, isToDropdownOpen]);

  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        const validGroupIds = (initialSelectedGroupIds || []).filter((id) =>
          emailGroups.some((group) => group.id === id),
        );
        setSelectedIds(validGroupIds);
        setSelectedBodyFields(
          Array.isArray(initialEmailCustomFields?.body_fields)
            ? initialEmailCustomFields.body_fields
            : DEFAULT_BODY_FIELDS,
        );
        const subj =
          initialEmailCustomFields?.subject !== undefined &&
          initialEmailCustomFields?.subject !== null
            ? initialEmailCustomFields.subject
            : DEFAULT_SUBJECT_TEMPLATE;
        const greet =
          initialEmailCustomFields?.greeting_name !== undefined &&
          initialEmailCustomFields?.greeting_name !== null
            ? initialEmailCustomFields.greeting_name
            : "";
        const body =
          initialEmailCustomFields?.body_content !== undefined &&
          initialEmailCustomFields?.body_content !== null
            ? initialEmailCustomFields.body_content
            : DEFAULT_BODY_CONTENT;
        const team =
          initialEmailCustomFields?.team_name !== undefined &&
          initialEmailCustomFields?.team_name !== null
            ? initialEmailCustomFields.team_name
            : DEFAULT_TEAM_NAME;

        setSubjectTemplate(subj);
        setGreetingName(greet);
        setBodyContent(body);
        setTeamName(team);

        setTempSubject(subj);
        setTempGreeting(greet);
        setTempBody(body);
        setTempTeam(team);

        const sStyles = initialEmailCustomFields?.subject_styles;
        const gStyles = initialEmailCustomFields?.greeting_styles;
        const bStyles =
          initialEmailCustomFields?.body_styles ||
          initialEmailCustomFields?.styles;
        const tStyles = initialEmailCustomFields?.team_styles;

        setSubjectStyles({
          bold: !!sStyles?.bold,
          italic: !!sStyles?.italic,
          color: sStyles?.color || "#000000",
          fontFamily: sStyles?.font_family || "system-ui",
          fontSize: sStyles?.font_size || "12px",
        });

        setGreetingStyles({
          bold: !!gStyles?.bold,
          italic: !!gStyles?.italic,
          color: gStyles?.color || "#000000",
          fontFamily: gStyles?.font_family || "system-ui",
          fontSize: gStyles?.font_size || "12px",
        });

        setBodyStyles({
          bold: !!bStyles?.bold,
          italic: !!bStyles?.italic,
          color: bStyles?.color || "#000000",
          fontFamily: bStyles?.font_family || "system-ui",
          fontSize: bStyles?.font_size || "12px",
        });

        setTeamStyles({
          bold: !!tStyles?.bold,
          italic: !!tStyles?.italic,
          color: tStyles?.color || "#000000",
          fontFamily: tStyles?.font_family || "system-ui",
          fontSize: tStyles?.font_size || "12px",
        });

        setActiveSection("body");
        setIsEditingSubject(false);
        setIsEditingGreeting(false);
        setIsEditingBody(false);
        setIsEditingTeam(false);
        setIsColorPickerOpen(false);
        setIsMetadataDropdownOpen(false);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [open, initialSelectedGroupIds, initialEmailCustomFields, emailGroups]);

  const toggleGroup = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const toggleBodyField = (id: string) => {
    setSelectedBodyFields((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  // Inline action saves
  const saveSubjectInline = () => {
    setSubjectTemplate(tempSubject.trim());
    setIsEditingSubject(false);
  };
  const cancelSubjectInline = () => {
    setTempSubject(subjectTemplate);
    setIsEditingSubject(false);
  };

  const saveGreetingInline = () => {
    setGreetingName(tempGreeting.trim());
    setIsEditingGreeting(false);
  };
  const cancelGreetingInline = () => {
    setTempGreeting(greetingName);
    setIsEditingGreeting(false);
  };

  const saveBodyInline = () => {
    setBodyContent(tempBody.trim());
    setIsEditingBody(false);
  };
  const cancelBodyInline = () => {
    setTempBody(bodyContent);
    setIsEditingBody(false);
  };

  const saveTeamInline = () => {
    setTeamName(tempTeam.trim());
    setIsEditingTeam(false);
  };
  const cancelTeamInline = () => {
    setTempTeam(teamName);
    setIsEditingTeam(false);
  };

  const handleGoToEmailSettings = () => {
    onClose();
    navigate("/dashboard/account/communication-support?tab=notifications");
  };

  const handleSave = () => {
    const finalSubject = isEditingSubject
      ? tempSubject.trim()
      : subjectTemplate;
    const finalGreeting = isEditingGreeting
      ? tempGreeting.trim()
      : greetingName;
    const finalBody = isEditingBody ? tempBody.trim() : bodyContent;
    const finalTeam = isEditingTeam ? tempTeam.trim() : teamName;

    onSave(selectedIds, {
      subject: finalSubject,
      subject_styles: {
        bold: subjectStyles.bold,
        italic: subjectStyles.italic,
        color: subjectStyles.color,
        font_family: subjectStyles.fontFamily,
        font_size: subjectStyles.fontSize,
      },
      body_fields: selectedBodyFields,
      greeting_name: finalGreeting,
      greeting_styles: {
        bold: greetingStyles.bold,
        italic: greetingStyles.italic,
        color: greetingStyles.color,
        font_family: greetingStyles.fontFamily,
        font_size: greetingStyles.fontSize,
      },
      body_content: finalBody,
      body_styles: {
        bold: bodyStyles.bold,
        italic: bodyStyles.italic,
        color: bodyStyles.color,
        font_family: bodyStyles.fontFamily,
        font_size: bodyStyles.fontSize,
      },
      team_name: finalTeam,
      team_styles: {
        bold: teamStyles.bold,
        italic: teamStyles.italic,
        color: teamStyles.color,
        font_family: teamStyles.fontFamily,
        font_size: teamStyles.fontSize,
      },
      styles: {
        bold: bodyStyles.bold,
        italic: bodyStyles.italic,
        color: bodyStyles.color,
        font_family: bodyStyles.fontFamily,
        font_size: bodyStyles.fontSize,
      },
    });
    onClose();
  };

  return (
    <Dialog.Root lazyMount open={open} size="lg">
      <Portal>
        <Dialog.Backdrop bg="blackAlpha.600" backdropFilter="blur(4px)" />
        <Dialog.Positioner>
          <Dialog.Content
            borderRadius="xl"
            boxShadow="2xl"
            bg="white"
            overflow="hidden"
            maxW="680px"
            width="95%"
          >
            <Dialog.Header
              bg="gray.50"
              borderBottomWidth="1px"
              borderColor="gray.150"
              px={4}
              py={2.5}
            >
              <Dialog.Title color="gray.800" fontWeight="bold" fontSize="md">
                Email notifications: {tableName}
              </Dialog.Title>
            </Dialog.Header>

            <Dialog.Body pt={1} pb={3} px={3.5} bg="white">
              <VStack align="stretch" gap={1}>
                {/* Dynamic Email Client Mock */}
                <Box
                  borderWidth="1px"
                  borderColor="gray.200"
                  borderRadius="xl"
                  bg="white"
                  p={2.5}
                  boxShadow="sm"
                  display="flex"
                  flexDirection="column"
                  gap={1}
                >
                  {/* Header: Sender details */}
                  <Flex
                    justify="space-between"
                    align="center"
                    borderBottomWidth="1px"
                    borderColor="gray.100"
                    pb={1}
                  >
                    <Flex align="center" gap={2}>
                      <Flex
                        w="28px"
                        h="28px"
                        borderRadius="full"
                        bg="brand.500"
                        color="white"
                        align="center"
                        justify="center"
                        fontWeight="bold"
                        fontSize="10px"
                      >
                        DS
                      </Flex>
                      <Flex align="baseline" gap={1.5}>
                        <Text
                          fontSize="11px"
                          fontWeight="bold"
                          color="gray.800"
                          lineHeight="none"
                        >
                          DataSyncher Alert System
                        </Text>
                        <Text
                          fontSize="9.5px"
                          color="gray.500"
                          lineHeight="none"
                        >
                          &lt;support1@datasyncher.com&gt;
                        </Text>
                      </Flex>
                    </Flex>
                  </Flex>

                  {/* To Field with custom tag selection dropdown */}
                  <Box
                    position="relative"
                    ref={toDropdownRef}
                    borderBottomWidth="1px"
                    borderColor="gray.100"
                    pb={1}
                  >
                    <Flex
                      align="center"
                      gap={1.5}
                      fontSize="xs"
                      cursor="pointer"
                      onClick={() => setIsToDropdownOpen(!isToDropdownOpen)}
                      py={0.5}
                      _hover={{ bg: "gray.50/50" }}
                      borderRadius="md"
                      px={1}
                    >
                      <Text
                        fontWeight="semibold"
                        color="gray.500"
                        flexShrink={0}
                      >
                        To:
                      </Text>
                      <Flex
                        flex={1}
                        flexWrap="wrap"
                        gap={1}
                        align="center"
                        maxH="60px"
                        overflowY="auto"
                        css={{
                          "&::-webkit-scrollbar": {
                            display: "none",
                          },
                          msOverflowStyle: "none",
                          scrollbarWidth: "none",
                        }}
                      >
                        {selectedIds.length === 0 ? (
                          <Text
                            color="gray.400"
                            fontStyle="italic"
                            fontSize="10.5px"
                          >
                            Click to select email groups...
                          </Text>
                        ) : (
                          selectedIds.map((id) => {
                            const g = emailGroups.find(
                              (group) => group.id === id,
                            );
                            if (!g) return null;
                            const emails =
                              g.email_addresses && g.email_addresses.length > 0
                                ? g.email_addresses.join(", ")
                                : "No email addresses";
                            return (
                              <Tooltip key={id} content={emails} showArrow>
                                <Flex
                                  align="center"
                                  gap={1}
                                  bg="purple.50"
                                  border="1px solid"
                                  borderColor="purple.200"
                                  borderRadius="full"
                                  px={2}
                                  py={0.5}
                                  fontSize="9.5px"
                                  color="purple.800"
                                  fontWeight="medium"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <span>{g.name}</span>
                                  <Box
                                    as="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleGroup(g.id);
                                    }}
                                    color="purple.500"
                                    _hover={{ color: "purple.700" }}
                                    display="inline-flex"
                                    alignItems="center"
                                    cursor="pointer"
                                  >
                                    <LuX size={9} />
                                  </Box>
                                </Flex>
                              </Tooltip>
                            );
                          })
                        )}
                      </Flex>
                      <LuChevronDown
                        size={10}
                        color="#64748b"
                        style={{ marginLeft: "auto", flexShrink: 0 }}
                      />
                    </Flex>

                    {/* Dropdown list of groups */}
                    {isToDropdownOpen && (
                      <Box
                        position="absolute"
                        top="100%"
                        left="0"
                        zIndex={1000}
                        bg="white"
                        boxShadow="0 4px 20px rgba(0,0,0,0.15)"
                        p={2.5}
                        borderRadius="lg"
                        borderWidth="1px"
                        borderColor="gray.200"
                        width="240px"
                        mt={1}
                      >
                        <Text
                          fontSize="9px"
                          fontWeight="bold"
                          color="gray.600"
                          mb={2}
                        >
                          SELECT EMAIL GROUPS
                        </Text>
                        {emailGroups.length === 0 ? (
                          <VStack align="stretch" gap={1.5} py={2} px={1}>
                            <Text
                              fontSize="10.5px"
                              color="gray.500"
                              fontStyle="italic"
                            >
                              No email groups configured.
                            </Text>
                            <Text
                              as="span"
                              fontSize="10.5px"
                              color="brand.600"
                              fontWeight="semibold"
                              textDecoration="underline"
                              cursor="pointer"
                              _hover={{ color: "brand.700" }}
                              onClick={() => {
                                setIsToDropdownOpen(false);
                                handleGoToEmailSettings();
                              }}
                            >
                              Go to Account Settings &gt; Communications to
                              create one
                            </Text>
                          </VStack>
                        ) : (
                          <VStack
                            align="stretch"
                            gap={1.5}
                            maxH="200px"
                            overflowY="auto"
                          >
                            {emailGroups.map((group) => {
                              const isChecked = selectedIds.includes(group.id);
                              return (
                                <Flex
                                  key={group.id}
                                  alignItems="center"
                                  gap={2}
                                  py={1}
                                  px={1.5}
                                  borderRadius="md"
                                  cursor="pointer"
                                  onClick={() => toggleGroup(group.id)}
                                  _hover={{ bg: "gray.50" }}
                                >
                                  <Checkbox.Root
                                    colorPalette="brand"
                                    checked={isChecked}
                                    onCheckedChange={() =>
                                      toggleGroup(group.id)
                                    }
                                    size="sm"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <Checkbox.HiddenInput />
                                    <Checkbox.Control />
                                  </Checkbox.Root>
                                  <Text
                                    fontSize="11px"
                                    color="gray.700"
                                    style={{
                                      whiteSpace: "nowrap",
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                      maxWidth: "100%",
                                    }}
                                  >
                                    {group.name}
                                  </Text>
                                </Flex>
                              );
                            })}
                          </VStack>
                        )}
                      </Box>
                    )}
                  </Box>

                  {/* Style & Setting Toolbar */}
                  <Flex
                    gap={2}
                    align="center"
                    justify="space-between"
                    p="3px"
                    px="8px"
                    bg="gray.50"
                    borderRadius="lg"
                    borderWidth="1px"
                    borderColor="gray.200"
                    boxShadow="xs"
                  >
                    {/* Left: Text Styling Actions */}
                    <Flex align="center" gap={1.5} wrap="wrap">
                      {/* Bold / Italic */}
                      <Flex
                        gap={3}
                        bg="white"
                        p="1px"
                        borderRadius="md"
                        borderWidth="1px"
                        borderColor="gray.200"
                      >
                        <IconButton
                          size="xs"
                          variant={getActiveStyle()?.bold ? "solid" : "ghost"}
                          colorPalette={
                            getActiveStyle()?.bold ? "brand" : "gray"
                          }
                          onClick={() =>
                            updateActiveStyle({ bold: !getActiveStyle()?.bold })
                          }
                          h="18px"
                          w="18px"
                          minW="18px"
                          disabled={activeSection === "subject"}
                          aria-label="Bold text"
                        >
                          <LuBold size={9.5} />
                        </IconButton>
                        <IconButton
                          size="xs"
                          variant={getActiveStyle()?.italic ? "solid" : "ghost"}
                          colorPalette={
                            getActiveStyle()?.italic ? "brand" : "gray"
                          }
                          onClick={() =>
                            updateActiveStyle({
                              italic: !getActiveStyle()?.italic,
                            })
                          }
                          h="18px"
                          w="18px"
                          minW="18px"
                          disabled={activeSection === "subject"}
                          aria-label="Italic text"
                        >
                          <LuItalic size={9.5} />
                        </IconButton>
                      </Flex>

                      <Box w="1px" h="10px" bg="gray.300" mx={0.5} />

                      {/* Font selector */}
                      <select
                        value={getActiveStyle()?.fontFamily || "system-ui"}
                        onChange={(e) =>
                          updateActiveStyle({ fontFamily: e.target.value })
                        }
                        disabled={activeSection === "subject"}
                        style={{
                          fontSize: "9.5px",
                          fontWeight: "500",
                          height: "18px",
                          outline: "none",
                          border: "1px solid #e2e8f0",
                          borderRadius: "6px",
                          paddingLeft: "4px",
                          paddingRight: "4px",
                          backgroundColor: "white",
                          color: "#334155",
                          cursor:
                            activeSection === "subject"
                              ? "not-allowed"
                              : "pointer",
                          opacity: activeSection === "subject" ? 0.6 : 1,
                        }}
                      >
                        <option value="system-ui">Sans-serif</option>
                        <option value="Arial">Arial</option>
                        <option value="Verdana">Verdana</option>
                        <option value="Tahoma">Tahoma</option>
                        <option value="Georgia">Georgia</option>
                      </select>

                      {/* Font Size selector */}
                      <select
                        value={getActiveStyle()?.fontSize || "12px"}
                        onChange={(e) =>
                          updateActiveStyle({ fontSize: e.target.value })
                        }
                        disabled={activeSection === "subject"}
                        style={{
                          fontSize: "9.5px",
                          fontWeight: "500",
                          height: "18px",
                          outline: "none",
                          border: "1px solid #e2e8f0",
                          borderRadius: "6px",
                          paddingLeft: "4px",
                          paddingRight: "4px",
                          backgroundColor: "white",
                          color: "#334155",
                          cursor:
                            activeSection === "subject"
                              ? "not-allowed"
                              : "pointer",
                          opacity: activeSection === "subject" ? 0.6 : 1,
                        }}
                      >
                        <option value="11px">11px</option>
                        <option value="12px">12px</option>
                        <option value="14px">14px</option>
                        <option value="16px">16px</option>
                        <option value="18px">18px</option>
                      </select>

                      <Box w="1px" h="10px" bg="gray.300" mx={0.5} />

                      {/* Color Picker button */}
                      <Box position="relative" ref={colorPickerRef}>
                        <Flex
                          as="button"
                          align="center"
                          gap={1}
                          onClick={() => {
                            if (activeSection === "subject") return;
                            setIsColorPickerOpen(!isColorPickerOpen);
                          }}
                          h="18px"
                          px={2}
                          bg="white"
                          borderWidth="1px"
                          borderColor="gray.200"
                          borderRadius="md"
                          cursor={
                            activeSection === "subject"
                              ? "not-allowed"
                              : "pointer"
                          }
                          opacity={activeSection === "subject" ? 0.6 : 1}
                          _hover={
                            activeSection === "subject"
                              ? undefined
                              : { bg: "gray.50" }
                          }
                        >
                          <Box
                            w="8px"
                            h="8px"
                            borderRadius="full"
                            bg={getActiveStyle()?.color || "#000000"}
                            border="1px solid rgba(0,0,0,0.15)"
                          />
                          <span
                            style={{
                              fontSize: "9.5px",
                              fontWeight: 600,
                              color: "#475569",
                            }}
                          >
                            Color
                          </span>
                        </Flex>
                        {isColorPickerOpen && activeSection !== "subject" && (
                          <Box
                            position="absolute"
                            top="22px"
                            left="0"
                            zIndex={999}
                            bg="white"
                            boxShadow="0 4px 20px rgba(0,0,0,0.15)"
                            p={2.5}
                            borderRadius="lg"
                            borderWidth="1px"
                            borderColor="gray.200"
                            width="168px"
                          >
                            <Text
                              fontSize="10px"
                              fontWeight="bold"
                              color="gray.600"
                              mb={2}
                            >
                              Text color
                            </Text>

                            {/* Grayscale row */}
                            <SimpleGrid columns={8} gap={1} mb={2}>
                              {GRAYSCALE_COLORS.map((c) => (
                                <Box
                                  key={c}
                                  as="button"
                                  onClick={() => {
                                    updateActiveStyle({ color: c });
                                    setIsColorPickerOpen(false);
                                  }}
                                  w="14px"
                                  h="14px"
                                  bg={c}
                                  border="1px solid"
                                  borderColor={
                                    c.toLowerCase() === "#ffffff"
                                      ? "gray.300"
                                      : "transparent"
                                  }
                                  cursor="pointer"
                                  position="relative"
                                  _hover={{ outline: "1.5px solid #3b82f6" }}
                                >
                                  {getActiveStyle()?.color.toLowerCase() ===
                                    c.toLowerCase() && (
                                    <LuCheck
                                      size={8}
                                      color={
                                        c.toLowerCase() === "#ffffff" ||
                                        c.toLowerCase() === "#f3f3f3" ||
                                        c.toLowerCase() === "#efefef"
                                          ? "black"
                                          : "white"
                                      }
                                      style={{
                                        position: "absolute",
                                        top: "50%",
                                        left: "50%",
                                        transform: "translate(-50%, -50%)",
                                      }}
                                    />
                                  )}
                                </Box>
                              ))}
                            </SimpleGrid>

                            {/* Vivid row */}
                            <SimpleGrid columns={8} gap={1} mb={2}>
                              {VIVID_COLORS.map((c) => (
                                <Box
                                  key={c}
                                  as="button"
                                  onClick={() => {
                                    updateActiveStyle({ color: c });
                                    setIsColorPickerOpen(false);
                                  }}
                                  w="14px"
                                  h="14px"
                                  bg={c}
                                  border="1px solid transparent"
                                  cursor="pointer"
                                  position="relative"
                                  _hover={{ outline: "1.5px solid #3b82f6" }}
                                >
                                  {getActiveStyle()?.color.toLowerCase() ===
                                    c.toLowerCase() && (
                                    <LuCheck
                                      size={8}
                                      color="white"
                                      style={{
                                        position: "absolute",
                                        top: "50%",
                                        left: "50%",
                                        transform: "translate(-50%, -50%)",
                                      }}
                                    />
                                  )}
                                </Box>
                              ))}
                            </SimpleGrid>

                            <Box
                              borderBottomWidth="1px"
                              borderColor="gray.150"
                              my={2}
                            />

                            {/* Shades matrix */}
                            <VStack align="stretch" gap={1}>
                              {PALETTE_SHADES.map((row, rIdx) => (
                                <SimpleGrid key={rIdx} columns={8} gap={1}>
                                  {row.map((c) => (
                                    <Box
                                      key={c}
                                      as="button"
                                      onClick={() => {
                                        updateActiveStyle({ color: c });
                                        setIsColorPickerOpen(false);
                                      }}
                                      w="14px"
                                      h="14px"
                                      bg={c}
                                      border="1px solid transparent"
                                      cursor="pointer"
                                      position="relative"
                                      _hover={{
                                        outline: "1.5px solid #3b82f6",
                                      }}
                                    >
                                      {getActiveStyle()?.color.toLowerCase() ===
                                        c.toLowerCase() && (
                                        <LuCheck
                                          size={8}
                                          color={rIdx < 2 ? "black" : "white"}
                                          style={{
                                            position: "absolute",
                                            top: "50%",
                                            left: "50%",
                                            transform: "translate(-50%, -50%)",
                                          }}
                                        />
                                      )}
                                    </Box>
                                  ))}
                                </SimpleGrid>
                              ))}
                            </VStack>
                          </Box>
                        )}
                      </Box>
                    </Flex>

                    {/* Right: Metadata checklist dropdown popover */}
                    <Box position="relative" ref={metadataDropdownRef}>
                      <Flex
                        as="button"
                        align="center"
                        gap={1}
                        onClick={() =>
                          setIsMetadataDropdownOpen(!isMetadataDropdownOpen)
                        }
                        h="18px"
                        px={3}
                        bg="white"
                        borderWidth="1px"
                        borderColor="gray.200"
                        borderRadius="md"
                        cursor="pointer"
                        boxShadow="xs"
                        _hover={{ bg: "gray.50" }}
                        transition="all 0.15s"
                      >
                        <span
                          style={{
                            fontSize: "9.5px",
                            fontWeight: 600,
                            color: "#475569",
                          }}
                        >
                          Metadata
                        </span>
                        <LuChevronDown size={8} color="#64748b" />
                      </Flex>
                      {isMetadataDropdownOpen && (
                        <Box
                          position="absolute"
                          top="22px"
                          right="0"
                          zIndex={999}
                          bg="white"
                          boxShadow="0 4px 20px rgba(0,0,0,0.15)"
                          p={3}
                          borderRadius="lg"
                          borderWidth="1px"
                          borderColor="gray.200"
                          width="210px"
                        >
                          <Text
                            fontSize="10px"
                            fontWeight="bold"
                            color="gray.600"
                            mb={2}
                          >
                            Select Fields to Include
                          </Text>
                          <VStack
                            align="stretch"
                            gap={1.5}
                            maxH="220px"
                            overflowY="auto"
                          >
                            {BODY_FIELDS_OPTIONS.map((field) => {
                              const isFieldChecked =
                                selectedBodyFields.includes(field.id);
                              const fieldLabel =
                                field.id === "path"
                                  ? getPathLabel(destinationName, pathLabel)
                                  : field.label;
                              return (
                                <Flex
                                  key={field.id}
                                  alignItems="center"
                                  gap={2}
                                  py={1}
                                  px={1.5}
                                  borderRadius="md"
                                  cursor="pointer"
                                  onClick={() => toggleBodyField(field.id)}
                                  _hover={{ bg: "gray.50" }}
                                >
                                  <Checkbox.Root
                                    colorPalette="brand"
                                    checked={isFieldChecked}
                                    onCheckedChange={() =>
                                      toggleBodyField(field.id)
                                    }
                                    size="sm"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <Checkbox.HiddenInput />
                                    <Checkbox.Control />
                                  </Checkbox.Root>
                                  <Text
                                    fontSize="11px"
                                    color="gray.700"
                                    style={{
                                      whiteSpace: "nowrap",
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                      maxWidth: "100%",
                                    }}
                                  >
                                    {fieldLabel}
                                  </Text>
                                </Flex>
                              );
                            })}
                          </VStack>
                        </Box>
                      )}
                    </Box>
                  </Flex>

                  {/* Email Subject Row */}
                  <Box
                    border={
                      activeSection === "subject"
                        ? "1.5px solid"
                        : "1px solid transparent"
                    }
                    borderColor={
                      activeSection === "subject" ? "brand.500" : "gray.200"
                    }
                    bg={
                      activeSection === "subject"
                        ? "brand.50/30"
                        : "transparent"
                    }
                    borderRadius="md"
                    p="4px"
                    cursor="pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveSection("subject");
                    }}
                  >
                    {isEditingSubject ? (
                      <Box
                        bg="white"
                        p={1}
                        borderRadius="md"
                        borderWidth="1px"
                        borderColor="brand.200"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Flex gap={2} align="center">
                          <Text
                            fontSize="xs"
                            fontWeight="semibold"
                            color="gray.700"
                            whiteSpace="nowrap"
                          >
                            Subject:
                          </Text>
                          <Input
                            size="xs"
                            value={tempSubject}
                            onChange={(e) => setTempSubject(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") saveSubjectInline();
                              if (e.key === "Escape") cancelSubjectInline();
                            }}
                            placeholder="Enter subject template..."
                            flex={1}
                            autoFocus
                            bg="white"
                            color="gray.850"
                            fontFamily="system-ui"
                            borderColor="gray.300"
                            _focus={{ borderColor: "brand.500" }}
                            h="20px"
                          />
                          <IconButton
                            aria-label="Save subject"
                            size="xs"
                            variant="ghost"
                            colorPalette="green"
                            onClick={saveSubjectInline}
                            h="18px"
                            w="18px"
                            minW="18px"
                          >
                            <LuCheck size={12} />
                          </IconButton>
                          <IconButton
                            aria-label="Cancel editing"
                            size="xs"
                            variant="ghost"
                            colorPalette="red"
                            onClick={cancelSubjectInline}
                            h="18px"
                            w="18px"
                            minW="18px"
                          >
                            <LuX size={12} />
                          </IconButton>
                        </Flex>
                        <Flex align="center" gap={1.5} mt={1} flexWrap="wrap">
                          <Text
                            fontSize="9px"
                            color="gray.500"
                            whiteSpace="nowrap"
                          >
                            Insert:
                          </Text>
                          {["{table}", "{destination}", "{connection}"].map(
                            (tag) => (
                              <Box
                                key={tag}
                                as="button"
                                onClick={() =>
                                  setTempSubject((prev) => prev + tag)
                                }
                                fontWeight="semibold"
                                color="brand.600"
                                px={1}
                                py={0.5}
                                bg="brand.50"
                                borderRadius="sm"
                                fontSize="9px"
                                cursor="pointer"
                                _hover={{ bg: "brand.100" }}
                              >
                                {tag}
                              </Box>
                            ),
                          )}
                        </Flex>
                      </Box>
                    ) : (
                      <Flex
                        align="center"
                        justify="space-between"
                        gap={1.5}
                        cursor="pointer"
                        py="1px"
                        px="3px"
                        border="1px solid transparent"
                        borderRadius="md"
                        transition="all 0.2s"
                        _hover={{
                          bg: "brand.50/40",
                          border: "1px dashed",
                          borderColor: "brand.300",
                          color: "brand.600",
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveSection("subject");
                          setTempSubject(subjectTemplate);
                          setIsEditingSubject(true);
                        }}
                        title="Click to edit subject line template"
                      >
                        <Text
                          fontSize="xs"
                          lineHeight="short"
                          flex={1}
                          fontFamily="system-ui"
                          color="gray.850"
                        >
                          <strong>Subject: </strong>
                          {renderSubject(
                            subjectTemplate,
                            tableName,
                            destinationName,
                            resolvedPath,
                            connectionName,
                            companyName,
                            sourceDisplayName,
                          ) || (
                            <span
                              style={{
                                color: "#000000",
                                fontStyle: "italic",
                                fontWeight: "normal",
                              }}
                            >
                              [Empty Subject - Click to add]
                            </span>
                          )}
                        </Text>
                        <IconButton
                          aria-label="Edit subject"
                          size="xs"
                          variant="ghost"
                          colorPalette="brand"
                          flexShrink={0}
                          h="16px"
                          w="16px"
                          minW="16px"
                        >
                          <LuPencil size={9.5} />
                        </IconButton>
                      </Flex>
                    )}
                  </Box>

                  {/* Email Body Area */}
                  <Box
                    bg="white"
                    borderWidth="1px"
                    borderColor="gray.100"
                    borderRadius="md"
                    p={3}
                    flex={1}
                    overflowY="auto"
                    fontFamily="system-ui"
                    fontSize="11px"
                    color="gray.800"
                    lineHeight="normal"
                    minH="250px"
                    display="flex"
                    flexDirection="column"
                  >
                    <VStack align="stretch" gap={1.5}>
                      {/* Greeting recipient */}
                      <Box
                        p="4px"
                        border={
                          activeSection === "greeting"
                            ? "1.5px solid"
                            : "1px solid transparent"
                        }
                        borderColor={
                          activeSection === "greeting"
                            ? "brand.500"
                            : "transparent"
                        }
                        bg={
                          activeSection === "greeting"
                            ? "brand.50/30"
                            : "transparent"
                        }
                        borderRadius="md"
                        cursor="pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveSection("greeting");
                        }}
                      >
                        {isEditingGreeting ? (
                          <Flex
                            gap={1.5}
                            align="center"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Input
                              size="xs"
                              w="200px"
                              value={tempGreeting}
                              onChange={(e) => setTempGreeting(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") saveGreetingInline();
                                if (e.key === "Escape") cancelGreetingInline();
                              }}
                              placeholder="Enter greeting (e.g., Hi, Rahul)..."
                              autoFocus
                              bg="white"
                              color={greetingStyles.color}
                              fontFamily={greetingStyles.fontFamily}
                              fontSize={greetingStyles.fontSize}
                              fontWeight={
                                greetingStyles.bold ? "bold" : "normal"
                              }
                              fontStyle={
                                greetingStyles.italic ? "italic" : "normal"
                              }
                              borderColor="gray.300"
                              h="22px"
                            />
                            <IconButton
                              aria-label="Save greeting"
                              size="xs"
                              variant="ghost"
                              colorPalette="green"
                              onClick={saveGreetingInline}
                              h="20px"
                              w="20px"
                              minW="20px"
                            >
                              <LuCheck size={11} />
                            </IconButton>
                            <IconButton
                              aria-label="Cancel greeting"
                              size="xs"
                              variant="ghost"
                              colorPalette="red"
                              onClick={cancelGreetingInline}
                              h="20px"
                              w="20px"
                              minW="20px"
                            >
                              <LuX size={11} />
                            </IconButton>
                          </Flex>
                        ) : (
                          <Text
                            fontFamily={greetingStyles.fontFamily}
                            color={greetingStyles.color}
                            fontSize={greetingStyles.fontSize}
                            fontWeight={greetingStyles.bold ? "bold" : "normal"}
                            fontStyle={
                              greetingStyles.italic ? "italic" : "normal"
                            }
                          >
                            <Box
                              as="span"
                              border="1px dashed"
                              borderColor="brand.300"
                              cursor="pointer"
                              px={2}
                              py={0.5}
                              borderRadius="md"
                              bg="brand.50/20"
                              display="inline-flex"
                              alignItems="center"
                              gap={1}
                              transition="all 0.2s"
                              _hover={{
                                borderColor: "brand.500",
                                color: "brand.600",
                                bg: "brand.50/60",
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveSection("greeting");
                                setTempGreeting(greetingName);
                                setIsEditingGreeting(true);
                              }}
                              title="Click to edit greeting"
                            >
                              {greetingName || (
                                <span
                                  style={{
                                    color: "#000000",
                                    fontStyle: "italic",
                                    fontWeight: "normal",
                                  }}
                                >
                                  [Empty Greeting - Click to add]
                                </span>
                              )}
                              <LuPencil size={9} />
                            </Box>
                          </Text>
                        )}
                      </Box>

                      {/* Custom content */}
                      <Box
                        p="4px"
                        border={
                          activeSection === "body"
                            ? "1.5px solid"
                            : "1px solid transparent"
                        }
                        borderColor={
                          activeSection === "body" ? "brand.500" : "transparent"
                        }
                        bg={
                          activeSection === "body"
                            ? "brand.50/30"
                            : "transparent"
                        }
                        borderRadius="md"
                        cursor="pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveSection("body");
                        }}
                      >
                        {isEditingBody ? (
                          <Box
                            bg="gray.50"
                            p={2.5}
                            borderRadius="md"
                            borderWidth="1px"
                            borderColor="brand.100"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Textarea
                              size="xs"
                              value={tempBody}
                              onChange={(e) => setTempBody(e.target.value)}
                              rows={4}
                              bg="white"
                              color={bodyStyles.color}
                              fontFamily={bodyStyles.fontFamily}
                              fontSize={bodyStyles.fontSize}
                              fontWeight={bodyStyles.bold ? "bold" : "normal"}
                              fontStyle={
                                bodyStyles.italic ? "italic" : "normal"
                              }
                              borderColor="gray.300"
                              _focus={{ borderColor: "brand.500" }}
                              autoFocus
                              mb={2}
                            />
                            <Flex
                              gap={2}
                              align="center"
                              justify="space-between"
                              mb={2}
                            >
                              <Text fontSize="8px" color="gray.500">
                                Tags: `{`{table}`}`, `{`{destination}`}`, etc.
                              </Text>
                              <Flex gap={1}>
                                <Button
                                  size="xs"
                                  colorPalette="green"
                                  onClick={saveBodyInline}
                                  h="22px"
                                  px={2.5}
                                  fontSize="10px"
                                >
                                  Save
                                </Button>
                                <Button
                                  size="xs"
                                  variant="ghost"
                                  colorPalette="gray"
                                  onClick={cancelBodyInline}
                                  h="22px"
                                  px={2.5}
                                  fontSize="10px"
                                >
                                  Cancel
                                </Button>
                              </Flex>
                            </Flex>
                            {/* Clickable badges inside editor context */}
                            <Flex wrap="wrap" gap={1}>
                              {[
                                "{table}",
                                "{destination}",
                                "{connection}",
                                "{service}",
                                "{status}",
                                "{rows}",
                                "{columns}",
                                "{path}",
                                "{timestamp}",
                              ].map((tag) => (
                                <Box
                                  key={tag}
                                  as="button"
                                  onClick={() =>
                                    setTempBody((prev) => prev + tag)
                                  }
                                  fontWeight="semibold"
                                  color="brand.600"
                                  px={1.5}
                                  py={0.5}
                                  bg="brand.50"
                                  borderRadius="sm"
                                  fontSize="8.5px"
                                  cursor="pointer"
                                  _hover={{ bg: "brand.100" }}
                                >
                                  {tag}
                                </Box>
                              ))}
                            </Flex>
                          </Box>
                        ) : (
                          <Box
                            cursor="pointer"
                            border="1px dashed"
                            borderColor="brand.300"
                            borderRadius="md"
                            p={2.5}
                            bg="brand.50/10"
                            transition="all 0.2s"
                            _hover={{
                              borderColor: "brand.500",
                              bg: "brand.50/30",
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveSection("body");
                              setTempBody(bodyContent);
                              setIsEditingBody(true);
                            }}
                            position="relative"
                            title="Click to edit email body message template"
                          >
                            <Text
                              fontFamily={bodyStyles.fontFamily}
                              color={bodyStyles.color}
                              fontSize={bodyStyles.fontSize}
                              fontWeight={bodyStyles.bold ? "bold" : "normal"}
                              fontStyle={
                                bodyStyles.italic ? "italic" : "normal"
                              }
                              whiteSpace="pre-wrap"
                            >
                              {renderTemplateText(
                                bodyContent,
                                tableName,
                                destinationName,
                                resolvedPath,
                                connectionName,
                                companyName,
                                sourceDisplayName,
                                columnsCount,
                              ) || (
                                <span
                                  style={{
                                    color: "#000000",
                                    fontStyle: "italic",
                                    fontWeight: "normal",
                                  }}
                                >
                                  [Empty Message Body - Click to add]
                                </span>
                              )}
                            </Text>
                            <Flex
                              position="absolute"
                              right={2}
                              top={2}
                              color="brand.500"
                              _hover={{ color: "brand.700" }}
                            >
                              <LuPencil size={11} />
                            </Flex>
                          </Box>
                        )}
                      </Box>

                      {/* Metadata fields (rendered in a code-block look if any chosen) */}
                      {selectedBodyFields.length > 0 ? (
                        <Box mt={1} p={2.5} bg="gray.50" borderRadius="md">
                          <Box
                            display="grid"
                            gridTemplateColumns="max-content 1fr"
                            columnGap="40px"
                            rowGap="4px"
                          >
                            {selectedBodyFields.map((fieldId) => {
                              let label = "";
                              let valueElement: React.ReactNode = null;

                              switch (fieldId) {
                                case "service":
                                  label = "Service";
                                  valueElement = `${sourceDisplayName || "Snowflake"} to ${getDestinationTitle(destinationName)}`;
                                  break;
                                case "connection":
                                  label = "Connection";
                                  valueElement =
                                    connectionName || "OC_CONNECTOR";
                                  break;
                                case "company":
                                  label = "Company";
                                  valueElement = companyName || "ATC";
                                  break;
                                case "table":
                                  label = "Table";
                                  valueElement = tableName || "CRYSTAL_VAULT";
                                  break;
                                case "rows":
                                  label = "Rows Exported";
                                  valueElement = "1,250 (Example)";
                                  break;
                                case "columns":
                                  label = "Columns Exported";
                                  valueElement =
                                    columnsCount !== undefined
                                      ? String(columnsCount)
                                      : "7";
                                  break;
                                case "path":
                                  label = getPathLabel(
                                    destinationName,
                                    pathLabel,
                                  );
                                  valueElement = (
                                    <Text
                                      as="span"
                                      color="brand.600"
                                      textDecoration="underline"
                                      cursor="pointer"
                                      _hover={{ color: "brand.700" }}
                                      fontFamily={bodyStyles.fontFamily}
                                      fontSize={bodyStyles.fontSize}
                                      fontStyle={
                                        bodyStyles.italic ? "italic" : "normal"
                                      }
                                    >
                                      {resolvedPath}
                                    </Text>
                                  );
                                  break;
                                case "timestamp":
                                  label = "Completed At";
                                  valueElement = "2026-05-29 07:35:47 UTC";
                                  break;
                              }

                              if (!label) return null;

                              return (
                                <Fragment key={fieldId}>
                                  <Text
                                    fontFamily={bodyStyles.fontFamily}
                                    fontSize={bodyStyles.fontSize}
                                    color={bodyStyles.color}
                                    fontWeight={550}
                                    fontStyle={
                                      bodyStyles.italic ? "italic" : "normal"
                                    }
                                  >
                                    {label}
                                  </Text>
                                  <Text
                                    fontFamily={bodyStyles.fontFamily}
                                    fontSize={bodyStyles.fontSize}
                                    color={bodyStyles.color}
                                    fontWeight={
                                      bodyStyles.bold ? "bold" : "normal"
                                    }
                                    fontStyle={
                                      bodyStyles.italic ? "italic" : "normal"
                                    }
                                  >
                                    {valueElement}
                                  </Text>
                                </Fragment>
                              );
                            })}
                          </Box>
                        </Box>
                      ) : (
                        <Box
                          mt={1}
                          p={3}
                          bg="gray.50"
                          borderRadius="md"
                          borderWidth="1.5px"
                          borderStyle="dashed"
                          borderColor="gray.200"
                          textAlign="center"
                        >
                          <Text
                            fontSize="10px"
                            color="gray.400"
                            fontStyle="italic"
                          >
                            [Empty metadata - Select fields from the dropdown
                            above to display them here]
                          </Text>
                        </Box>
                      )}

                      {/* Sign-off */}
                      <Box
                        mt={2}
                        p="4px"
                        border={
                          activeSection === "team"
                            ? "1.5px solid"
                            : "1px solid transparent"
                        }
                        borderColor={
                          activeSection === "team" ? "brand.500" : "transparent"
                        }
                        bg={
                          activeSection === "team"
                            ? "brand.50/30"
                            : "transparent"
                        }
                        borderRadius="md"
                        cursor="pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveSection("team");
                        }}
                      >
                        {isEditingTeam ? (
                          <Flex
                            gap={1.5}
                            align="flex-start"
                            mt={1}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Textarea
                              size="xs"
                              w="220px"
                              value={tempTeam}
                              onChange={(e) => setTempTeam(e.target.value)}
                              rows={3}
                              autoFocus
                              bg="white"
                              color={teamStyles.color}
                              fontFamily={teamStyles.fontFamily}
                              fontSize={teamStyles.fontSize}
                              fontWeight={teamStyles.bold ? "bold" : "normal"}
                              fontStyle={
                                teamStyles.italic ? "italic" : "normal"
                              }
                              borderColor="gray.300"
                              _focus={{ borderColor: "brand.500" }}
                            />
                            <Flex direction="column" gap={1}>
                              <IconButton
                                aria-label="Save team"
                                size="xs"
                                variant="ghost"
                                colorPalette="green"
                                onClick={saveTeamInline}
                                h="20px"
                                w="20px"
                                minW="20px"
                              >
                                <LuCheck size={11} />
                              </IconButton>
                              <IconButton
                                aria-label="Cancel team"
                                size="xs"
                                variant="ghost"
                                colorPalette="red"
                                onClick={cancelTeamInline}
                                h="20px"
                                w="20px"
                                minW="20px"
                              >
                                <LuX size={11} />
                              </IconButton>
                            </Flex>
                          </Flex>
                        ) : (
                          <Box
                            as="span"
                            border="1px dashed"
                            borderColor="brand.300"
                            cursor="pointer"
                            px={2}
                            py={0.5}
                            borderRadius="md"
                            bg="brand.50/20"
                            fontWeight="semibold"
                            display="inline-flex"
                            alignItems="center"
                            gap={1}
                            mt={1.5}
                            transition="all 0.2s"
                            _hover={{
                              borderColor: "brand.500",
                              color: "brand.600",
                              bg: "brand.50/60",
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveSection("team");
                              setTempTeam(teamName);
                              setIsEditingTeam(true);
                            }}
                            title="Click to edit signature team name"
                          >
                            <Text
                              fontFamily={teamStyles.fontFamily}
                              color={teamStyles.color}
                              fontSize={teamStyles.fontSize}
                              fontWeight={teamStyles.bold ? "bold" : "normal"}
                              fontStyle={
                                teamStyles.italic ? "italic" : "normal"
                              }
                              whiteSpace="pre-wrap"
                            >
                              {teamName || (
                                <span
                                  style={{
                                    color: "#000000",
                                    fontStyle: "italic",
                                    fontWeight: "normal",
                                  }}
                                >
                                  [Empty Team Signature - Click to add]
                                </span>
                              )}
                            </Text>
                            <LuPencil size={9} />
                          </Box>
                        )}
                      </Box>
                    </VStack>
                  </Box>
                </Box>
              </VStack>
            </Dialog.Body>

            <Dialog.Footer
              bg="gray.50"
              borderTopWidth="1px"
              borderColor="gray.100"
              px={4}
              py={2.5}
            >
              <Button
                variant="outline"
                onClick={onClose}
                mr={3}
                disabled={isSaving}
                size="sm"
              >
                Cancel
              </Button>
              <Button
                colorPalette="brand"
                onClick={handleSave}
                px={6}
                borderRadius="full"
                loading={isSaving}
                size="sm"
              >
                Save Settings
              </Button>
            </Dialog.Footer>

            <Dialog.CloseTrigger asChild>
              <CloseButton
                size="sm"
                onClick={onClose}
                position="absolute"
                right={4}
                top={4}
              />
            </Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
};

export default EmailGroupSelectionModalNew;
