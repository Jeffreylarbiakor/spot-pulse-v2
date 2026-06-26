import { openDB } from 'idb';
import SEED from '../../seed/clusters.json' assert { type: 'json' };
import { mergeSubmissions } from './merge.js';

const DB_NAME = 'spot-pulse';
const DB_VERSION = 1;

let _db;
async function getDB() {
  if (!_db) _db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      db.createObjectStore('submissions', { keyPath: 'id' });
      db.createObjectStore('network', { keyPath: 'id' });
    },
  });
  return _db;
}

export const MONTHS = SEED.months;
export const REPORTING_MONTH = SEED.reportingMonth;

// In-memory cache — screens read this synchronously via getClustersSync()
let _cache = SEED.clusters;

/** Refresh cache from IndexedDB and return merged clusters. */
export async function getClusters() {
  const db = await getDB();
  const submissions = await db.getAll('submissions');
  _cache = mergeSubmissions(SEED.clusters, submissions, MONTHS);
  return _cache;
}

/** Synchronous read of the last-known cache (seed until first getClusters() call). */
export function getClustersSync() {
  return _cache;
}

export async function saveSubmission(submission) {
  const db = await getDB();
  await db.put('submissions', submission);
}

export async function getSubmissions() {
  const db = await getDB();
  return db.getAll('submissions');
}

export async function updateSubmissionSyncState(id, syncState) {
  const db = await getDB();
  const sub = await db.get('submissions', id);
  if (sub) await db.put('submissions', { ...sub, syncState });
}
