import { computePillars, scoreOf } from './scoring.js';

function monthToKey(label) {
  const [mon, year] = label.split(' ');
  const map = { Jan:'01',Feb:'02',Mar:'03',Apr:'04',May:'05',Jun:'06',Jul:'07',Aug:'08',Sep:'09',Oct:'10',Nov:'11',Dec:'12' };
  return `${year}-${map[mon]}`;
}

/**
 * Merge an array of CheckinSubmissions onto seed clusters.
 * Last-write-wins per (spotId, month).
 * Returns a new clusters array with updated pillars and trend.
 */
export function mergeSubmissions(clusters, submissions, months) {
  const latest = new Map();
  for (const sub of submissions) {
    const key = `${sub.spotId}:${sub.month}`;
    const existing = latest.get(key);
    if (!existing || sub.submittedAt > existing.submittedAt) latest.set(key, sub);
  }

  return clusters.map(cluster => ({
    ...cluster,
    spots: cluster.spots.map(spot => {
      const trend = months.map((label, i) => {
        const sub = latest.get(`${spot.id}:${monthToKey(label)}`);
        if (sub) return scoreOf(computePillars(sub.inputs));
        return spot.trend[i];
      });

      const latestMonthKey = monthToKey(months[months.length - 1]);
      const latestSub = latest.get(`${spot.id}:${latestMonthKey}`);
      const pillars = latestSub ? computePillars(latestSub.inputs) : spot.pillars;

      return { ...spot, pillars, trend };
    }),
  }));
}
