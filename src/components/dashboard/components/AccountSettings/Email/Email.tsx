import { useState } from "react";

import { Button, Field, Flex, Switch, Textarea } from "@chakra-ui/react";

import PageHeader from "@/components/dashboard/wrapper/PageHeader";
import LoadingSpinner from "@/components/shared/Spinner";
import { toaster } from "@/components/ui/toaster";
import { VIEW_CONFIG } from "@/constants/view-config";
import useFetchCommunicationSupportDetails from "@/queryOptions/communicationSupport/useFetchCommunicationSupportDetails";
import useUpdateCommunicationSupport from "@/queryOptions/communicationSupport/useUpdateCommunicationDetails";

const Email = () => {
  const { data, isLoading } = useFetchCommunicationSupportDetails();
  const { mutate: updateCommunicationSupport, isPending: isUpdating } =
    useUpdateCommunicationSupport();

  // local overrides become non-null only after user interaction
  const [localChecked, setLocalChecked] = useState<boolean | null>(null);
  const [localEmailAddresses, setLocalEmailAddresses] = useState<string | null>(
    null,
  );

  const checked = localChecked ?? data?.is_active ?? false;
  const emailAddresses =
    localEmailAddresses ?? data?.email_addresses?.join(", ") ?? "";

  if (isLoading) {
    return <LoadingSpinner />;
  }

  const handleSaveChanges = () => {
    // check if emails are valid (basic validation)
    const emailsArray = emailAddresses
      .split(",")
      .map((email) => email.trim())
      .filter((email) => email.length > 0);
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    for (const email of emailsArray) {
      if (!emailRegex.test(email)) {
        toaster.error({
          title: `Invalid email address: ${email}`,
          description: `Please enter valid email addresses.`,
        });
        return;
      }
    }
    updateCommunicationSupport(
      {
        is_active: checked,
        email_addresses_input: emailsArray.join(", "),
      },
      {
        onSuccess: (response) => {
          toaster.success({
            title: "Communication support updated",
            description: `Your communication support settings have been updated.`,
          });
          // reset local overrides
          setLocalChecked(response.is_active);
          setLocalEmailAddresses(response.email_addresses?.join(", ") ?? "");
        },
      },
    );
  };

  return (
    <Flex flexDirection="column" gap={VIEW_CONFIG.pageGap} h="100%">
      <PageHeader
        breadcrumbs={[
          {
            label: "Account Settings",
            route: "",
          },
        ]}
        title="Communication Support"
      />
      <Flex w="md" direction="column" gap={4}>
        <Field.Root required>
          <Field.Label>
            Email addresses <Field.RequiredIndicator />
          </Field.Label>
          <Textarea
            placeholder="Enter email addresses"
            variant="outline"
            value={emailAddresses}
            onChange={(e) => setLocalEmailAddresses(e.target.value)}
          />
          <Field.HelperText>
            Enter multiple email addresses separated by commas
          </Field.HelperText>
        </Field.Root>
        <Switch.Root
          colorPalette="brand"
          checked={checked}
          onCheckedChange={(details) => setLocalChecked(!!details?.checked)}
        >
          <Switch.HiddenInput />
          <Switch.Control>
            <Switch.Thumb />
          </Switch.Control>
          <Switch.Label>Enable communication support</Switch.Label>
        </Switch.Root>
        <Button
          variant="solid"
          colorPalette="brand"
          ml="auto"
          onClick={handleSaveChanges}
          loading={isUpdating}
        >
          Save changes
        </Button>
      </Flex>
    </Flex>
  );
};

export default Email;
