import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
const root = path.resolve(import.meta.dirname, '..');
const metadata = JSON.parse(readFileSync(path.join(root, 'public', 'a2-release.json'), 'utf8'));
assert.equal(metadata.publicationAuthorized, true, 'Public deployment is not authorized in a2-release.json');
assert.equal(metadata.deploymentAuthorized, true, 'Deployment is not authorized in a2-release.json');
assert.ok(metadata.authorizationReference, 'A separate owner authorization reference is required');
console.log('Deployment authorization gate passed.');
