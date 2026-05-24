import { createMiddleware } from 'hono/factory';
import type { Bindings } from '../types/bindings';

/**
 * Verify the Authorization Bearer token sent by VAPI.
 *
 * If VAPI_SECRET_TOKEN is not set, verification is skipped
 * to allow frictionless local development.
 */
export const verifyVapiToken = createMiddleware<{ Bindings: Bindings }>(
  async (c, next) => {
    const authHeader = c.req.header('authorization');
    const expectedToken = c.env.VAPI_SECRET_TOKEN;

    if (!expectedToken) {
      await next();
      return;
    }

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const token = authHeader.slice(7);
    if (token !== expectedToken) {
      return c.json({ error: 'Forbidden' }, 403);
    }

    await next();
  }
);
