import { useMemo, useState } from "react";

import { Box, Flex, Input, Stack, Text } from "@chakra-ui/react";

import { LuInbox } from "react-icons/lu";

import { format } from "date-fns";

import { dateTimeFormat } from "@/constants/common";
import { type SupportTicketResponse } from "@/types/support";

import SupportListTable, { type Column } from "./SupportListTable";

interface SupportTableProps {
  tickets: SupportTicketResponse[];
  searchQuery: string;
  onSearchChange: (_value: string) => void;
  onViewTicket: (_id: number) => void;
}

const SupportTable = ({
  tickets,
  searchQuery,
  onSearchChange,
  onViewTicket,
}: SupportTableProps) => {
  const [statusFilter, setStatusFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [issueTypeFilter, setIssueTypeFilter] = useState("All");
  const [sourceTypeFilter, setSourceTypeFilter] = useState("All");

  const uniqueCategories = useMemo(() => {
    if (!tickets) return [];
    return Array.from(
      new Set(tickets.map((t) => t.category_detail?.name).filter(Boolean)),
    ) as string[];
  }, [tickets]);

  const uniqueIssueTypes = useMemo(() => {
    const fromTickets = tickets
      ? (Array.from(
          new Set(
            tickets.map((t) => t.issue_type_detail?.name).filter(Boolean),
          ),
        ) as string[])
      : [];
    const fixed = [
      "Manage Users/Permissions",
      "Notifications",
      "Account Setup",
      "Dashboard Banner Error",
      "Payment Issue",
      "Transformations Pricing",
      "Invoice Query",
    ];
    return Array.from(new Set([...fixed, ...fromTickets]));
  }, [tickets]);

  const uniqueSourceTypes = useMemo(() => {
    const fromTickets = tickets
      ? (Array.from(
          new Set(tickets.map((t) => t.source_type).filter(Boolean)),
        ) as string[])
      : [];
    const fixed = [
      "Salesforce",
      "Microsoft Dynamics",
      "Amazon S3",
      "Google Review",
    ];
    return Array.from(new Set([...fixed, ...fromTickets]));
  }, [tickets]);

  // derive unique statuses from actual data (preserves exact casing from API)
  const uniqueStatuses = useMemo(() => {
    if (!tickets) return [];
    return Array.from(
      new Set(tickets.map((t) => t.status).filter(Boolean)),
    ) as string[];
  }, [tickets]);

  const filteredTickets = useMemo(() => {
    if (!tickets) return [];
    const query = searchQuery.trim().toLowerCase();

    return tickets.filter((ticket) => {
      const matchesSearch =
        !query ||
        String(ticket.ticket_id).includes(query) ||
        (ticket.ticket_code?.toLowerCase() ?? "").includes(query) ||
        (ticket.subject?.toLowerCase() ?? "").includes(query) ||
        (ticket.description?.toLowerCase() ?? "").includes(query) ||
        (ticket.status?.toLowerCase() ?? "").includes(query) ||
        (ticket.source_type?.toLowerCase() ?? "").includes(query) ||
        (ticket.connection_name?.toLowerCase() ?? "").includes(query) ||
        (ticket.category_detail?.name?.toLowerCase() ?? "").includes(query) ||
        (ticket.issue_type_detail?.name?.toLowerCase() ?? "").includes(query);

      // case-insensitive status match
      const matchesStatus =
        statusFilter === "All" ||
        ticket.status?.toLowerCase() === statusFilter.toLowerCase();

      const matchesCategory =
        categoryFilter === "All" ||
        ticket.category_detail?.name === categoryFilter;

      const matchesIssueType =
        issueTypeFilter === "All" ||
        ticket.issue_type_detail?.name === issueTypeFilter;

      const matchesSourceType =
        sourceTypeFilter === "All" ||
        (ticket.source_type?.toLowerCase() ?? "") ===
          sourceTypeFilter.toLowerCase();

      return (
        matchesSearch &&
        matchesStatus &&
        matchesCategory &&
        matchesIssueType &&
        matchesSourceType
      );
    });
  }, [
    tickets,
    searchQuery,
    statusFilter,
    categoryFilter,
    issueTypeFilter,
    sourceTypeFilter,
  ]);

  const ticketColumns: Column<SupportTicketResponse>[] = [
    {
      header: "Ticket No",
      accessor: "ticket_id",
      width: "8%",
      render: (value: unknown, row: SupportTicketResponse) => (
        <Flex align="center" gap={1} pl={0.5}>
          <Box minW="14px">
            {row.has_new_response && <LuInbox size={14} color="#6e2fd5" />}
          </Box>
          <Text>{value as string}</Text>
        </Flex>
      ),
    },
    {
      header: "Subject",
      accessor: "subject",
      width: "15%",
    },
    {
      header: "Created At",
      accessor: "created_at",
      width: "13%",
      render: (value: unknown) =>
        value ? format(new Date(String(value)), dateTimeFormat) : "-",
    },
    {
      header: "Updated At",
      accessor: "updated_at",
      width: "13%",
      render: (value: unknown) =>
        value ? format(new Date(String(value)), dateTimeFormat) : "-",
    },
    {
      header: "Source Type",
      accessor: "source_type",
      width: "10%",
      filterValue: sourceTypeFilter,
      filterOptions: ["All", ...uniqueSourceTypes],
      onFilterChange: setSourceTypeFilter,
      render: (value: unknown) => (value as string) || "-",
    },
    {
      header: "Connection Name",
      accessor: "connection_name",
      width: "12%",
      render: (value: unknown) => (value as string) || "-",
    },
    {
      header: "Category",
      accessor: "category_detail",
      width: "11%",
      filterValue: categoryFilter,
      filterOptions: ["All", ...uniqueCategories],
      onFilterChange: (v: string) => {
        setCategoryFilter(v);
        setIssueTypeFilter("All");
      },
      render: (value: unknown) =>
        (value as SupportTicketResponse["category_detail"])?.name ?? "-",
    },
    {
      header: "Issue Type",
      accessor: "issue_type_detail",
      width: "16%",
      filterValue: issueTypeFilter,
      filterOptions: ["All", ...uniqueIssueTypes],
      onFilterChange: setIssueTypeFilter,
      render: (value: unknown) =>
        (value as SupportTicketResponse["issue_type_detail"])?.name ?? "-",
    },
    {
      header: "Status",
      accessor: "status",
      width: "9%",
      textAlign: "left",
      filterValue: statusFilter,
      filterOptions: ["All", ...uniqueStatuses],
      onFilterChange: setStatusFilter,
      render: (value: unknown) => (
        <Text color="gray.700" fontSize="xs" fontWeight="normal">
          {String(value)}
        </Text>
      ),
    },
  ];

  return (
    <Stack gap={2} mt={-7}>
      <Flex gap={4} align="center" flexWrap="wrap">
        <Box w="200px">
          <Input
            placeholder="Search tickets..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            size="sm"
            bg="white"
          />
        </Box>
      </Flex>
      <SupportListTable
        data={filteredTickets}
        columns={ticketColumns}
        rowHeight={30}
        onRowClick={(row) =>
          onViewTicket(Number((row as SupportTicketResponse).ticket_id))
        }
      />
    </Stack>
  );
};

export default SupportTable;
