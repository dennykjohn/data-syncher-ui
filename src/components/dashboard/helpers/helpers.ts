import { toaster } from "@/components/ui/toaster";
import ServerRoutes from "@/constants/server-routes";
import AxiosInstance from "@/lib/axios/api-client";

export interface KeyPair {
  publicKey: string;
  privateKey: string;
  passphrase?: string;
}

interface KeyPairResponse {
  public_key?: string;
  private_key?: string;
  passphrase?: string;
  exists?: boolean;
  publicKey?: string;
  privateKey?: string;
}

interface CheckKeyPairRequest {
  cmp_id: number;
  username: string;
  account: string;
}

async function exportPrivateKey(privateKey: CryptoKey): Promise<string> {
  const exported = await window.crypto.subtle.exportKey("pkcs8", privateKey);
  const exportedAsString = arrayBufferToString(exported);
  const exportedAsBase64 = window.btoa(exportedAsString);
  return formatAsPem(exportedAsBase64, "PRIVATE KEY");
}

async function exportPublicKey(publicKey: CryptoKey): Promise<string> {
  const exported = await window.crypto.subtle.exportKey("spki", publicKey);
  const exportedAsString = arrayBufferToString(exported);
  const exportedAsBase64 = window.btoa(exportedAsString);
  return formatAsPem(exportedAsBase64, "PUBLIC KEY");
}

function arrayBufferToString(buffer: ArrayBuffer): string {
  const byteArray = new Uint8Array(buffer);
  return String.fromCharCode(...byteArray);
}

function formatAsPem(base64String: string, label: string): string {
  return `-----BEGIN ${label}-----\n${base64String.match(/.{1,64}/g)?.join("\n")}\n-----END ${label}-----`;
}

export async function checkKeyPairInBackend(
  username: string,
  accountName: string,
  cmpId: number,
  type: "destination" | "source" = "destination",
): Promise<KeyPair | null> {
  try {
    const endpoint =
      type === "destination"
        ? ServerRoutes.destination.checkKeyPair()
        : "src-check-key-pair/";

    const { data } = await AxiosInstance.post<KeyPairResponse>(endpoint, {
      cmp_id: cmpId,
      username,
      account: accountName,
    } as CheckKeyPairRequest);

    if (
      (data.exists || data.public_key || data.publicKey) &&
      (data.public_key || data.publicKey) &&
      (data.private_key || data.privateKey)
    ) {
      return {
        publicKey: data.public_key || data.publicKey || "",
        privateKey: data.private_key || data.privateKey || "",
        passphrase: data.passphrase || undefined,
      };
    }

    return null;
  } catch (error) {
    if (
      (error as { response?: { status?: number } })?.response?.status === 404
    ) {
      return null;
    }
    console.error("Error checking key pair in backend:", error);
    return null;
  }
}

export async function generateKeyPair(passphrase: string): Promise<KeyPair> {
  if (!passphrase?.trim()) {
    throw new Error("Passphrase is required");
  }

  try {
    const keyPair = await window.crypto.subtle.generateKey(
      {
        name: "RSA-OAEP",
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: "SHA-256",
      },
      true,
      ["encrypt", "decrypt"],
    );

    const privateKeyPem = await exportPrivateKey(keyPair.privateKey);
    const publicKeyPem = await exportPublicKey(keyPair.publicKey);

    return {
      publicKey: publicKeyPem,
      privateKey: privateKeyPem,
    };
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "Failed to generate keys",
    );
  }
}

export async function generateKeyPairFromForm(): Promise<KeyPair> {
  const form = document.querySelector("form");

  const findInput = (possibleNames: string[]): HTMLInputElement | null => {
    if (!form) return null;

    for (const name of possibleNames) {
      const byName = form.querySelector(
        `input[name="${name}"]`,
      ) as HTMLInputElement;
      if (byName) return byName;

      const byId = form.querySelector(
        `input[id="${name}"]`,
      ) as HTMLInputElement;
      if (byId) return byId;
    }

    for (const name of possibleNames) {
      const byName = document.querySelector(
        `input[name="${name}"]`,
      ) as HTMLInputElement;
      if (byName) return byName;

      const byId = document.querySelector(
        `input[id="${name}"]`,
      ) as HTMLInputElement;
      if (byId) return byId;
    }

    return null;
  };

  const passphraseInput = findInput(["passphrase"]);
  const usernameInput = findInput(["username", "user_name", "user"]);
  const accountNameInput = findInput([
    "account_name",
    "account",
    "accountName",
    "account_identifier",
  ]);

  const passphrase = passphraseInput?.value?.trim() || "";
  const username = usernameInput?.value?.trim() || "";
  const accountName = accountNameInput?.value?.trim() || "";

  if (!username || !accountName) {
    toaster.error({
      title: "Missing credentials",
      description: "Username and account name are required to generate keys.",
    });
    throw new Error("Username and account name are required");
  }

  let cmpId: number;
  try {
    const { data: user } = await AxiosInstance.get(ServerRoutes.auth.profile());
    cmpId = user.company?.cmp_id;

    if (!cmpId) {
      throw new Error("Company ID not found");
    }
  } catch {
    toaster.error({
      title: "Failed to get company information",
      description: "Unable to retrieve company ID. Please try again.",
    });
    throw new Error("Company ID is required");
  }

  const existingKeys = await checkKeyPairInBackend(
    username,
    accountName,
    cmpId,
    "destination",
  );

  if (existingKeys) {
    if (existingKeys.passphrase && passphraseInput) {
      passphraseInput.value = existingKeys.passphrase;
    }

    toaster.info({
      title: "Keys already exist",
      description: `Keys found in database for username "${username}" and account "${accountName}". Using existing keys.`,
    });
    return existingKeys;
  }

  if (!passphrase) {
    throw new Error("Passphrase is required");
  }

  const newKeys = await generateKeyPair(passphrase);
  toaster.success({
    title: "Keys generated successfully",
    description: `New RSA key pair has been generated for username "${username}" and account "${accountName}"`,
  });
  return newKeys;
}
