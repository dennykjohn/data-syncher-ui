import {
  type Dispatch,
  type ReactNode,
  type SetStateAction,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Box,
  Button,
  Field,
  Flex,
  Input,
  NativeSelect,
  SimpleGrid,
  Text,
  Textarea,
} from "@chakra-ui/react";

import { FiCopy } from "react-icons/fi";

import { format } from "date-fns";

import PageHeader from "@/components/dashboard/wrapper/PageHeader";
import LoadingSpinner from "@/components/shared/Spinner";
import { toaster } from "@/components/ui/toaster";
import useFetchAccountCountries from "@/queryOptions/account/useFetchAccountCountries";
import useFetchAccountProfile from "@/queryOptions/account/useFetchAccountProfile";
import useUpdateAccountProfile from "@/queryOptions/account/useUpdateAccountProfile";
import {
  type AccountAddress,
  type AccountBillingDetails,
} from "@/types/accountProfile";

const formatDateTime = (value?: string | null) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return format(d, "MMM dd, yyyy, hh:mm:ss a");
};

const pickString = (...values: Array<unknown>) => {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number") return String(value);
  }
  return "—";
};

const pickOptionalString = (...values: Array<unknown>) => {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number") return String(value);
  }
  return null;
};

const pickNumber = (...values: Array<unknown>) => {
  for (const value of values) {
    if (typeof value === "number" && !Number.isNaN(value)) return value;
    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value);
      if (!Number.isNaN(parsed)) return parsed;
    }
  }
  return null;
};

const pickBoolean = (...values: Array<unknown>) => {
  for (const value of values) {
    if (typeof value === "boolean") return value;
  }
  return null;
};

const normalizeCountryList = (payload: unknown) => {
  const list = Array.isArray(payload) ? payload : [];
  const normalized = list
    .map((item) => {
      if (typeof item === "string") return item.trim();
      if (typeof item === "object" && item) {
        const obj = item as Record<string, unknown>;
        return (
          pickOptionalString(
            obj.country_name,
            obj.Country_name,
            obj.name,
            obj.country,
            obj.label,
            obj.value,
          ) ?? ""
        ).trim();
      }
      return "";
    })
    .filter((value) => value);

  const seen = new Set<string>();
  return normalized.filter((value) => {
    if (seen.has(value)) return false;
    seen.add(value);
    return true;
  });
};

const normalizeExpiryPart = (value: unknown) => {
  if (typeof value === "number" && !Number.isNaN(value)) return String(value);
  if (typeof value === "string" && value.trim()) return value.trim();
  return null;
};

const formatExpiryFromParts = (month: unknown, year: unknown) => {
  const m = normalizeExpiryPart(month);
  const y = normalizeExpiryPart(year);
  if (!m || !y) return null;
  const monthText = /^\d+$/.test(m) ? m.padStart(2, "0") : m;
  const yearText = /^\d+$/.test(y) ? y : y;
  return `${monthText}/${yearText}`;
};

