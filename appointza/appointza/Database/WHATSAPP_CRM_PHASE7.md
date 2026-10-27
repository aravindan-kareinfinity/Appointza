# WhatsApp CRM Phase 7 — Booking, Appointment & Event Automations

## Prerequisites

Phases 2–6 must be applied (Cloud API, webhooks, templates, campaigns, dispatch worker).

## Schema

Apply:

```text
Database/whatsapp_crm_phase7_automations.sql
```

Creates:

- `whatsapp_automation_rules` — org rules (trigger, connection, approved template, delay/reminder)
- `whatsapp_automation_executions` — durable outbox with idempotency keys + leases

## Runtime

- `WhatsAppAutomationPublisher` — fire-and-forget enqueue after business commit
- `WhatsAppAutomationWorker` — SKIP LOCKED claim + `SendTemplateAsync` (same Cloud API client as Phase 6)
- Config: `ApplicationSettings:whatsapp:automation_worker` (see `appsettings.example.json`)

Does **not** create a second send engine. Messages land in `whatsapp_messages` and use the existing webhook status pipeline.

## UI

- Route: `/organization/crm/whatsapp/automations`
- Connection settings remain **Profile → WhatsApp**

## APIs

| Method | Path |
|--------|------|
| GET/POST | `/api/crm/whatsapp/automations` |
| GET/PUT | `/api/crm/whatsapp/automations/{id}` |
| POST | `/api/crm/whatsapp/automations/{id}/enable` |
| POST | `/api/crm/whatsapp/automations/{id}/disable` |
| GET | `/api/crm/whatsapp/automations/{id}/executions` |
| GET | `/api/crm/whatsapp/automation-executions` |
| GET | `/api/crm/whatsapp/automation-executions/{id}` |

## Domain hooks (implemented)

| Trigger | Source |
|---------|--------|
| `booking_created` / `booking_reminder` | `AppoinmentService.InsertTransaction` |
| `booking_rescheduled` | `AppoinmentService.UpdateTransaction` when `ishasreshedule` |
| `booking_confirmed` / `booking_completed` | `AppoinmentService.UpdateStatusTransaction` |
| `booking_cancelled` | `AppoinmentService.CancelAppointmentTransaction` (+ invalidate pending) |
| `payment_confirmed` | `PaymentService.VerifyPaymentTransaction` after trusted signature verify |
| `event_registration` / `event_reminder` | `EventBookingService.Insert` |
| `event_status_changed` | `EventBookingService.Update` |
| `event_cancelled` | `EventBookingService.DeleteTransaction` (+ invalidate pending) |

## Explicitly not migrated yet

- Legacy GrowAasan `SendBookingNotificationAsync` still runs alongside (org mobile notify). OTP Graph path unchanged.
- Payment fail / refund webhooks — no trusted handler to hook.
- Dedicated no-show status — use statuscode if your org defines it; no separate method.
- Event venue-change — no distinct domain event beyond booking update.

## Deployment checklist

1. Apply Phase 7 SQL.
2. Deploy API with `WhatsAppAutomationWorker` registered.
3. Connect WhatsApp under Profile; sync/approve templates.
4. Create an enabled rule; create a test booking; confirm execution history + Inbox message.
5. Verify Meta delivery webhook updates execution `provider_status`.

## Remaining verification

Live Meta send/delivery must be confirmed on an authorized test number. Automated tests cover trigger catalog and idempotency key policy; they mock Meta HTTP.
