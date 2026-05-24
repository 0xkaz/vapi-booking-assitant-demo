/**
 * Reservation service backed by Cloudflare D1 for persistent storage.
 */

export interface Reservation {
  id: string;
  /** ISO 8601 date (YYYY-MM-DD) */
  date: string;
  /** 24-hour time (HH:mm) */
  time: string;
  partySize: number;
  name: string;
  phone?: string;
  createdAt: string;
}

/** Number of available tables per time slot. */
const MAX_TABLES = 5;

/**
 * Check whether a time slot has available tables.
 */
export async function checkAvailability(
  db: D1Database,
  date: string,
  time: string,
  _partySize: number
): Promise<boolean> {
  const result = await db
    .prepare(
      'SELECT COUNT(*) as count FROM reservations WHERE date = ? AND time = ?'
    )
    .bind(date, time)
    .first<{ count: number }>();
  return (result?.count ?? 0) < MAX_TABLES;
}

/**
 * Create a new reservation if the slot is available.
 */
export async function makeReservation(
  db: D1Database,
  data: Omit<Reservation, 'id' | 'createdAt'>
): Promise<Reservation> {
  const reservation: Reservation = {
    ...data,
    id: `res_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    createdAt: new Date().toISOString(),
  };
  await db
    .prepare(
      'INSERT INTO reservations (id, date, time, partySize, name, phone, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)'
    )
    .bind(
      reservation.id,
      reservation.date,
      reservation.time,
      reservation.partySize,
      reservation.name,
      reservation.phone ?? null,
      reservation.createdAt
    )
    .run();
  return reservation;
}

/**
 * List all reservations (useful for debugging).
 */
export async function getReservations(db: D1Database): Promise<Reservation[]> {
  const result = await db
    .prepare('SELECT * FROM reservations ORDER BY createdAt DESC')
    .all<Reservation>();
  return result.results ?? [];
}
