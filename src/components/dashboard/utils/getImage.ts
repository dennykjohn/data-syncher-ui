import AmazonS3Illustration from "@/assets/images/amazon-s3.svg";
import DataBricksIllustration from "@/assets/images/databricks.svg";
import GoogleReviewIllustration from "@/assets/images/google-review.svg";
import MicrosoftDynamicsIllustration from "@/assets/images/ms-dynamics.svg";
import PostgreSQLIllustration from "@/assets/images/postgres.svg";
import SalesforceSandboxIllustration from "@/assets/images/salesforce-sandbox.svg";
import SalesForceIllustration from "@/assets/images/salesforce.svg";
import SnowFlakeIllustration from "@/assets/images/snowflake.svg";
import MySQLIllustration from "@/assets/images/sql.svg";

// Image mapping configuration
const IMAGE_MAP = {
  // Sources
  snowflake: SnowFlakeIllustration,
  microsoftdynamics365_fo: MicrosoftDynamicsIllustration,
  databricks: DataBricksIllustration,
  postgresql: PostgreSQLIllustration,
  mysql: MySQLIllustration,

  // Destinations
  salesforce: SalesForceIllustration,
  salesforce_sandbox: SalesforceSandboxIllustration,
  salesforcesandbox: SalesforceSandboxIllustration, // Handle case without underscore
  google_review: GoogleReviewIllustration,
  googlereview: GoogleReviewIllustration, // Handle case without underscore
  amazon_s3: AmazonS3Illustration,
  amazons3: AmazonS3Illustration, // Handle case without underscore
  amason_s3: AmazonS3Illustration, // Handle typo variant
  amasons3: AmazonS3Illustration, // Handle typo variant without underscore
} as const;

// Default fallback image
const DEFAULT_IMAGE = DataBricksIllustration;

/**
 * Get the appropriate image for a given source/destination name
 * @param name - The name of the source or destination
 * @param fallback - Optional fallback image (defaults to DataBricks)
 * @returns The image asset
 */
export const getSourceImage = (name: string, fallback?: string): string => {
  if (!name) return fallback || DEFAULT_IMAGE;

  // Normalize the name: lowercase, remove spaces, hyphens, dots (keep underscores for now)
  const normalizedName = name.toLowerCase().replace(/[\s\-.]/g, "");

  // Try exact match first (with underscore)
  if (normalizedName in IMAGE_MAP) {
    return IMAGE_MAP[normalizedName as keyof typeof IMAGE_MAP];
  }

  // Try with underscore replaced (for cases like "salesforcesandbox" -> "salesforce_sandbox")
  let withUnderscore = normalizedName.replace(
    /(salesforce)(sandbox)/i,
    "$1_$2",
  );
  if (withUnderscore in IMAGE_MAP) {
    return IMAGE_MAP[withUnderscore as keyof typeof IMAGE_MAP];
  }

  // Try with underscore for google review
  withUnderscore = normalizedName.replace(/(google)(review)/i, "$1_$2");
  if (withUnderscore in IMAGE_MAP) {
    return IMAGE_MAP[withUnderscore as keyof typeof IMAGE_MAP];
  }

  // Try with underscore for amazon s3 (handle both amazon and amason)
  withUnderscore = normalizedName.replace(/(amazon|amason)(s3)/i, "$1_$2");
  if (withUnderscore in IMAGE_MAP) {
    return IMAGE_MAP[withUnderscore as keyof typeof IMAGE_MAP];
  }

  // Try partial matches for common variations (check more specific matches first)
  // Check for sandbox first (more specific) before salesforce (less specific)
  if (
    normalizedName.includes("sandbox") &&
    normalizedName.includes("salesforce")
  ) {
    return SalesforceSandboxIllustration;
  }

  const partialMatches = {
    snowflake: SnowFlakeIllustration,
    dynamics: MicrosoftDynamicsIllustration,
    microsoft: MicrosoftDynamicsIllustration,
    databricks: DataBricksIllustration,
    postgres: PostgreSQLIllustration,
    mysql: MySQLIllustration,
    salesforce: SalesForceIllustration,
    googlereview: GoogleReviewIllustration,
    "google review": GoogleReviewIllustration,
    amazons3: AmazonS3Illustration,
    "amazon s3": AmazonS3Illustration,
    amasons3: AmazonS3Illustration, // Handle typo variant
    "amason s3": AmazonS3Illustration, // Handle typo variant
  };

  for (const [key, image] of Object.entries(partialMatches)) {
    if (normalizedName.includes(key)) {
      return image;
    }
  }

  return fallback || DEFAULT_IMAGE;
};

/**
 * Get destination image (alias for getSourceImage for clarity)
 */
export const getDestinationImage = (
  name: string,
  fallback?: string,
): string => {
  return getSourceImage(name, fallback);
};

/**
 * Get all available images for dropdown/selection purposes
 */
export const getAllImages = () => {
  return Object.entries(IMAGE_MAP).map(([name, image]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value: name,
    image,
  }));
};

/**
 * Check if an image exists for a given name
 */
export const hasImage = (name: string): boolean => {
  if (!name) return false;
  const normalizedName = name.toLowerCase().replace(/[\s\-.]/g, "");

  // Check exact match
  if (normalizedName in IMAGE_MAP) {
    return true;
  }

  // Check with underscore pattern
  let withUnderscore = normalizedName.replace(
    /(salesforce)(sandbox)/i,
    "$1_$2",
  );
  if (withUnderscore in IMAGE_MAP) {
    return true;
  }

  withUnderscore = normalizedName.replace(/(google)(review)/i, "$1_$2");
  if (withUnderscore in IMAGE_MAP) {
    return true;
  }

  withUnderscore = normalizedName.replace(/(amazon|amason)(s3)/i, "$1_$2");
  if (withUnderscore in IMAGE_MAP) {
    return true;
  }

  // Check if it contains any known partial match
  const knownKeys = Object.keys(IMAGE_MAP);
  return knownKeys.some((key) =>
    normalizedName.includes(key.replace(/_/g, "")),
  );
};
