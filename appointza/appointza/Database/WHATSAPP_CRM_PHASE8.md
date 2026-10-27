# WhatsApp CRM — Phase 8 Production Hardening

## Launch recommendation

**Ready with limitations** for a controlled pilot only — not unrestricted production messaging.

Evidence-based limits (still unverified or incomplete against live Meta traffic):

- Meta app review / production WABA permissions were not validated in this environment.
- End-to-end restore of production backups was not executed here.
- Load tests against a representative dataset were not run in this session.
- Provider integration tests require authorized Meta test accounts (mocked Graph calls only in CI).

Do not enable broad marketing campaigns until staging sign-off and a consenting pilot org succeed.

---

## 1. Audit summary (verified in repository)

### Implemented and verified (code + schema present)

| Area | Evidence |
|------|----------|
| Org WhatsApp connection + encrypted secrets | `OrganisationCommunicationIntegrationService`, `SecretProtector`, Profile→WhatsApp UI |
| Shared webhook + durable accept | `WhatsAppWebhookController`, `whatsapp_webhook_events`, `WhatsAppWebhookWorker` |
| Signature validation (HMAC + FixedTimeEquals) | `WhatsAppWebhookSecurity` |
| Inbox + SignalR org groups | `WhatsAppCrmHub`, CRM APIs |
| Templates / campaigns / dispatch / automations | Phase 4–7 services + SQL |
| Consent on campaign + automation | `whatsapp_communication_consent` checks before send |
| SKIP LOCKED workers | Campaign + automation claim SQL |

### Implemented but insufficiently tested (before Phase 8)

- Cross-tenant negative paths on integration APIs
- Inbox `SendText` opt-out
- STOP keyword → consent
- Webhook duplicate `provider_event_key` under concurrency
- Global outbound pause
- SignalR `SubscribeConversation` ownership
- Health backlog metrics

### Missing / unverified before Phase 8 fixes

- Client `organisation_id` trusted over JWT on integration service (**critical**, fixed)
- Unique constraint enforcement on webhook event keys (**critical**, migration + ON CONFLICT)
- Global kill-switch for outbound (**high**, config + DB)
- Production refusal of empty `jwtsecret` (**high**)

### Security findings (pre-fix → status)

| Severity | Issue | Fix |
|----------|-------|-----|
| Critical | Integration `ResolveOrganisationId` preferred client org | JWT-only; mismatch → 403 |
| Critical | Inbox send ignored opt-out | `IsOptedOutAnyPurpose` before send |
| Critical | No STOP → consent | Inbound STOP keywords upsert `opted_out` |
| High | Non-unique webhook event keys | Phase 8 unique index + idempotent accept |
| High | No global outbound pause | `whatsapp.outbound_enabled` + `whatsapp_outbound_control` |
| High | SecretProtector silent empty key | Fail outside Development |
| Medium | Verify-token non-constant-time | `FixedTimeEqualsUtf8` |
| Medium | Signature length mismatch could throw | Length guard before `FixedTimeEquals` |
| Medium | Hub conversation subscribe without ownership | DB ownership check |
| Medium | `/health` lacked WhatsApp queues | `WhatsAppCrmHealthCheck` |

---

## 2. Database migration

Apply on a non-production database first:

```text
Database/whatsapp_crm_phase8_hardening.sql
```

Sequence (if not already applied): phase2 → phase3 → … → phase7 → **phase8**.

**Rollback / recovery**

- Unique index: `DROP INDEX IF EXISTS uq_wa_webhook_events_provider_event_key;`
- Outbound control: `DROP TABLE IF EXISTS whatsapp_outbound_control;` (or set `outbound_enabled = true`)
- Deduplicate `DELETE` is irreversible for duplicate webhook rows; prefer backup restore for full rollback.
- Application code that uses `ON CONFLICT` requires the unique index — deploy migration before or with the API build.

---

## 3. Configuration (no real secrets)

Server-side (`ApplicationSettings` / env / secrets store):

