# WhatsApp CRM Phase 2 — Webhook, Org-Scoped Send, Persistence

## Scope

Phase 2 delivers backend-only messaging foundations. React inbox UI is deferred to Phase 3.

## Schema

Apply:

```text
Database/whatsapp_crm_phase2.sql
```

Creates / extends:

- Unique non-empty `whatsapp_connections.phone_number_id`
- `whatsapp_conversations`
- `whatsapp_messages`
- `whatsapp_webhook_events` (durable accept queue)

Inspect duplicates before applying the unique index:

```sql
SELECT phone_number_id, COUNT(*) AS cnt
FROM whatsapp_connections
WHERE phone_number_id IS NOT NULL AND btrim(phone_number_id) <> ''
GROUP BY phone_number_id
HAVING COUNT(*) > 1;
```

Do not auto-delete live credentials — resolve ownership manually first.

## Configuration (`ApplicationSettings:whatsapp`)

| Key | Purpose |
|-----|---------|
| `app_secret` | Meta app secret for `X-Hub-Signature-256` |
| `verify_token` | Meta GET webhook challenge token |
| `api_version` | Graph API version (e.g. `v22.0`) |
| `base_url` | Graph base URL (default `https://graph.facebook.com`) |
| `webhook_worker.poll_interval_ms` | Worker poll interval |
| `webhook_worker.batch_size` | Events claimed per poll |
| `webhook_worker.max_retries` | Max failed-event retries |

Never put secrets in frontend env files or API responses.

## Endpoints

| Method | Path | Auth |
|--------|------|------|
| GET | `/api/webhooks/whatsapp` | Public (Meta verify) |
| POST | `/api/webhooks/whatsapp` | Public (signature required) |
| GET | `/api/crm/whatsapp/conversations` | Authenticated |
| GET | `/api/crm/whatsapp/conversations/{id}` | Authenticated |
| GET | `/api/crm/whatsapp/conversations/{id}/messages` | Authenticated |
| POST | `/api/crm/whatsapp/conversations/{id}/messages` | Authenticated |
| PATCH | `/api/crm/whatsapp/conversations/{id}` | Authenticated |

Tenant resolution for webhooks uses `metadata.phone_number_id` → `whatsapp_connections` → `organisation_id`.

Outbound CRM sends use the conversation’s connection credentials only (never frontend-supplied tokens or phone-number IDs).

## Message status rules

Rank: `queued` → `sent` → `delivered` → `read`.  
`failed` is terminal. Duplicates and downgrades are ignored.

Cloud API acceptance (`sent`) is not delivery proof.

## Legacy senders (unchanged in Phase 2)

| Call site | Path | Notes |
|-----------|------|-------|
| OTP | `integrations/sms/Controllers/OtpController.cs` → `WhatsAppService.SendOtpAsync` | Global Graph OTP template |
| Auth SMS OTP | `AuthService` → `SmsService.SendOtp` | Separate SMS path |
| Booking create | `AppoinmentService` → `WhatsAppService.SendBookingNotificationAsync` | **GrowAasan** |
| Event booking | `EventBookingService` → `SendBookingNotificationAsync` / `SendStatusNotificationAsync` | **GrowAasan** |
| Status notifications | `WhatsAppService.SendStatusNotificationAsync` | **GrowAasan** |
| Global text | `WhatsAppService.SendTextMessageAsync` | Global `ApplicationSettings:whatsapp` |

CRM messaging must not use these paths. Booking/OTP migration to org-scoped Cloud API is a later phase.

## Automated tests

Project: `appointza/appointza.Tests`

Covered in unit tests:

- Webhook verify-token accept/reject rules
- HMAC-SHA256 signature accept/reject (exact raw body)
- Status transition / out-of-order / terminal `failed` rules
- WA ID normalization
- Bearer token redaction in sanitized errors

Integration scenarios that need a database + Meta test number (not claimed green here):

- phone_number_id → organisation resolution and unknown-id ignore
- inbound create + duplicate provider message idempotency
- outbound send with org credentials
- cross-org conversation access denial
- unique phone_number_id constraint
- worker retry budget for transient vs permanent failures

## Real-provider verification still required

Automated unit tests do not call Meta. Production verification still needs:

- Meta app webhook subscription to `/api/webhooks/whatsapp`
- Connected org credentials in Profile → WhatsApp
- End-to-end inbound + outbound with a Meta test number

Do not claim production delivery without that check.

## Deploy checklist

1. Set `ApplicationSettings:whatsapp:app_secret`, `verify_token`, `api_version`, `base_url`, `webhook_worker.*` via env/secrets.
2. Run duplicate phone_number_id inspection SQL, resolve conflicts manually.
3. Apply `Database/whatsapp_crm_phase2.sql`.
4. Point Meta webhook to `https://<host>/api/webhooks/whatsapp`.
5. Confirm existing Profile → WhatsApp connection save/load still works.
