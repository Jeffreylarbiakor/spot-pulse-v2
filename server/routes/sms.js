/**
 * POST /api/sms
 *
 * Accepts inbound SMS / WhatsApp messages from a gateway (Africa's Talking,
 * Twilio, or any webhook that can POST a JSON body) and converts them into
 * check-in submissions via the active adapter.
 *
 * Expected request body (all fields optional except `body`):
 *   {
 *     body:   string   — raw message text from the phone
 *     from:   string   — sender phone number (stored as submittedBy if no rcId)
 *     rcId:   string   — RC identifier if the gateway resolves it from the number
 *     source: string   — "sms" | "whatsapp" (default "sms")
 *   }
 *
 * Africa's Talking webhook shape (accepted directly):
 *   { text, from, to, id, date }
 *   → mapped: text → body, from → from, id → gatewayId
 *
 * Twilio webhook shape (accepted directly):
 *   { Body, From, MessageSid }
 *   → mapped: Body → body, From → from, MessageSid → gatewayId
 *
 * Returns:
 *   200  { id, score, pillars, updated, spotId, month }   — success
 *   200  { id, idempotent: true }                         — duplicate
 *   400  { error, hint, errors? }                         — parse or validation failure
 *   403  { error }                                         — cross-cluster write attempt
 */

import { randomUUID } from 'node:crypto';
import { parseSMS, formatHelpText } from '../../shared/core/sms-parser.js';

// Build spotId → rcId lookup (passed in at registration time)
let SPOT_TO_RC = {};

export function registerSmsRoute(app, adapter, spotToRc) {
  SPOT_TO_RC = spotToRc;

  app.post('/api/sms', async (req, reply) => {
    const raw = req.body;

    // Normalise across gateway shapes
    const messageText = raw?.body ?? raw?.text ?? raw?.Body ?? '';
    const from        = raw?.from ?? raw?.From ?? null;
    const gatewayId   = raw?.gatewayId ?? raw?.id ?? raw?.MessageSid ?? null;
    const rcId        = raw?.rcId ?? null;
    const source      = raw?.source ?? (raw?.Body ? 'whatsapp' : 'sms');

    if (!messageText) {
      return reply.code(400).send({
        error: 'Missing message body',
        hint:  formatHelpText(),
      });
    }

    // Parse the SMS
    const parsed = parseSMS(messageText);

    if (!parsed.ok) {
      return reply.code(400).send({
        error:  'Could not parse message',
        errors: parsed.errors,
        hint:   formatHelpText(),
      });
    }

    const { spotId, month, inputs } = parsed;

    // Scope enforcement: if rcId is known, it must own this spot
    if (rcId) {
      const owningRc = SPOT_TO_RC[spotId];
      if (owningRc && owningRc !== rcId) {
        return reply.code(403).send({ error: 'Spot not in your cluster' });
      }
    }

    const submission = {
      id:          randomUUID(),
      spotId,
      month,
      submittedBy: rcId ?? from ?? null,
      submittedAt: new Date().toISOString(),
      source,
      inputs,
      ...(gatewayId ? { gatewayId } : {}),
    };

    const result = await adapter.saveCheckin(submission);

    return reply.code(200).send({
      ...result,
      spotId,
      month,
    });
  });
}
