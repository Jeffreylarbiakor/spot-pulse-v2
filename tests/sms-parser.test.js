/**
 * Unit tests for shared/core/sms-parser.js
 * Run with: node --test tests/sms-parser.test.js
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseSMS } from '../shared/core/sms-parser.js';

// ---------------------------------------------------------------------------
// Happy path
// ---------------------------------------------------------------------------

test('parses a canonical two-line message', () => {
  const msg = `SP tamale 2026-06
D18 H3 S8 A142 P6 R1 T1 MY OY CN B54`;

  const result = parseSMS(msg);
  assert.equal(result.ok, true);
  assert.equal(result.spotId, 'tamale');
  assert.equal(result.month, '2026-06');
  assert.deepEqual(result.inputs, {
    daysOpen:    18,
    hoursPerDay: 3,
    sessions:    8,
    attendance:  142,
    sparks:      6,
    rcCheckins:  1,
    trainings:   1,
    committee:   true,
    dataOnTime:  true,
    challenge:   false,
    books:       54,
    achievement: '',
  });
});

test('parses a message with NOTE line', () => {
  const msg = `SP bolga 2026-06
D20 H4 S10 A180 P8 R2 T1 MY OY CY B60
NOTE 12 girls joined the new coding club`;

  const result = parseSMS(msg);
  assert.equal(result.ok, true);
  assert.equal(result.inputs.achievement, '12 GIRLS JOINED THE NEW CODING CLUB');
});

test('parses compact single-line format', () => {
  const msg = 'SP teshie 2026-05 D15 H2.5 S6 A100 P3 R1 T0 MN OY CN B30';
  const result = parseSMS(msg);
  assert.equal(result.ok, true);
  assert.equal(result.spotId, 'teshie');
  assert.equal(result.inputs.hoursPerDay, 2.5);
  assert.equal(result.inputs.trainings, 0);
  assert.equal(result.inputs.committee, false);
});

test('is case-insensitive', () => {
  const msg = `sp tamale 2026-06
d18 h3 s8 a142 p6 r1 t1 my oy cn b54`;

  const result = parseSMS(msg);
  assert.equal(result.ok, true);
  assert.equal(result.spotId, 'tamale');
  assert.equal(result.inputs.daysOpen, 18);
});

test('accepts field tokens in any order', () => {
  const msg = `SP capecoast 2026-06
B30 T1 R2 P4 A90 S7 H3 D16 MY OY CY`;

  const result = parseSMS(msg);
  assert.equal(result.ok, true);
  assert.equal(result.inputs.books, 30);
  assert.equal(result.inputs.attendance, 90);
});

test('parses decimal hoursPerDay', () => {
  const msg = `SP nsawam 2026-06
D22 H2.5 S9 A130 P5 R1 T1 MY OY CY B45`;

  const result = parseSMS(msg);
  assert.equal(result.ok, true);
  assert.equal(result.inputs.hoursPerDay, 2.5);
});

test('all boolean fields true', () => {
  const msg = `SP dzodze 2026-06
D20 H4 S10 A160 P7 R2 T2 MY OY CY B55`;

  const result = parseSMS(msg);
  assert.equal(result.ok, true);
  assert.equal(result.inputs.committee,   true);
  assert.equal(result.inputs.dataOnTime,  true);
  assert.equal(result.inputs.challenge,   true);
});

test('all boolean fields false', () => {
  const msg = `SP savelugu 2026-06
D5 H1 S2 A20 P0 R0 T0 MN ON CN B5`;

  const result = parseSMS(msg);
  assert.equal(result.ok, true);
  assert.equal(result.inputs.committee,   false);
  assert.equal(result.inputs.dataOnTime,  false);
  assert.equal(result.inputs.challenge,   false);
});

// ---------------------------------------------------------------------------
// Error cases
// ---------------------------------------------------------------------------

test('returns error for empty input', () => {
  assert.equal(parseSMS('').ok, false);
  assert.equal(parseSMS(null).ok, false);
});

test('returns error when SP header is missing', () => {
  const result = parseSMS('D18 H3 S8 A142 P6 R1 T1 MY OY CN B54');
  assert.equal(result.ok, false);
  assert.ok(result.errors[0].includes('Missing header'));
});

test('returns error listing each missing required field', () => {
  // Only has SP header — all data fields missing
  const result = parseSMS('SP tamale 2026-06');
  assert.equal(result.ok, false);
  assert.ok(result.errors.length >= 11, `expected ≥11 errors, got ${result.errors.length}`);
});

test('returns error for missing numeric field', () => {
  // Missing B (books)
  const msg = `SP tamale 2026-06
D18 H3 S8 A142 P6 R1 T1 MY OY CN`;

  const result = parseSMS(msg);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some(e => e.includes('B<books>')));
});

test('returns error for missing boolean field', () => {
  // Missing C (challenge)
  const msg = `SP tamale 2026-06
D18 H3 S8 A142 P6 R1 T1 MY OY B54`;

  const result = parseSMS(msg);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some(e => e.includes('C<Y or N>')));
});

test('extracts spotId with hyphen correctly', () => {
  // Hypothetical spot id with hyphen — ensure regex handles it
  const msg = 'SP cape-coast 2026-06 D18 H3 S8 A142 P6 R1 T1 MY OY CN B54';
  const result = parseSMS(msg);
  assert.equal(result.ok, true);
  assert.equal(result.spotId, 'cape-coast');
});
