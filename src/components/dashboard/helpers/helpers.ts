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

const arrayBufferToString = (buffer: ArrayBuffer): string =>
  String.fromCharCode(...new Uint8Array(buffer));

const formatAsPem = (base64: string, label: string): string =>
  `-----BEGIN ${label}-----\n${base64.match(/.{1,64}/g)?.join("\n")}\n-----END ${label}-----`;

const exportPrivateKey = async (key: CryptoKey): Promise<string> => {
  const exported = await window.crypto.subtle.exportKey("pkcs8", key);
  return formatAsPem(window.btoa(arrayBufferToString(exported)), "PRIVATE KEY");
};

const exportPublicKey = async (key: CryptoKey): Promise<string> => {
  const exported = await window.crypto.subtle.exportKey("spki", key);
  return formatAsPem(window.btoa(arrayBufferToString(exported)), "PUBLIC KEY");
};

export const checkKeyPairInBackend = async (
  username: string,
  accountName: string,
  cmpId: number,
  type: "destination" | "source" = "destination",
): Promise<KeyPair | null> => {
  try {
    const endpoint =
      type === "destination"
        ? ServerRoutes.destination.checkKeyPair()
        : ServerRoutes.source.checkKeyPair();

    const { data } = await AxiosInstance.post<KeyPairResponse>(endpoint, {
      cmp_id: cmpId,
      username,
      account: accountName,
    } as CheckKeyPairRequest);

    const publicKey = data.public_key || data.publicKey;
    const privateKey = data.private_key || data.privateKey;

    if ((data.exists || publicKey) && publicKey && privateKey) {
      return {
        publicKey,
        privateKey,
        passphrase: data.passphrase,
      };
    }

    return null;
  } catch {
    return null;
  }
};

export const generateKeyPair = async (
  passphrase: string,
): Promise<KeyPair | null> => {
  if (!passphrase?.trim()) {
    toaster.error({
      title: "Passphrase required",
      description: "Enter a passphrase before generating keys.",
    });
    return null;
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

    const [privateKey, publicKey] = await Promise.all([
      exportPrivateKey(keyPair.privateKey),
      exportPublicKey(keyPair.publicKey),
    ]);

    return { publicKey, privateKey };
  } catch (error) {
    console.error("[generateKeyPair] failed:", error);
    toaster.error({
      title: "Key generation failed",
      description: "Local key generation failed. Check console for details.",
    });
    return null;
  }
};

export const checkKeysForUser = async (
  username: string,
  accountName: string,
  authenticationType: string,
  type: "destination" | "source" = "destination",
): Promise<KeyPair | null> => {
  const trimmedUser = username?.trim();
  const trimmedAccount = accountName?.trim();

  if (
    !trimmedUser ||
    !trimmedAccount ||
    (authenticationType !== "key_pair" &&
      !authenticationType?.toLowerCase().includes("key"))
  ) {
    return null;
  }

  const cmpId = await getCompanyId();
  if (!cmpId) return null;

  const existingKeys = await checkKeyPairInBackend(
    trimmedUser,
    trimmedAccount,
    cmpId,
    type,
  );

  if (existingKeys) {
    toaster.info({
      title: "Keys already exist",
      description: `Keys found for "${trimmedUser}" and "${trimmedAccount}". Using existing keys.`,
    });
    return existingKeys;
  }

  return null;
};

const findFormInput = (names: string[]): HTMLInputElement | null => {
  const form = document.querySelector("form");
  for (const name of names) {
    const selector = (el: Element | Document | null) =>
      el?.querySelector(
        `input[name="${name}"], input[id="${name}"]`,
      ) as HTMLInputElement | null;
    const found = selector(form) || selector(document);
    if (found) return found;
  }
  return null;
};

const getCompanyId = async (): Promise<number | null> => {
  try {
    const { data: user } = await AxiosInstance.get(ServerRoutes.auth.profile());
    const cmpId = user.company?.cmp_id;
    if (!cmpId) {
      toaster.error({
        title: "Failed to get company information",
        description: "Unable to retrieve company ID. Please try again.",
      });
    }
    return cmpId || null;
  } catch {
    toaster.error({
      title: "Failed to get company information",
      description: "Unable to retrieve company ID. Please try again.",
    });
    return null;
  }
};

export const generateKeyPairFromForm = async (): Promise<KeyPair | null> => {
  const passphraseInput = findFormInput(["passphrase"]);
  const usernameInput = findFormInput(["username", "user_name", "user"]);
  const accountNameInput = findFormInput([
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
      description: "Username and account name are required.",
    });
    return null;
  }

  const cmpId = await getCompanyId();
  if (!cmpId) return null;

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
      description: `Keys found for "${username}" and "${accountName}". Using existing keys.`,
    });
    return existingKeys;
  }

  if (!passphrase) {
    toaster.error({
      title: "Passphrase required",
      description: "Passphrase is required to generate new keys.",
    });
    return null;
  }

  const newKeys = await generateKeyPair(passphrase);
  if (!newKeys) {
    toaster.error({
      title: "Key generation failed",
      description: "Failed to generate keys. Please try again.",
    });
    return null;
  }

  toaster.success({
    title: "Keys generated successfully",
    description: `New RSA key pair generated for "${username}" and "${accountName}"`,
  });
  return newKeys;
};

export const copyToClipboard = (
  text: string,
  type: "Public" | "Private",
): void => {
  navigator.clipboard.writeText(text).then(() => {
    toaster.success({
      title: `${type} key copied`,
      description: "Key copied to clipboard",
    });
  });
};
