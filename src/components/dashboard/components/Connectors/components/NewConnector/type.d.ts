export interface ConnectorFormState {
  currentStep: number;
  source: number | null;
  destination: number | null;
  configuration: Record<string, string>;
}
