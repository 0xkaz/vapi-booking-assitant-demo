# Booking Assistant Demo

A voice reservation assistant demo built with [VAPI](https://vapi.ai/), [Hono](https://hono.dev/), and [Cloudflare Workers](https://workers.cloudflare.com/).

## Overview

This application runs as a **VAPI Server URL** (webhook) on Cloudflare Workers. It handles restaurant reservation requests from a voice AI assistant.

The server exposes two tool functions:

- `checkAvailability` — checks whether a requested date/time slot has an open table.
- `makeReservation` — books a table and returns a reservation ID.

Reservations are stored **in-memory** for demonstration purposes.

## Prerequisites

- Node.js v18+
- npm
- A [VAPI](https://vapi.ai/) account
- A [Cloudflare](https://www.cloudflare.com/) account
- A domain managed by Cloudflare (`0xkaz.com`)

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure local secrets for development
cp .dev.vars.example .dev.vars
# Edit .dev.vars if you want to test token verification locally.

# 3. Start the local dev server
npm run dev
```

The local server will be available at `http://localhost:8787` by default.

## Deploy

### 1. Configure the secret token

```bash
npx wrangler secret put VAPI_SECRET_TOKEN
```

Enter the secret token you configured in the VAPI dashboard. This value is **not** committed to the repository.

### 2. Deploy to Cloudflare Workers

```bash
npm run deploy
```

The worker will be served on `https://booking-assitant-demo.0xkaz.com` (as configured in `wrangler.toml`).

## VAPI Dashboard Configuration

### 1. Create or edit an Assistant

Go to the VAPI dashboard and open the assistant you want to connect.

### 2. Set the Server URL

In the assistant settings, set the **Server URL** to:

```
https://booking-assitant-demo.0xkaz.com/vapi/webhook
```

### 3. (Recommended) Enable Secret Token

In the Server URL section, generate a **Secret Token** and configure it via Wrangler:

```bash
npx wrangler secret put VAPI_SECRET_TOKEN
```

The worker will reject requests that do not present this token in the `Authorization: Bearer <token>` header.

### 4. Register Tool Functions

Add the following functions under the assistant's **Tools** (Functions) section.

#### `checkAvailability`

| Parameter  | Type   | Required | Description           |
|------------|--------|----------|-----------------------|
| `date`     | string | Yes      | ISO date (YYYY-MM-DD) |
| `time`     | string | Yes      | 24-hour time (HH:mm)  |
| `partySize`| number | Yes      | Number of guests      |

**Description for the model:**
> Check whether a restaurant table is available for a given date and time. Call this before attempting to make a reservation.

#### `makeReservation`

| Parameter  | Type   | Required | Description           |
|------------|--------|----------|-----------------------|
| `date`     | string | Yes      | ISO date (YYYY-MM-DD) |
| `time`     | string | Yes      | 24-hour time (HH:mm)  |
| `partySize`| number | Yes      | Number of guests      |
| `name`     | string | Yes      | Name of the guest     |
| `phone`    | string | No       | Contact phone number  |

**Description for the model:**
> Make a restaurant reservation. Only call this after confirming availability with checkAvailability.

## API Endpoints

| Method | Path                | Description                          |
|--------|---------------------|--------------------------------------|
| GET    | `/health`           | Health check                         |
| GET    | `/reservations`     | List all in-memory reservations      |
| POST   | `/vapi/webhook`     | VAPI Server URL (tool call handler)  |

## Project Structure

```
src/
├── index.ts              # Hono app entry point
├── middleware/
│   └── auth.ts           # VAPI Bearer token verification
├── routes/
│   └── vapi.ts           # Webhook route handlers
├── services/
│   └── reservation.ts    # In-memory reservation logic
├── types/
│   ├── bindings.ts       # Cloudflare Workers environment types
│   └── vapi.ts           # VAPI payload TypeScript types
```

## Scripts

| Script          | Description                              |
|-----------------|------------------------------------------|
| `npm run dev`   | Start local dev server via Wrangler      |
| `npm run deploy`| Deploy to Cloudflare Workers             |
| `npm run types` | Generate TypeScript types from Wrangler  |

## Notes

- **In-memory storage:** On Cloudflare Workers, global variables persist only within a single isolate. For production, replace the in-memory store with [Cloudflare KV](https://developers.cloudflare.com/kv/), [D1](https://developers.cloudflare.com/d1/), or [Durable Objects](https://developers.cloudflare.com/durable-objects/).
- **Custom domain:** The custom domain is configured in `wrangler.toml`. Ensure the domain is active and proxied through Cloudflare before deploying.

## License

MIT
