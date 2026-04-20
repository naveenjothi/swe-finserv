export class ImportCsvCommand {
  constructor(
    public readonly csvBuffer: Buffer,
    public readonly submittedBy: string,
  ) {}
}

export interface CsvImportRow {
  row: number;
  client_name: string;
  computed_tier: string;
  declared_tier: string | null;
  mismatch: boolean;
  id: string;
}

export interface ImportCsvResult {
  total_imported: number;
  mismatches: number;
  rows: CsvImportRow[];
}
