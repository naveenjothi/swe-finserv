import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { load } from 'js-yaml';

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

function sortDeep(value: unknown): JsonValue {
  if (Array.isArray(value)) {
    return value.map(sortDeep) as JsonValue;
  }

  if (value !== null && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) =>
      a.localeCompare(b),
    );
    const sorted: Record<string, JsonValue> = {};
    for (const [key, child] of entries) {
      sorted[key] = sortDeep(child);
    }
    return sorted;
  }

  if (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return value;
  }

  return String(value);
}

async function main(): Promise<void> {
  const staticSpecPath = join(process.cwd(), 'specs', 'sentinel-api.openapi.yaml');

  if (!existsSync(staticSpecPath)) {
    throw new Error(`Static contract file not found at ${staticSpecPath}`);
  }

  const runtimeUrl = process.env.RUNTIME_OPENAPI_URL ?? 'http://localhost:8000/docs-json';

  const staticContract = load(readFileSync(staticSpecPath, 'utf8'));

  let runtimeResponse: Response;
  try {
    runtimeResponse = await fetch(runtimeUrl);
  } catch (error) {
    throw new Error(
      [
        `Unable to reach runtime OpenAPI endpoint: ${runtimeUrl}`,
        'Start the API first (npm run start:dev) or set RUNTIME_OPENAPI_URL.',
        `Original error: ${error instanceof Error ? error.message : String(error)}`,
      ].join('\n'),
    );
  }

  if (!runtimeResponse.ok) {
    throw new Error(
      `Unable to fetch runtime OpenAPI from ${runtimeUrl} (${runtimeResponse.status})`,
    );
  }

  const runtimeContract = await runtimeResponse.json();

  const staticNormalized = sortDeep(staticContract);
  const runtimeNormalized = sortDeep(runtimeContract);

  const staticString = JSON.stringify(staticNormalized);
  const runtimeString = JSON.stringify(runtimeNormalized);

  if (staticString !== runtimeString) {
    const driftDir = join(process.cwd(), 'specs', '.drift');
    mkdirSync(driftDir, { recursive: true });
    writeFileSync(
      join(driftDir, 'static.normalized.json'),
      `${JSON.stringify(staticNormalized, null, 2)}\n`,
    );
    writeFileSync(
      join(driftDir, 'runtime.normalized.json'),
      `${JSON.stringify(runtimeNormalized, null, 2)}\n`,
    );

    throw new Error(
      [
        'OpenAPI drift detected.',
        `Static: ${staticSpecPath}`,
        `Runtime: ${runtimeUrl}`,
        `Artifacts: ${driftDir}`,
      ].join('\n'),
    );
  }

  // eslint-disable-next-line no-console
  console.log(`OpenAPI contract is aligned with runtime docs (${runtimeUrl}).`);
}

void main();
