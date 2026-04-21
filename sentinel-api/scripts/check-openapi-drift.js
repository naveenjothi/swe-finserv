"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
const js_yaml_1 = require("js-yaml");
function sortDeep(value) {
    if (Array.isArray(value)) {
        return value.map(sortDeep);
    }
    if (value !== null && typeof value === 'object') {
        const entries = Object.entries(value).sort(([a], [b]) => a.localeCompare(b));
        const sorted = {};
        for (const [key, child] of entries) {
            sorted[key] = sortDeep(child);
        }
        return sorted;
    }
    if (value === null ||
        typeof value === 'string' ||
        typeof value === 'number' ||
        typeof value === 'boolean') {
        return value;
    }
    return String(value);
}
async function main() {
    const staticSpecPath = (0, node_path_1.join)(process.cwd(), 'specs', 'sentinel-api.openapi.yaml');
    if (!(0, node_fs_1.existsSync)(staticSpecPath)) {
        throw new Error(`Static contract file not found at ${staticSpecPath}`);
    }
    const runtimeUrl = process.env.RUNTIME_OPENAPI_URL ?? 'http://localhost:3000/docs-json';
    const staticContract = (0, js_yaml_1.load)((0, node_fs_1.readFileSync)(staticSpecPath, 'utf8'));
    let runtimeResponse;
    try {
        runtimeResponse = await fetch(runtimeUrl);
    }
    catch (error) {
        throw new Error([
            `Unable to reach runtime OpenAPI endpoint: ${runtimeUrl}`,
            'Start the API first (npm run start:dev) or set RUNTIME_OPENAPI_URL.',
            `Original error: ${error instanceof Error ? error.message : String(error)}`,
        ].join('\n'));
    }
    if (!runtimeResponse.ok) {
        throw new Error(`Unable to fetch runtime OpenAPI from ${runtimeUrl} (${runtimeResponse.status})`);
    }
    const runtimeContract = await runtimeResponse.json();
    const staticNormalized = sortDeep(staticContract);
    const runtimeNormalized = sortDeep(runtimeContract);
    const staticString = JSON.stringify(staticNormalized);
    const runtimeString = JSON.stringify(runtimeNormalized);
    if (staticString !== runtimeString) {
        const driftDir = (0, node_path_1.join)(process.cwd(), 'specs', '.drift');
        (0, node_fs_1.mkdirSync)(driftDir, { recursive: true });
        (0, node_fs_1.writeFileSync)((0, node_path_1.join)(driftDir, 'static.normalized.json'), `${JSON.stringify(staticNormalized, null, 2)}\n`);
        (0, node_fs_1.writeFileSync)((0, node_path_1.join)(driftDir, 'runtime.normalized.json'), `${JSON.stringify(runtimeNormalized, null, 2)}\n`);
        throw new Error([
            'OpenAPI drift detected.',
            `Static: ${staticSpecPath}`,
            `Runtime: ${runtimeUrl}`,
            `Artifacts: ${driftDir}`,
        ].join('\n'));
    }
    console.log(`OpenAPI contract is aligned with runtime docs (${runtimeUrl}).`);
}
void main();
//# sourceMappingURL=check-openapi-drift.js.map