import DataBricksIllustration from "@/assets/images/databricks.svg";
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

  // Normalize the name: lowercase, remove spaces, underscores, special chars (digits are preserved)
  const normalizedName = name
    .toLowerCase()
    .replace(/[\s\-.]/g, "");

  // Try exact match first
  if (normalizedName in IMAGE_MAP) {
    return IMAGE_MAP[normalizedName as keyof typeof IMAGE_MAP];
  }

  // Try partial matches for common variations
  const partialMatches = {
    snowflake: SnowFlakeIllustration,
    dynamics: MicrosoftDynamicsIllustration,
    microsoft: MicrosoftDynamicsIllustration,
    databricks: DataBricksIllustration,
    postgres: PostgreSQLIllustration,
    mysql: MySQLIllustration,
    salesforce: SalesForceIllustration,
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
  const normalizedName = name.toLowerCase().replace(/[\s\-.]/g, "");
  return normalizedName in IMAGE_MAP;
};
