import { getSubmissions, updateSubmissionSyncState, getClusters } from './store.js';

const ENDPOINT = '/api/checkins';

// Dispatched on window whenever a submission's syncState changes.
// detail: { id, syncState }
function emitChange(id, syncState) {
  window.dispatchEvent(new CustomEvent('spot-pulse:sync-changed', { detail: { id, syncState } }));
}

async function syncOne(sub) {
  await updateSubmissionSyncState(sub.id, 'syncing');
  emitChange(sub.id, 'syncing');

  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': sub.id,
      },
      // Strip client-only field before sending
      body: JSON.stringify({ ...sub, syncState: undefined }),
    });

    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      const nextState = data.updated ? 'synced-updated' : 'synced';
      await updateSubmissionSyncState(sub.id, nextState);
      emitChange(sub.id, nextState);
      // Refresh in-memory cache so dashboard picks up the confirmed score
      await getClusters();
    } else if (res.status === 409) {
      // Conflict: server already has a newer record — treat as synced
      await updateSubmissionSyncState(sub.id, 'synced-updated');
      emitChange(sub.id, 'synced-updated');
    } else {
      await updateSubmissionSyncState(sub.id, 'failed');
      emitChange(sub.id, 'failed');
    }
  } catch {
    // Network error or no backend yet
    await updateSubmissionSyncState(sub.id, 'failed');
    emitChange(sub.id, 'failed');
  }
}

/** Flush all pending/failed submissions in order. Safe to call repeatedly. */
export async function syncPending() {
  if (!navigator.onLine) return;
  const all = await getSubmissions();
  const queue = all.filter(s => s.syncState === 'pending' || s.syncState === 'failed');
  for (const sub of queue) {
    await syncOne(sub);
  }
}

/** Register background sync triggers. Call once on app boot. */
export function registerSyncTriggers() {
  window.addEventListener('online', syncPending);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') syncPending();
  });
}
