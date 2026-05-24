import { Hono } from 'hono';
import vapiRoutes from './routes/vapi';
import { getReservations } from './services/reservation';
import type { Bindings } from './types/bindings';

const app = new Hono<{ Bindings: Bindings }>();

// VAPI Server URL routes
app.route('/vapi', vapiRoutes);

// Health check
app.get('/health', (c) => c.json({ status: 'ok' }));

// Debug endpoint to inspect current reservations
app.get('/reservations', async (c) => {
  const reservations = await getReservations(c.env.DB);
  return c.json(reservations);
});

export default app;
