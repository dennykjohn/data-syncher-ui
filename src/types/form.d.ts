export type FieldConfig = {
  name: string;
  label: string;
  type: "CharField" | "ChoiceField" | "PasswordInput";

  /**
   * Optional choices for dropdown fields.
   * Each choice should have a string value and a display.
   */
  choices?: Array<{ value: string; display: string }>;
  required: boolean;
  read_only?: boolean; // If true, field will be read-only in edit mode
};

export interface KeyPair {
  publicKey: string;
  privateKey: string;
  passphrase?: string;
}

export interface KeyPairResponse {
  public_key: string;
  private_key: string;
  passphrase: string;
  exists: boolean;
  publicKey: string;
  privateKey: string;
}

export interface CheckKeyPairRequest {
  cmp_id: number;
  username: string;
  account: string;
}
