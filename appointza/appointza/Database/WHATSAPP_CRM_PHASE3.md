# WhatsApp CRM Phase 3 — Inbox UI & Real-Time

## Route

- Primary: `/organization/crm/whatsapp/inbox`
- Legacy redirect: `/organization/crm/inbox` → primary
- Nav label: **WhatsApp Inbox**
- Connection settings remain under **Profile → WhatsApp**

## APIs used

| Method | Path |
|--------|------|
| GET | `/api/crm/whatsapp/conversations?search&status&unread_only&limit&offset` |
| GET | `/api/crm/whatsapp/conversations/{id}` |
| GET | `/api/crm/whatsapp/conversations/{id}/messages` |
| POST | `/api/crm/whatsapp/conversations/{id}/messages` |
| PATCH | `/api/crm/whatsapp/conversations/{id}` (`mark_read`, `status`, `assigned_user_id`) |

Organisation ownership is resolved from the authenticated JWT. The client never supplies Meta credentials.

## SignalR

- Hub path: `/hubs/whatsapp-crm`
- Auth: Bearer header or `access_token` query (WebSocket)
- Clients are added only to `wa-org:{organisationId}` from the JWT
- Events: `conversationUpdated`, `messageUpserted`, `messageStatusChanged`
- Payloads never include access tokens

When SignalR is unavailable, the Inbox polls every 20 seconds.

## Deploy notes

1. Ensure Phase 2 schema (`whatsapp_crm_phase2.sql`) is applied.
2. No new secrets for Phase 3 beyond Phase 2 Meta config.
3. CORS already allows credentials; SignalR negotiate uses the same origin policy.
4. Frontend package: `@microsoft/signalr`

## Known gaps / later work

- Clearing `assigned_user_id` to null is not supported by the current PATCH (only set when provided).
- Linking a conversation to a customer (`customer_id`) is display-only in this phase.
- Media send/preview is out of scope; unsupported inbound types show a type placeholder.
- Template/campaign features remain later phases.

## Real-provider verification

Automated tests cover API client behaviour and message dedupe. End-to-end inbound/outbound/live ticks still require a Meta test number and connected org credentials.
