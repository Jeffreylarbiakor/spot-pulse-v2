// Reference scoring — pending EduSpots sign-off (TRD §6.1).
// Anchored parts: Support 60/40 split, Governance 10/10/10 — both from v1 Excel tracker.
// Assumption: Access and Engagement targets (confirm with EduSpots before freeze).

const TARGETS = {
  // Access (25)
  daysOpenFull: 20,
  hoursFull:    4,
  accessSplit:  { days: 13, hours: 12 },

  // Engagement (20)
  sessionsFull:    10,
  attendanceFull:  150,
  sparksFull:      8,
  engagementSplit: { sessions: 8, attendance: 7, sparks: 5 },

  // Support (25) — anchored to v1 Excel (60/40)
  supportSplit:   { rcCheckins: 15, trainings: 10 },
  rcCheckinsFull: 1,
  trainingsFull:  1,

  // Governance (30) — anchored to v1 Excel (10/10/10)
  governanceEach: 10,
};

const clamp01 = x => Math.max(0, Math.min(1, x));

export function computePillars(i) {
  const accDays  = clamp01(i.daysOpen    / TARGETS.daysOpenFull) * TARGETS.accessSplit.days;
  const accHours = clamp01(i.hoursPerDay / TARGETS.hoursFull)    * TARGETS.accessSplit.hours;
  const access   = Math.round(accDays + accHours);

  const eg = TARGETS.engagementSplit;
  const engagement = Math.round(
      clamp01(i.sessions   / TARGETS.sessionsFull)   * eg.sessions
    + clamp01(i.attendance / TARGETS.attendanceFull) * eg.attendance
    + clamp01(i.sparks     / TARGETS.sparksFull)     * eg.sparks
  );

  const sp = TARGETS.supportSplit;
  const support = Math.round(
      clamp01(i.rcCheckins / TARGETS.rcCheckinsFull) * sp.rcCheckins
    + clamp01(i.trainings  / TARGETS.trainingsFull)  * sp.trainings
  );

  const governance =
      (i.committee  ? TARGETS.governanceEach : 0)
    + (i.dataOnTime ? TARGETS.governanceEach : 0)
    + (i.challenge  ? TARGETS.governanceEach : 0);

  return { access, engagement, support, governance };
}

export function scoreOf(pillars) {
  return pillars.access + pillars.engagement + pillars.support + pillars.governance;
}
