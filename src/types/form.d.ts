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
};
