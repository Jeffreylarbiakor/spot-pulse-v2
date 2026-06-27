/**
 * SMS / WhatsApp check-in parser.
 *
 * FORMAT
 * ------
 * Line 1 (required):  SP <spotId> <YYYY-MM>
 * Line 2 (required):  D<n> H<n> S<n> A<n> P<n> R<n> T<n> M<Y|N> O<Y|N> C<Y|N> B<n>
 * Line 3 (optional):  NOTE <free text>
 *
 * Field codes (case-insensitive, order on line 2 doesn't matter):
 *   D   daysOpen         integer ≥ 0
 *   H   hoursPerDay      decimal, 0.5-hour steps (e.g. H2.5)
 *   S   sessions         integer ≥ 0  (club sessions held)
 *   A   attendance       integer ≥ 0  (total attendance)
 *   P   sparks           integer ≥ 0  (new Spark registrations)
 *   R   rcCheckins       integer ≥ 0  (check-ins with RC)
 *   T   trainings        integer ≥ 0  (trainings attended)
 *   M   committee        Y or N       (committee meeting held)
 *   O   dataOnTime       Y or N       (data submitted on time)
 *   C   challenge        Y or N       (monthly challenge submitted)
 *   B   books            integer ≥ 0  (books borrowed)
 *   NOTE achievement     rest of line (optional free text)
 *
 * Example (single SMS, 3 lines):
 *   SP tamale 2026-06
 *   D18 H3 S8 A142 P6 R1 T1 MY OY CN B54
 *   NOTE 12 girls joined the new coding club
 *
 * Example (compact, all on one line — whitespace-separated):
 *   SP tamale 2026-06 D18 H3 S8 A142 P6 R1 T1 MY OY CN B54
 *
 * The parser is forgiving:
 *   - Case-insensitive throughout.
 *   - Tokens may appear in any order on line 2 (or same line as SP).
 *   - Missing optional fields (NOTE) default to "".
 *   - Missing required numeric fields return a validation error listing what's absent.
 */

// Required numeric fields — all must be present for a valid submission
const REQUIRED_NUMERIC = ['daysOpen', 'hoursPerDay', 'sessions', 'attendance',
                          'sparks', 'rcCheckins', 'trainings', 'books'];

// Required boolean fields
const REQUIRED_BOOL = ['committee', 'dataOnTime', 'challenge'];

/**
 * Parse a raw SMS/WhatsApp body into a structured CheckinSubmission inputs object.
 *
 * @param {string} raw  — raw message text from the phone
 * @returns {{ ok: true,  spotId: string, month: string, inputs: CheckinInputs } |
 *           { ok: false, errors: string[] }}
 */
export function parseSMS(raw) {
  if (!raw || typeof raw !== 'string') {
    return { ok: false, errors: ['Empty message'] };
  }

  // Normalise: uppercase, collapse extra whitespace, unify line endings
  const text = raw.trim().toUpperCase().replace(/\r\n?/g, '\n');
  const errors = [];

  // ---- Extract SP header -------------------------------------------------
  // Accept "SP tamale 2026-06" anywhere in the text (handles multi-line and
  // the compact single-line variant).
  const headerMatch = text.match(/\bSP\s+([A-Z0-9_-]+)\s+(\d{4}-\d{2})\b/);
  if (!headerMatch) {
    return {
      ok: false,
      errors: ['Missing header. Start your message with: SP <spotId> <YYYY-MM>  e.g. SP tamale 2026-06'],
    };
  }

  const spotId = headerMatch[1].toLowerCase();
  const month  = headerMatch[2]; // already "YYYY-MM"

  // ---- Extract NOTE (free text, rest of the NOTE line) -------------------
  const noteMatch = text.match(/\bNOTE\s+(.+)/);
  const achievement = noteMatch ? noteMatch[1].trim() : '';

  // ---- Tokenise field codes ----------------------------------------------
  // Remove the SP header and NOTE line so we're left with field tokens
  const body = text
    .replace(/\bSP\s+[A-Z0-9_-]+\s+\d{4}-\d{2}\b/, '')
    .replace(/\bNOTE\s+.+/, '')
    .trim();

  // Numeric fields: letter(s) followed immediately by a number  e.g. D18 H2.5
  const numericMap = {
    D: 'daysOpen',
    H: 'hoursPerDay',
    S: 'sessions',
    A: 'attendance',
    P: 'sparks',
    R: 'rcCheckins',
    T: 'trainings',
    B: 'books',
  };

  const inputs = { achievement };

  for (const [code, field] of Object.entries(numericMap)) {
    const re = new RegExp(`\\b${code}(\\d+(?:\\.\\d+)?)\\b`);
    const m  = body.match(re);
    if (m) {
      inputs[field] = parseFloat(m[1]);
    }
  }

  // Boolean fields: letter followed by Y or N  e.g. MY OY CN
  const boolMap = {
    M: 'committee',
    O: 'dataOnTime',
    C: 'challenge',
  };

  for (const [code, field] of Object.entries(boolMap)) {
    const re = new RegExp(`\\b${code}([YN])\\b`);
    const m  = body.match(re);
    if (m) {
      inputs[field] = m[1] === 'Y';
    }
  }

  // ---- Validate required fields -----------------------------------------
  for (const f of REQUIRED_NUMERIC) {
    if (inputs[f] === undefined) errors.push(`Missing field: ${fieldLabel(f)}`);
  }
  for (const f of REQUIRED_BOOL) {
    if (inputs[f] === undefined) errors.push(`Missing field: ${fieldLabel(f)}`);
  }

  if (errors.length > 0) return { ok: false, errors };

  return {
    ok: true,
    spotId,
    month,
    inputs: {
      daysOpen:    inputs.daysOpen,
      hoursPerDay: inputs.hoursPerDay,
      sessions:    inputs.sessions,
      attendance:  inputs.attendance,
      sparks:      inputs.sparks,
      rcCheckins:  inputs.rcCheckins,
      trainings:   inputs.trainings,
      committee:   inputs.committee,
      dataOnTime:  inputs.dataOnTime,
      challenge:   inputs.challenge,
      books:       inputs.books,
      achievement: inputs.achievement,
    },
  };
}

function fieldLabel(field) {
  const labels = {
    daysOpen:    'D<days open>',
    hoursPerDay: 'H<hours per day>',
    sessions:    'S<sessions>',
    attendance:  'A<attendance>',
    sparks:      'P<sparks>',
    rcCheckins:  'R<RC checkins>',
    trainings:   'T<trainings>',
    committee:   'M<Y or N>',
    dataOnTime:  'O<Y or N>',
    challenge:   'C<Y or N>',
    books:       'B<books>',
  };
  return labels[field] ?? field;
}

/**
 * Format a quick-reference cheat-sheet for an RC.
 * Used in auto-reply SMS when a submission succeeds.
 */
export function formatHelpText() {
  return [
    'SpotPulse SMS format:',
    'Line 1: SP <spotId> <YYYY-MM>',
    'Line 2: D<days> H<hrs> S<sess> A<att> P<sparks>',
    '        R<rc> T<train> M<Y/N> O<Y/N> C<Y/N> B<books>',
    'Line 3: NOTE <achievement> (optional)',
    '',
    'Example:',
    'SP tamale 2026-06',
    'D18 H3 S8 A142 P6 R1 T1 MY OY CN B54',
  ].join('\n');
}