const SectionCard = ({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) => (
  <Box
    borderWidth="1px"
    borderColor={{ _light: "gray.200", _dark: "gray.700" }}
    borderRadius="lg"
    p={3}
    bg={{ _light: "white", _dark: "gray.800" }}
  >
    <Text fontWeight="semibold" mb={3}>
      {title}
    </Text>
    {children}
  </Box>
);

const DetailItem = ({ label, value }: { label: string; value: string }) => (
  <Flex direction="column" gap={1}>
    <Text fontSize="sm" color={{ _light: "gray.500", _dark: "gray.400" }}>
      {label}
    </Text>
    <Text fontSize="sm">{value}</Text>
  </Flex>
);

type AddressFormState = {
  fullName: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
};

const AddressForm = ({
  value,
  onChange,
  countries,
}: {
  value: AddressFormState;
  onChange: (_field: keyof AddressFormState, _nextValue: string) => void;
  countries: string[];
}) => {
  const countryOptions =
    value.country && !countries.includes(value.country)
      ? [value.country, ...countries]
      : countries;
  return (
    <SimpleGrid columns={{ base: 1, md: 2 }} gap={1}>
      <Field.Root>
        <Field.Label fontSize="xs">Full name</Field.Label>
        <Input
          size="sm"
          placeholder="Enter full name"
          value={value.fullName}
          onChange={(e) => onChange("fullName", e.target.value)}
        />
      </Field.Root>
      <Field.Root>
        <Field.Label fontSize="xs">Phone</Field.Label>
        <Input
          size="sm"
          placeholder="Enter phone number"
          value={value.phone}
          onChange={(e) => onChange("phone", e.target.value)}
        />
      </Field.Root>
      <Field.Root gridColumn={{ base: "auto", md: "span 2" }}>
        <Field.Label fontSize="xs">Address line 1</Field.Label>
        <Textarea
          size="sm"
          rows={1}
          resize="vertical"
          placeholder="Street address, P.O. box, company name"
          value={value.line1}
          onChange={(e) => onChange("line1", e.target.value)}
        />
      </Field.Root>
      <Field.Root gridColumn={{ base: "auto", md: "span 2" }}>
        <Field.Label fontSize="xs">Address line 2</Field.Label>
        <Textarea
          size="sm"
          rows={1}
          resize="vertical"
          placeholder="Apartment, suite, unit, building, floor, etc."
          value={value.line2}
          onChange={(e) => onChange("line2", e.target.value)}
        />
      </Field.Root>
      <Field.Root>
        <Field.Label fontSize="xs">City</Field.Label>
        <Input
          size="sm"
          placeholder="Enter city"
          value={value.city}
          onChange={(e) => onChange("city", e.target.value)}
        />
      </Field.Root>
      <Field.Root>
        <Field.Label fontSize="xs">State</Field.Label>
        <Input
          size="sm"
          placeholder="Enter state"
          value={value.state}
          onChange={(e) => onChange("state", e.target.value)}
        />
      </Field.Root>
      <Field.Root>
        <Field.Label fontSize="xs">Zip code</Field.Label>
        <Input
          size="sm"
          placeholder="Enter zip code"
          value={value.zipCode}
          onChange={(e) => onChange("zipCode", e.target.value)}
        />
      </Field.Root>
      <Field.Root>
        <Field.Label fontSize="xs">Country</Field.Label>
        {countryOptions.length ? (
          <NativeSelect.Root size="sm">
            <NativeSelect.Field
              placeholder="Select country"
              value={value.country}
              onChange={(e) => onChange("country", e.target.value)}
            >
              {countryOptions.map((country) => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </NativeSelect.Field>
            <NativeSelect.Indicator />
          </NativeSelect.Root>
        ) : (
          <Input
            size="sm"
            placeholder="Enter country"
            value={value.country}
            onChange={(e) => onChange("country", e.target.value)}
          />
        )}
      </Field.Root>
    </SimpleGrid>
  );
};

const normalizeBilling = (
  raw: Record<string, unknown> | null,
  billing: AccountBillingDetails | null | undefined,
) => {
  const source = (billing ?? (raw?.billing as Record<string, unknown>)) || {};
  const billingSource = source as Record<string, unknown>;
  const stripeExpiry =
    formatExpiryFromParts(
      billingSource.stripe_card_exp_month,
      billingSource.stripe_card_exp_year,
    ) ??
    formatExpiryFromParts(
      raw?.stripe_card_exp_month,
      raw?.stripe_card_exp_year,
    );
  return {
    cardNumber: pickString(
      billingSource.card_number,
      billingSource.card_no,
      billingSource.credit_card_number,
      billingSource.stripe_card_last4,
      raw?.card_number,
      raw?.stripe_card_last4,
    ),
    cardHolder: pickString(
      billingSource.card_holder_name,
      billingSource.card_holder,
      billingSource.holder_name,
      raw?.card_holder_name,
    ),
    cardExpiry: pickString(
      billingSource.card_expiry,
      billingSource.valid_through,
      billingSource.expiry,
      billingSource.expiry_date,
      stripeExpiry,
      raw?.card_expiry,
      raw?.expiry,
    ),
    nextBillingDate: pickString(
      billingSource.next_billing_date,
      billingSource.next_billing,
      billingSource.next_invoice_date,
      raw?.next_billing_date,
    ),
  };
};

const normalizeAddress = (
  raw: Record<string, unknown> | null,
  address: AccountAddress | null | undefined,
  kind: "billing" | "shipping",
): AddressFormState => {
  const rawSource =
    (raw?.[`${kind}_address`] as Record<string, unknown> | null) ??
    (raw?.[kind] as Record<string, unknown> | null)?.address ??
    null ??
    null;
  const source =
    (address as Record<string, unknown> | null) ??
    rawSource ??
    (raw?.address as Record<string, unknown> | null) ??
    {};
  const addressSource = source as Record<string, unknown>;
  return {
    fullName: pickOptionalString(addressSource.full_name) ?? "",
    phone: pickOptionalString(addressSource.phone) ?? "",
    line1: pickOptionalString(addressSource.line1) ?? "",
    line2: pickOptionalString(addressSource.line2) ?? "",
    city: pickOptionalString(addressSource.city) ?? "",
    state: pickOptionalString(addressSource.state) ?? "",
    zipCode: pickOptionalString(addressSource.zip_code) ?? "",
    country: pickOptionalString(addressSource.country) ?? "",
  };
};

const toApiAddress = (address: AddressFormState): AccountAddress => ({
  full_name: address.fullName.trim() || null,
  phone: address.phone.trim() || null,
  line1: address.line1.trim() || null,
  line2: address.line2.trim() || null,
  city: address.city.trim() || null,
  state: address.state.trim() || null,
  zip_code: address.zipCode.trim() || null,
  country: address.country.trim() || null,
});

const AccountProfile = () => {
  const { data, isLoading } = useFetchAccountProfile();
  const { data: countriesData } = useFetchAccountCountries();
  const { mutate: updateAccountProfile, isPending: isSaving } =
    useUpdateAccountProfile();

  const raw = (data ?? null) as Record<string, unknown> | null;
  const countryOptions = useMemo(
    () => normalizeCountryList(countriesData),
    [countriesData],
  );
  const billingAddressInitial = useMemo(
    () => normalizeAddress(raw, data?.billing_address, "billing"),
    [raw, data?.billing_address],
  );
  const shippingAddressInitial = useMemo(
    () => normalizeAddress(raw, data?.shipping_address, "shipping"),
    [raw, data?.shipping_address],
  );
  const [billingAddress, setBillingAddress] = useState<AddressFormState>(
    billingAddressInitial,
  );
  const [shippingAddress, setShippingAddress] = useState<AddressFormState>(
    shippingAddressInitial,
  );

  useEffect(() => {
    setBillingAddress(billingAddressInitial);
  }, [billingAddressInitial]);

  useEffect(() => {
    setShippingAddress(shippingAddressInitial);
  }, [shippingAddressInitial]);

  if (isLoading) return <LoadingSpinner />;

  const companyName = pickString(
    data?.company_name,
    data?.company?.name,
    data?.company?.cmp_name,
    raw?.company_name,
    raw?.cmp_name,
  );
  const createdAt = pickString(
    data?.account_created_at,
    data?.company?.created_at,
    raw?.account_created_at,
    raw?.created_at,
  );
  const createdByRecord =
    (raw?.created_by as Record<string, unknown> | null) ?? null;
  const createdByName = [
    pickOptionalString(createdByRecord?.first_name),
    pickOptionalString(createdByRecord?.last_name),
  ]
    .filter(Boolean)
    .join(" ");
  const createdBy = createdByName
    ? createdByName
    : pickString(data?.created_by, data?.company?.created_by, raw?.created_by);

  const accountStatus = pickString(
    data?.account_status,
    data?.subscription?.status,
    data?.company?.status,
    raw?.account_status,
    raw?.status,
  );
  const validFrom = pickString(
    data?.company?.valid_from,
    raw?.valid_from,
    raw?.valid_from_date,
  );
  const validTo = pickString(
    data?.company?.valid_to,
    raw?.valid_to,
    raw?.valid_to_date,
  );

  const isTrial = pickBoolean(
    data?.is_trial,
    data?.subscription?.is_trial,
    raw?.is_trial,
  );
  const planName = pickString(
    raw?.plan,
    (raw?.subscription as Record<string, unknown> | null)?.plan,
  );
  const trialDays = pickNumber(
    data?.trial_days_remaining,
    data?.subscription?.trial_days_remaining,
    raw?.trial_days_remaining,
    raw?.trial_days_left,
  );

  const billingDetails = normalizeBilling(raw, data?.billing);
  const showBilling = isTrial === false;
  const updateAddress =
    (setter: Dispatch<SetStateAction<AddressFormState>>) =>
    (field: keyof AddressFormState, nextValue: string) =>
      setter((prev) => ({ ...prev, [field]: nextValue }));
  const handleBillingChange = updateAddress(setBillingAddress);
  const handleShippingChange = updateAddress(setShippingAddress);
  const handleCopyBillingToShipping = () => {
    setShippingAddress(billingAddress);
  };
  const handleSaveAddresses = () => {
    updateAccountProfile(
      {
        billing_address: toApiAddress(billingAddress),
        shipping_address: toApiAddress(shippingAddress),
      },
      {
        onSuccess: (response) => {
          toaster.success({
            title: "Account profile updated",
            description: "Billing and shipping addresses have been saved.",
          });
          const responseRaw = (response ?? null) as Record<
            string,
            unknown
          > | null;
          setBillingAddress(
            normalizeAddress(responseRaw, response.billing_address, "billing"),
          );
          setShippingAddress(
            normalizeAddress(
              responseRaw,
              response.shipping_address,
              "shipping",
            ),
          );
        },
        onError: (error) => {
          toaster.error({
            title: "Save failed",
            description: error.message || "Unable to save addresses.",
          });
        },
      },
    );
  };

  return (
    <Flex flexDirection="column" gap={3} h="100%">
      <PageHeader
        breadcrumbs={[
          {
            label: "Account Settings",
            route: "",
          },
        ]}
        title="Account Profile"
        subtitle="Company and subscription details"
      />

      <SimpleGrid columns={{ base: 1, lg: 2 }} gap={3}>
        <SectionCard title="Company Details">
          <SimpleGrid columns={{ base: 1, md: 2 }} gap={2}>
            <DetailItem label="Company name" value={companyName} />
            <DetailItem
              label="Account created date"
              value={formatDateTime(createdAt)}
            />
            <DetailItem label="Created by" value={createdBy} />
            <DetailItem label="Account status" value={accountStatus} />
            <DetailItem label="Valid from" value={formatDateTime(validFrom)} />
            <DetailItem label="Valid to" value={formatDateTime(validTo)} />
          </SimpleGrid>
        </SectionCard>

        <SectionCard title="Subscription">
          <SimpleGrid columns={{ base: 1, md: 2 }} gap={2}>
            <DetailItem label="Plan" value={planName} />
            <DetailItem
              label="Plan type"
              value={isTrial === null ? "—" : isTrial ? "Trial" : "Paid"}
            />
            {isTrial ? (
              <DetailItem
                label="Trial days remaining"
                value={`${trialDays ?? 0} days`}
              />
            ) : null}
          </SimpleGrid>
        </SectionCard>
      </SimpleGrid>

      {showBilling && (
        <SectionCard title="Addresses">
          <SimpleGrid columns={{ base: 1, lg: 2 }} gap={2}>
            <Box
              borderWidth="1px"
              borderColor={{ _light: "gray.200", _dark: "gray.700" }}
              borderRadius="md"
              p={2}
              bg={{ _light: "gray.50", _dark: "gray.900" }}
            >
              <Flex alignItems="center" justifyContent="space-between" mb={3}>
                <Text
                  fontSize="sm"
                  fontWeight="semibold"
                  color={{ _light: "gray.600", _dark: "gray.300" }}
                >
                  Billing address
                </Text>
                <Button
                  aria-label="Copy to shipping"
                  title="Copy to shipping"
                  size="xs"
                  variant="ghost"
                  onClick={handleCopyBillingToShipping}
                  minW="auto"
                  px={2}
                  borderColor="transparent"
                  _hover={{ bg: { _light: "gray.100", _dark: "gray.700" } }}
                >
                  <FiCopy />
                </Button>
              </Flex>
              <AddressForm
                value={billingAddress}
                onChange={handleBillingChange}
                countries={countryOptions}
              />
            </Box>
            <Box
              borderWidth="1px"
              borderColor={{ _light: "gray.200", _dark: "gray.700" }}
              borderRadius="md"
              p={2}
              bg={{ _light: "gray.50", _dark: "gray.900" }}
            >
              <Text
                fontSize="sm"
                fontWeight="semibold"
                mb={3}
                color={{ _light: "gray.600", _dark: "gray.300" }}
              >
                Shipping address
              </Text>
              <AddressForm
                value={shippingAddress}
                onChange={handleShippingChange}
                countries={countryOptions}
              />
            </Box>
          </SimpleGrid>
          <Flex
            justifyContent="flex-end"
            mt={2}
            pt={2}
            borderTopWidth="1px"
            borderColor={{ _light: "gray.200", _dark: "gray.700" }}
          >
            <Button
              colorPalette="brand"
              onClick={handleSaveAddresses}
              loading={isSaving}
            >
              Save
            </Button>
          </Flex>
        </SectionCard>
      )}

      {showBilling && (
        <SectionCard title="Billing Details">
          <SimpleGrid columns={{ base: 1, md: 3 }} gap={2}>
            <DetailItem label="Card number" value={billingDetails.cardNumber} />
            <DetailItem
              label="Card holder name"
              value={billingDetails.cardHolder}
            />
            <DetailItem label="Card expiry" value={billingDetails.cardExpiry} />
            <DetailItem
              label="Next billing date"
              value={formatDateTime(billingDetails.nextBillingDate)}
            />
          </SimpleGrid>
        </SectionCard>
      )}
    </Flex>
  );
};

export default AccountProfile;
