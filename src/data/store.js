import SEED from '../../seed/clusters.json' assert { type: 'json' };

// In M1: in-memory store from seed data.
// M3 replaces this with IndexedDB-backed state.
let _clusters = SEED.clusters;

export const MONTHS = SEED.months;
export const REPORTING_MONTH = SEED.reportingMonth;

export function getClusters() { return _clusters; }

export function setClusters(clusters) { _clusters = clusters; }
