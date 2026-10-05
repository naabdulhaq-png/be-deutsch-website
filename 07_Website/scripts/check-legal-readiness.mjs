import { readFileSync } from 'node:fs';

const configUrl = new URL('../src/config/legal.json', import.meta.url);
const legal = JSON.parse(readFileSync(configUrl, 'utf8'));

const blockers = [];

if (legal.legalReady !== true) {
  blockers.push('legalReady is not true');
}

const requiredAddressFields = ['street', 'postalCode', 'city', 'country'];

if (
  !legal.serviceAddress ||
  typeof legal.serviceAddress !== 'object' ||
  requiredAddressFields.some((field) => typeof legal.serviceAddress[field] !== 'string' || !legal.serviceAddress[field].trim())
) {
  blockers.push('a complete legally suitable service address is missing');
}

if (legal.providerNameConfirmedComplete !== true) {
  blockers.push('the complete legal provider name has not been confirmed');
}

for (const [field, label] of [
  ['providerName', 'provider name'],
  ['providerStatus', 'provider status'],
  ['supportEmail', 'public support email'],
  ['phoneDisplay', 'public phone number'],
  ['phoneHref', 'public phone link'],
  ['businessRegistration', 'business registration status'],
  ['commercialRegister', 'commercial register status'],
  ['vatId', 'VAT identification status'],
]) {
  if (typeof legal[field] !== 'string' || !legal[field].trim()) {
    blockers.push(`${label} is missing`);
  }
}

if (blockers.length > 0) {
  console.error('Production release blocked:');
  for (const blocker of blockers) console.error(`- ${blocker}`);
  console.error('Resolve every item in src/config/legal.json before a production build or deployment.');
  process.exit(1);
}

console.log('Legal release preflight passed.');
