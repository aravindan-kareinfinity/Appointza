# WhatsApp CRM Phase 6 — Campaign Dispatch Engine, Workers & Reporting

## Prerequisites

Phases 2–5 must already be applied:

- `whatsapp_crm_phase2_*.sql` (connections, messages, webhook events)
- Phase 3 inbox / SignalR (no extra tables required beyond Phase 2)
- `whatsapp_crm_phase4_templates.sql`
- `whatsapp_crm_phase5_campaigns.sql`

## Schema

Apply:

```text
Database/whatsapp_crm_phase6_dispatch.sql
```

Extends (does not replace):

- `whatsapp_campaigns` — leases, started/paused/completed timestamps, aggregate counters
- `whatsapp_campaign_recipients` — processing status, lease, retries, provider timestamps
- `whatsapp_messages` — optional `campaign_id` / `campaign_recipient_id`

## Runtime

- `WhatsAppCampaignWorker` (`BackgroundService`) polls and claims work with `FOR UPDATE SKIP LOCKED`
- Configurable under `ApplicationSettings:whatsapp:campaign_worker` (see `appsettings.example.json`)
- Sends use organisation-scoped Meta credentials via `WhatsAppCloudApiClient.SendTemplateAsync`
- Credentials never leave the server; connection UI remains **Profile → WhatsApp**

## APIs

| Method | Path | Notes |
|--------|------|--------|
| POST | `/api/crm/whatsapp/campaigns/{id}/send` | Queues only (does not send synchronously) |
| POST | `/api/crm/whatsapp/campaigns/{id}/pause` | |
| POST | `/api/crm/whatsapp/campaigns/{id}/resume` | |
| POST | `/api/crm/whatsapp/campaigns/{id}/cancel` | Cancelling → Cancelled when idle |
| GET | `/api/crm/whatsapp/campaigns/{id}/report` | Aggregates + counters |
| GET | `/api/crm/whatsapp/campaigns/{id}/recipients` | Paginated recipient results |
| POST | `/api/crm/whatsapp/campaigns/{id}/recipients/{recipientId}/retry` | Safe recovery only |

All endpoints enforce JWT organisation ownership.

## Metrics language

- **Accepted** — Meta accepted the send request (`wamid` persisted)
- **Delivered / Read** — from verified webhook status events
- **Failed** — permanent or exhausted retry failure
- **Unknown** — uncertain network/provider outcome (no blind resend)

## Deployment checklist

1. Apply Phase 6 SQL on Postgres.
2. Ensure `whatsapp.app_secret` / `verify_token` remain configured for webhooks.
3. Deploy API with `WhatsAppCampaignWorker` registered (default in `ServicesConfiguration`).
4. Confirm multiple instances can run safely (SKIP LOCKED leases).
5. Smoke-test with a Meta test number: queue a 1-recipient campaign, confirm Inbox message + webhook delivery update.

## Remaining provider verification

End-to-end Meta acceptance/delivery must be verified against an authorized WhatsApp Business test number. Automated tests mock Meta HTTP and do not claim live delivery.
