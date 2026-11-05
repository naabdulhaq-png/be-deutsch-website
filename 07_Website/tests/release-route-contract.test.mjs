import test from 'node:test';
import assert from 'node:assert/strict';
import { compareRouteSets, requiredPublicRoutes, reviewOnlyRoutes } from '../scripts/release-route-contract.mjs';

test('complete public route set passes', () => assert.deepEqual(compareRouteSets(new Set(requiredPublicRoutes)), { missing: [], unexpected: [], forbidden: [] }));
test('missing route is detected', () => { const routes = new Set(requiredPublicRoutes); routes.delete('/a2/unit-10/listening/l02/'); assert.deepEqual(compareRouteSets(routes).missing, ['/a2/unit-10/listening/l02/']); });
test('forbidden review route is detected', () => { const routes = new Set(requiredPublicRoutes); routes.add('/a2/audio-review/'); assert.deepEqual(compareRouteSets(routes).forbidden, ['/a2/audio-review/']); });
test('unexpected route is detected', () => { const routes = new Set(requiredPublicRoutes); routes.add('/preview-private/'); assert.deepEqual(compareRouteSets(routes).unexpected, ['/preview-private/']); });
test('review-only contract is exact', () => assert.deepEqual([...reviewOnlyRoutes].sort(), ['/a2/audio-review/', '/a2/review-index/']));
