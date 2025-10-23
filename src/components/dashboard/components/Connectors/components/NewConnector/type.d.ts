export interface ConnectorFormState {
  currentStep: number;
  source: string | null;
  destination: string | null;
  configuration: Record<string, string>;
}
