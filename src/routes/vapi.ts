import { Hono } from 'hono';
import type { VapiServerRequest, VapiServerResponse } from '../types/vapi';
import * as reservationService from '../services/reservation';
import { verifyVapiToken } from '../middleware/auth';
import type { Bindings } from '../types/bindings';

const app = new Hono<{ Bindings: Bindings }>();

/**
 * VAPI Server URL webhook.
 *
 * VAPI POSTs here with a "tool-calls" message whenever the assistant
 * triggers one or more tool calls. We iterate over every call, route
 * to the appropriate handler, and return results so the assistant can
 * continue the conversation.
 */
app.post('/webhook', verifyVapiToken, async (c) => {
  const body = await c.req.json<VapiServerRequest>();
  const message = body.message;
  const db = c.env.DB;

  console.log('VAPI webhook received. type:', message.type);

  if (message.type !== 'tool-calls' && message.type !== 'tool-call') {
    console.log('Ignoring non-tool-calls message');
    return c.json({ results: [] });
  }

  if (!db) {
    console.error('DB binding is undefined');
    return c.json({ results: [{ toolCallId: 'unknown', name: 'unknown', result: 'Error: Database not configured' }] }, 500);
  }

  const toolCallList = message.toolCallList || (message as any).toolWithToolCallList?.map((t: any) => ({
    id: t.toolCall?.id,
    name: t.name,
    parameters: t.toolCall?.parameters,
  })) || [];

  console.log('Tool calls count:', toolCallList.length);

  const results: VapiServerResponse['results'] = [];

  for (const toolCall of toolCallList) {
    const args = toolCall.parameters;
    console.log('Tool call:', toolCall.name, 'params:', JSON.stringify(args));

    const toolName = toolCall.name.toLowerCase();
    try {
      if (toolName === 'checkavailability') {
        const available = await reservationService.checkAvailability(
          db,
          String(args.date),
          String(args.time),
          Number(args.partySize)
        );
        const result = available
          ? 'Available'
          : 'Fully booked. Please suggest another time.';
        console.log('checkAvailability result:', result);
        results.push({
          toolCallId: toolCall.id,
          name: toolCall.name,
          result,
        });
      } else if (toolName === 'makereservation') {
        const isAvailable = await reservationService.checkAvailability(
          db,
          String(args.date),
          String(args.time),
          Number(args.partySize)
        );
        console.log('makeReservation isAvailable:', isAvailable);

        if (!isAvailable) {
          results.push({
            toolCallId: toolCall.id,
            name: toolCall.name,
            result: 'Failed: The requested time slot is fully booked.',
          });
        } else {
          const reservation = await reservationService.makeReservation(db, {
            date: String(args.date),
            time: String(args.time),
            partySize: Number(args.partySize),
            name: String(args.name),
            phone: args.phone ? String(args.phone) : undefined,
          });
          console.log('makeReservation success:', reservation.id);
          results.push({
            toolCallId: toolCall.id,
            name: toolCall.name,
            result: `Reservation confirmed. Your reservation ID is ${reservation.id}.`,
          });
        }
      } else {
        results.push({
          toolCallId: toolCall.id,
          name: toolCall.name,
          result: `Unknown function: ${toolCall.name}`,
        });
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      console.error('Tool error:', toolCall.name, errorMsg);
      results.push({
        toolCallId: toolCall.id,
        name: toolCall.name,
        result: `Error: ${errorMsg}`,
      });
    }
  }

  console.log('Response results:', JSON.stringify(results));
  return c.json({ results });
});

export default app;
