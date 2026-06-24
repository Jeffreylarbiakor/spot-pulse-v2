import { rag } from './rag.js';

export function avg(arr) {
  return arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;
}

export function allSpots(clusters) {
  return clusters.flatMap(c => c.spots);
}

export function networkStats(clusters, m) {
  const spots = allSpots(clusters);
  const reporting = spots.filter(s => s.trend[m] != null);
  let g = 0, a = 0, r = 0;
  reporting.forEach(s => {
    const k = rag(s.trend[m]).key;
    if (k === 'Green') g++;
    else if (k === 'Amber') a++;
    else r++;
  });
  return {
    total: spots.length,
    reporting: reporting.length,
    avg: avg(reporting.map(s => s.trend[m])),
    g, a, r,
  };
}

export function clusterAvgs(clusters, m) {
  return clusters.map(c => {
    const rep = c.spots.filter(s => s.trend[m] != null).map(s => s.trend[m]);
    return [c.name, avg(rep)];
  });
}

export function findSpot(clusters, id) {
  for (const c of clusters) {
    const spot = c.spots.find(s => s.id === id);
    if (spot) return { spot, cluster: c };
  }
  return null;
}