| Key | Purpose |
|-----|---------|
| `jwtsecret` | JWT + SecretProtector key material (required outside Development) |
| `whatsapp:app_secret` | Meta `X-Hub-Signature-256` |
| `whatsapp:verify_token` | Meta GET challenge |
| `whatsapp:api_version` | Graph version (e.g. `v22.0`) |
| `whatsapp:base_url` | Default `https://graph.facebook.com` |
| `whatsapp:outbound_enabled` | Config kill-switch (`false` pauses all Meta sends) |
| Worker options | `whatsapp:webhook_worker`, `campaign_worker`, `automation_worker` |

Runtime pause (does not delete jobs):

```sql
UPDATE whatsapp_outbound_control
SET outbound_enabled = FALSE,
    pause_reason = 'incident',
    updated_at = NOW()
WHERE id = 1;
```

Resume: set `outbound_enabled = TRUE`.

---

## 4. Deployment checklist

1. Configure secrets via environment / vault — never commit.
2. Apply SQL migrations through phase 8.
3. Deploy API (hosts webhook + CRM + SignalR + background workers).
4. Register HTTPS webhook: `https://<api-host>/api/webhooks/whatsapp`.
5. Complete Meta GET verification; subscribe WABA fields (`messages`, `message_template_status_update` as needed).
6. Confirm app permissions / review status for intended use cases.
7. Connect one internal org via Profile → WhatsApp.
8. Smoke: inbound text → inbox; outbound reply; template sync; paused outbound; STOP keyword.
9. Monitor `/health` (`whatsapp-crm` check) and structured logs (signature failures, unknown phone_number_id, backlog).
10. Pilot → limited traffic → gradual rollout.

---

## 5. Monitoring alerts (recommended)

- Webhook signature failures (rate)
- Unknown `phone_number_id` (events with null `organisation_id`)
- Webhook backlog (`webhook_pending` from health data)
- Campaign recipients stuck in `processing` / oldest `next_attempt_at`
- Dead-letter / max-retry failures
- Meta rate-limit (`is_rate_limited`) send outcomes
- Credential decrypt / connection inactive errors
- `outbound_enabled = false` during non-incident windows

Log correlation: event id, organisation id, campaign id, provider message id — never access tokens or full message bodies in high-volume logs.

---

## 6. Backup and recovery

| Scenario | Action |
|----------|--------|
| DB backup | Use existing Postgres backup job; test restore on staging before go-live |
| Accepted unprocessed webhooks | Rows in `received`/`failed` with retry budget; worker recovers via SKIP LOCKED |
| Expired campaign leases | `RecoverExpiredCampaignLeases` returns recipients to claimable |
| Interrupted campaigns | Pause/cancel APIs; global outbound pause leaves rows intact |
| Credential rotation | UpsertWhatsApp with new token; disconnect clears active connection without returning secrets |

Do not claim DR is verified until a restore test is recorded for the target environment.

---

## 7. Controlled rollout

1. Internal/dev organisation  
2. Authorized Meta test numbers  
3. Small consenting pilot organisation  
4. Limited production traffic  
5. Gradual expansion  

Feature pause: config `outbound_enabled` or DB control table.

---

## 8. Files touched in Phase 8

- `Database/whatsapp_crm_phase8_hardening.sql`
- `Database/WHATSAPP_CRM_PHASE8.md` (this file)
- `Utils/SecretProtector.cs`
- `Utils/ApplicationEnvironment.cs` (`outbound_enabled`)
- `Services/WhatsAppWebhookSecurity.cs`
- `Services/WhatsAppOutboundGuard.cs`
- `Services/WhatsAppCrmHealthCheck.cs`
- `Services/WhatsAppCrmService.cs`
- `Services/WhatsAppCampaignDispatchService.cs`
- `Services/WhatsAppAutomationService.cs`
- `Services/OrganisationCommunicationIntegrationService.cs`
- `Hubs/WhatsAppCrmHub.cs`
- `ApiControllers/WhatsAppWebhookController.cs`
- `ApiControllers/WhatsAppCrmController.cs`
- `ApiControllers/OrganisationCommunicationIntegrationController.cs`
- `ServicesConfiguration.cs`, `Program.cs`
- `appointza.Tests/WhatsAppPhase8HardeningTests.cs`
