import { ReactNode } from "react";

import { Breadcrumb, Button, Flex } from "@chakra-ui/react";

import { FaPlus } from "react-icons/fa6";

import { useNavigate } from "react-router";

interface PageHeaderProps {
  breadcrumbs: { label: string; route?: string }[];
  buttonLabel: string;
  onCreateClick?: () => void;
  children?: ReactNode;
}

const PageHeader = ({
  breadcrumbs,
  buttonLabel,
  onCreateClick,
  children,
}: PageHeaderProps) => {
  const navigate = useNavigate();

  const handleBreadcrumbClick = (route?: string) => {
    if (route) {
      navigate(route);
    }
  };

  return (
    <Flex justifyContent="space-between" align="center">
      <Flex direction="column" gap={2}>
        <Breadcrumb.Root size="lg">
          <Breadcrumb.List>
            {breadcrumbs.map(({ route, label }, idx) => (
              <Breadcrumb.Item key={idx} cursor={route ? "pointer" : "default"}>
                {idx > 0 && <Breadcrumb.Separator />}
                <Breadcrumb.Link
                  onClick={() => handleBreadcrumbClick(route)}
                  fontWeight={route ? "normal" : "semibold"}
                >
                  {label}
                </Breadcrumb.Link>
              </Breadcrumb.Item>
            ))}
          </Breadcrumb.List>
        </Breadcrumb.Root>
        {children}
      </Flex>
      <Button colorPalette="brand" onClick={onCreateClick}>
        <FaPlus />
        {buttonLabel}
      </Button>
    </Flex>
  );
};

export default PageHeader;
