export interface ConnectorFormState {
  currentStep: number;
  source: string | null;
  destination: number | null;
  configuration: Record<string, string>;
}
