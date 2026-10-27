# WhatsApp CRM Phase 4 — Template Management

## Route

- CRM nav: **WhatsApp Templates** → `/organization/crm/templates`
- Alias: `/organization/crm/whatsapp/templates` redirects to the primary route
- Connection settings remain under **Profile → WhatsApp**

## Schema

Apply after Phase 1 integrations SQL:

```text
Database/whatsapp_crm_phase4_templates.sql
```

Extends existing `message_templates` (does not create a second table):

- `whatsapp_connection_id`, `language_code`, `category`, `header_type`
- `components_json`, `provider_status`, `rejection_reason`
- `variable_mappings_json`, `last_synced_at`, `is_provider_managed`, `is_archived`
- Unique indexes on provider id and (name + language) per connection

## APIs

| Method | Path |
|--------|------|
| GET | `/api/crm/whatsapp/templates` |
| GET | `/api/crm/whatsapp/templates/{id}` |
| POST | `/api/crm/whatsapp/templates/sync` |
| POST | `/api/crm/whatsapp/templates` |
| POST | `/api/crm/whatsapp/templates/{id}/submit` |
| POST | `/api/crm/whatsapp/templates/{id}/refresh-status` |

Organisation + WABA + access token are resolved server-side from the JWT and encrypted `integration_secrets`. React never receives tokens.

New templates submitted to Meta remain **pending** until Meta reports approval. Local drafts are never auto-marked approved.

## Meta permissions

The connected access token / system user needs WhatsApp template management permissions on the WABA (e.g. ability to call `/{waba-id}/message_templates`).

Graph version: `ApplicationSettings:whatsapp:api_version` (same as Phase 2).

## Out of scope

Campaigns, bulk send, booking automation, media upload for HEADER media assets beyond declaring format, email templates UI.

## Real-provider verification still required

Automated tests mock Meta and cover validation / status mapping / client API shapes. Production verification needs a connected WABA and Meta test templates.
