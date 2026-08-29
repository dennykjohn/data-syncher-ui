const ORIGIN = "https://datasyncher.com";

const normalizeConnectorKey = (value) =>
  value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "");

const GUIDE_PATH_MAP = {
  connector: {
    awss3: { jsonPath: "/docs/guides/connectors/aws-s3.json" },
    amazons3: { jsonPath: "/docs/guides/connectors/aws-s3.json" },
    microsoftdynamics365fo: {
      jsonPath: "/docs/guides/connectors/dynamics-365-fo.json",
    },
    snowflake: { jsonPath: "/docs/guides/connectors/snowflake-source.json" },
    salesforce: { jsonPath: "/docs/guides/connectors/salesforce.json" },
    salesforcesandbox: {
      jsonPath: "/docs/guides/connectors/salesforce-sandbox.json",
    },
    googlereviews: { jsonPath: "/docs/guides/connectors/google-reviews.json" },
    googledrive: { jsonPath: "/docs/guides/connectors/google-drive.json" },
    sftp: { jsonPath: "/docs/guides/connectors/sftp.json" },
    azuredatalakestorage: {
      jsonPath: "/docs/guides/connectors/azure-data-lake-storage.json",
    },
    adls: { jsonPath: "/docs/guides/connectors/azure-data-lake-storage.json" },
  },
  destination: {
    amazons3: {
      jsonPath: "/docs/guides/destinations/amazon-s3-destination.json",
    },
    snowflake: { jsonPath: "/docs/guides/destinations/snowflake.json" },
    salesforce: {
      jsonPath: "/docs/guides/destinations/salesforce-destination.json",
    },
    salesforcesandbox: {
      jsonPath: "/docs/guides/destinations/salesforce-sandbox-destination.json",
    },
    sharepoint: {
      jsonPath: "/docs/guides/destinations/sharepoint-destination.json",
    },
    sftp: { jsonPath: "/docs/guides/destinations/sftp-destination.json" },
    googledrive: {
      jsonPath: "/docs/guides/destinations/google-drive-destination.json",
    },
    azuredatalakestorage: {
      jsonPath: "/docs/guides/destinations/adls-destination.json",
    },
    adls: { jsonPath: "/docs/guides/destinations/adls-destination.json" },
  },
};

const aliases = [
  [/amazons3|awss3/, "amazons3"],
  [/googledrive|googledriveconnector/, "googledrive"],
  [/azuredatalake|adlsgen2|adls/, "adls"],
  [/microsoftdynamics365fo|dynamics365fo|d365fo/, "microsoftdynamics365fo"],
  [/salesforcesandbox/, "salesforcesandbox"],
  [/salesforce/, "salesforce"],
  [/googlereviews|googlereview/, "googlereviews"],
  [/snowflake/, "snowflake"],
  [/sharepoint/, "sharepoint"],
  [/sftp/, "sftp"],
];

function resolveGuideMapKey(normalized, kind) {
  const map = GUIDE_PATH_MAP[kind];
  if (map[normalized]) return normalized;
  for (const [pattern, key] of aliases) {
    if (pattern.test(normalized) && map[key]) return key;
  }
  return null;
}

function getMappedPath(connectorKey, kind) {
  const normalized = normalizeConnectorKey(connectorKey);
  const mapKey = resolveGuideMapKey(normalized, kind);
  return mapKey ? GUIDE_PATH_MAP[kind][mapKey].jsonPath : null;
}

const connectors = [
  "AmazonS3",
  "Amazon S3",
  "aws-s3",
  "MicrosoftDynamics365_FO",
  "Microsoft Dynamics 365 F&O",
  "Snowflake",
  "Salesforce",
  "SalesforceSandbox",
  "Salesforce Sandbox",
  "GoogleReviews",
  "Google Reviews",
  "Google Drive",
  "GoogleDrive",
  "SFTP",
  "AzureDataLakeStorage",
  "Azure Data Lake Storage Gen2",
  "ADLS",
  "Databricks",
  "PostgreSQL",
  "MySQL",
];

const destinations = [
  "Amazon S3",
  "Amazon S3 Destination",
  "amazons3",
  "Snowflake",
  "Salesforce",
  "Salesforce Sandbox",
  "SalesforceSandbox",
  "SharePoint",
  "SharePoint Online",
  "Google Drive",
  "SFTP",
  "Azure Data Lake Storage",
  "Azure Data Lake Storage Gen2",
  "ADLS",
  "Databricks",
];

async function check(key, kind) {
  const path = getMappedPath(key, kind);
  if (!path) return { key, kind, status: "NO_MAP", path: null, steps: 0 };
  const url = ORIGIN + path;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  const text = await res.text();
  const html =
    text.trimStart().toLowerCase().startsWith("<!doctype html") ||
    text.trimStart().toLowerCase().startsWith("<html");
  if (html) return { key, kind, status: "HTML", path, steps: 0 };
  try {
    const json = JSON.parse(text);
    const steps = Array.isArray(json.steps) ? json.steps.length : 0;
    return {
      key,
      kind,
      status: steps > 0 ? "OK" : "NO_STEPS",
      path,
      steps,
    };
  } catch {
    return { key, kind, status: "BAD_JSON", path, steps: 0 };
  }
}

const results = [];
for (const key of connectors) results.push(await check(key, "connector"));
for (const key of destinations) results.push(await check(key, "destination"));

const grouped = { OK: [], issues: [] };
for (const r of results) {
  if (r.status === "OK") grouped.OK.push(r);
  else grouped.issues.push(r);
}

console.log("=== PASSING ===");
for (const r of grouped.OK) {
  console.log(`${r.kind.padEnd(11)} | ${r.key.padEnd(30)} | ${r.steps} steps | ${r.path}`);
}
console.log("\n=== ISSUES ===");
for (const r of grouped.issues) {
  console.log(`${r.kind.padEnd(11)} | ${r.key.padEnd(30)} | ${r.status.padEnd(8)} | ${r.path || "-"}`);
}
