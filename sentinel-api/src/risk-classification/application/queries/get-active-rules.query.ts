export class GetActiveRulesQuery {}

export interface ActiveRulesView {
  version: string;
  valid_from: string;
  valid_to: string | null;
  source: string;
  payload: unknown;
}
