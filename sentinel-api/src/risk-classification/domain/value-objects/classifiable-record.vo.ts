export const CLIENT_TYPE = {
  INDIVIDUAL: 'INDIVIDUAL',
  ENTITY: 'ENTITY',
} as const;
export type ClientType = (typeof CLIENT_TYPE)[keyof typeof CLIENT_TYPE];

export interface ClassifiableRecord {
  readonly pep_status: boolean;
  readonly sanctions_screening_match: boolean;
  readonly adverse_media_flag: boolean;
  readonly country_of_tax_residence: string;
  readonly client_type: string;
  readonly annual_income: number;
  readonly source_of_funds: string;
}
