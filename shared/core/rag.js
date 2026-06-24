// RAG Red/Amber boundary: 50 (recommended per PRD §6.2). One constant, one place.
const RAG_RED_MAX = 50;

export function rag(score) {
  if (score >= 75) return { key: 'Green', label: 'Green — healthy',          cls: 'green', c: 'var(--green-500)' };
  if (score >= RAG_RED_MAX) return { key: 'Amber', label: 'Amber — needs attention', cls: 'amber', c: 'var(--amber-500)' };
  return                    { key: 'Red',   label: 'Red — at risk',           cls: 'red',   c: 'var(--danger)' };
}
