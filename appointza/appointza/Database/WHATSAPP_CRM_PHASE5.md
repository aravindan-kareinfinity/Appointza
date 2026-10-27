# WhatsApp CRM Phase 5 — Campaign Builder & Audience Targeting

## Route

- **CRM → WhatsApp Campaigns** → `/organization/crm/whatsapp-campaigns`
- Connection settings remain under **Profile → WhatsApp**
- Templates: `/organization/crm/templates`

## Schema

Apply:

```text
Database/whatsapp_crm_phase5_campaigns.sql
```

Creates:

- `whatsapp_communication_consent` — explicit opt-in / opt-out (phone alone is not consent)
- `whatsapp_campaigns` — draft/ready/scheduled metadata (no dispatch)
- `whatsapp_campaign_recipients` — eligibility snapshot for audit / Phase 6

## APIs

| Method | Path |
|--------|------|
| GET | `/api/crm/whatsapp/campaigns` |
| GET | `/api/crm/whatsapp/campaigns/{id}` |
| POST | `/api/crm/whatsapp/campaigns` |
| PUT | `/api/crm/whatsapp/campaigns/{id}` |
| POST | `/api/crm/whatsapp/campaigns/audience/preview` |
| POST | `/api/crm/whatsapp/campaigns/{id}/validate` |
| POST | `/api/crm/whatsapp/campaigns/{id}/preview` |
| POST | `/api/crm/whatsapp/campaigns/{id}/schedule` |
| POST | `/api/crm/whatsapp/campaigns/{id}/cancel` |

Organisation, connection, and template ownership are resolved server-side from the JWT.

## Consent rules

- **Marketing** campaigns require `whatsapp_communication_consent.status = opted_in` for the purpose.
- Opt-outs always exclude.
- Unknown consent excludes marketing audiences; does not invent consent from bookings or phone presence.
- Populate consent rows via ops/import/webhook STOP handling (Phase 6+) before marketing campaigns can reach recipients.

## Scheduling

`POST .../schedule` stores `scheduled_at` (UTC) and status `scheduled` only.

**No messages are sent in Phase 5.** Phase 6 adds the durable queue, worker, rate limits, and delivery reporting.

## Out of scope

Bulk dispatch, workers, delivery metrics, booking automation, fake sent/delivered statuses.
