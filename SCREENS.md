# Appointza — full project guide

This file is the **product + technical overview** of Appointza: what it does, who uses it, pros and cons, how the system is built, what each module does, and **every screen** with what to do on it.

Related: [README.md](./README.md) (how to run and build).

---

## 1. What is Appointza?

**Appointza** is a multi-tenant online booking and business-operations platform for India-focused service businesses (salons, clinics, spas), event hosts, and hospitality (rooms / stays).

It lets:

| Party | Core value |
|-------|------------|
| **Customers** | Discover businesses, book slots / events / rooms online, pay (Razorpay), manage bookings, leave reviews |
| **Organisations** | Run multi-location operations: catalogue, timings, staff, CRM, leads, public website, payments, loyalty, billing |
| **Staff** | Day-to-day bookings and clients with permission-limited access |
| **Platform (Appointza)** | SaaS billing via plans / credit wallet; marketing site; OTP, WhatsApp, push |

**One-liner:** slot-based booking + event booking + room booking, with org dashboards, custom booking websites, and Razorpay payments — one React SPA + one .NET API.

### What the product is *not*

- Not a full school ERP (Campusza is a separate, partial vertical in the same monorepo)
- Not a generic e-commerce store
- Not only a calendar widget — it includes CRM, staff permissions, templates, loyalty, and billing

---

## 2. Who uses it (roles)

| Role | How identified | Main UI |
|------|----------------|---------|
| **Guest** | Not logged in | Marketing, browse, start booking |
| **Customer (user)** | Logged in; no org (or `user_type` = user) | `/user/*` |
| **Organisation owner** | Has `organisationid` | `/organization/*` (full settings) |
| **Staff** | Location-scoped; permission flags | Same org UI, filtered nav |
| **Platform admin** | Backend `AdminController` | Mostly API; little dedicated SPA UI |

**Registration** supports two paths: **Customer** or **Organisation** (plan, business type, first location).

---

## 3. What the product does (capabilities)

### 3.1 Customer side

- Browse services, events, organisations (and niche turf directory)
- Book **services** (date + services + time slot)
- Book **events** (tickets / registration forms)
- Book **rooms / stays** (check-in / check-out)
- Pay online when the org requires it (**Razorpay**)
- Use org **public website / subdomain / template**
- Manage appointments, event bookings, room bookings
- Leave reviews; edit profile; OTP / Google login

### 3.2 Organisation side

- Multi-location business profile
- Catalogue: services, events, rooms (depending on offerings)
- Business hours, slots, leave dates
- Unified bookings hub (calendar / lists for all kinds)
- Appointment records (notes, tasks, files)
- Leads / enquiries
- Client CRM + book-on-behalf + walk-in (on-spot) registration
- Staff with granular permissions
- Public booking site (templates + visual builder + custom subdomain)
- Media assets for the site
- Razorpay credentials (customer pays the **org**)
- Loyalty program
- Credit wallet / subscription top-up (org pays **Appointza**)
- Optional API integration tokens for external CRM sync
- Hospitality content (policies, packages, room status, etc.)

### 3.3 Platform / infra features

- WhatsApp / SMS OTP
- Push notifications (Firebase / VAPID)
- File uploads, geocoding for locations
- Capacitor wrappers for mobile (Android / iOS) around the same web UI

---

## 4. How a booking works (end-to-end)

### Service appointment

1. Customer opens org site or `/book-appointment/:orgId/:locationId`
2. Selects services, date, available slot
3. Logs in if needed
4. If payment required → `POST /api/Payment/CreateOrder` → Razorpay Checkout → `POST /api/Payment/VerifyPayment`
5. Appointment created / confirmed; appears in user + org bookings

### Event

1. Open `/user/events/:eventId/book`
2. Fill seats / custom form
3. Pay if required (same Razorpay pattern)
4. Booking listed under my event bookings; org sees event participants

### Room / stay

1. Open `/book` with room / date context
2. Quote → confirm guest details
3. Org manages under bookings / hospitality

### Org desk booking

1. Clients → find or register walk-in
2. Book on behalf of client (online pay can be skipped)

---

## 5. Pros and cons

### Pros

| Strength | Why it matters |
|----------|----------------|
| **Three booking modes in one product** | Services + events + rooms cover many SMBs without separate tools |
| **Org-owned public sites** | Templates, builder, subdomain — customers book on branded pages |
| **Multi-location + staff permissions** | Real ops for chains / clinics with desk staff |
| **Razorpay wired for India** | Org keys for customer checkout; platform keys for wallet/billing |
| **CRM + leads + book-on-behalf** | Not only self-serve; supports walk-ins and phone bookings |
| **Single SPA + single API** | One deploy folder (`build-appointza.ps1`); one URL config file |
| **Mobile path via Capacitor** | Reuse the same UI for app shells |
| **Credit wallet / plans** | SaaS monetisation built into the product |

### Cons / risks

| Limitation | Impact |
|------------|--------|
| **Large monolith SPA** | Many screens and offerings in one app; complexity and learning curve for new orgs |
| **Campusza half-wired** | School portal hub exists; many sub-routes may 404 |
| **Some marketing / demo pages are static or light** | Blog, some prefs are presentational or local-toast only |
| **Secrets in deploy configs** | Historical builds may ship `appsettings` / keys — needs careful production hygiene |
| **CORS / Swagger / open APIs** | Dev-friendly; must be locked down for production |
| **Staff permission model is complex** | Many `editandview*` flags + legacy privilege maps — easy to misconfigure |
| **Webzys / other products mixed in monorepo history** | Shared API surface; keep Appointza vs other verticals clear |
| **Razorpay secret historically in client `config.js`** | Dangerous if still present — secrets must stay server-side only |
| **Onboarding lock** | Good for setup quality; can frustrate if steps fail or are unclear |

---

## 6. Architecture (what everything is)

```
appointza/                          monorepo root
├── appointza-ui-canvas/            React + Vite + TypeScript SPA (all screens)
├── appointza/appointza/            ASP.NET Core 8 API + wwwroot host
├── build-appointza.ps1             Production build → D:\aravindan\build\appointza
├── run-all.ps1                     Local multi-app run helper
├── README.md                       Build / URL config
└── SCREENS.md                      This guide
```

| Layer | Tech | Responsibility |
|-------|------|----------------|
| **UI** | React, Vite, React Router, shadcn/Radix | All screens, booking UX, org dashboard |
| **API** | ASP.NET Core (`appointza.exe`) | Auth, bookings, payments, org CRUD, sites |
| **DB** | PostgreSQL (via app services / SQL scripts) | Tenants, bookings, payments, credentials |
| **Payments** | Razorpay | Orders + signature verify |
| **Comm** | OTP, WhatsApp, SMS, Firebase push | Login and notifications |
| **Deploy** | Single folder: exe + `wwwroot` + `appointza-urls.json` | API serves UI + JSON URL config |

**URL config (runtime):** one file next to the exe — `appointza-urls.json`:

- `backendListen` → which port the server binds
- `frontendApiBaseUrl` → what the browser calls (empty = same origin)

---

## 7. Backend modules (what each area does)

| Area | Controllers / folders (examples) | Purpose |
|------|----------------------------------|---------|
| Appointments | `AppoinmentController`, timing / slot services | Create, list, status, book slots |
| Events | `EventController`, `EventBookingController` | Event catalogue + registrations |
| Rooms / hospitality | `OrganisationRoomController`, guest hospitality APIs | Room types, stays, content |
| Org & locations | `OrganisationController`, `OrganisationLocationController` | Tenant, branches |
| Staff | `StaffController` | Staff CRUD + permissions |
| Services catalogue | `OrganisationServicesController` | Services, packages, pricing |
| Clients / CRM | Client flows via org APIs + timeline/tasks | Customer history |
| Leads | `EnquiryController` | Contact enquiries |
| Payments | `PaymentController`, `PaymentGatewayCredentialsController`, `integrations/Razorpay` | Create/verify orders; org Razorpay keys |
| Subscription / wallet | `SubscriptionController`, credit wallet services | Plans, top-up, recharge |
| Loyalty | `OrganisationLoyaltyController` | Loyalty rules / wallets |
| Public sites | `OrganisationSiteController`, `WebsiteController` | Templates / HTML sites |
| Auth | `AuthController`, `UsersController`, `OtpController` | Login, register, OTP |
| Files / geo | `FilesController`, `GeocodingController` | Uploads, maps |
| Reviews | `ReviewController` | Customer reviews |
| Integrations | `IntegrationController` | External API tokens |
| Campusza | `campusza/*` | School vertical (separate) |

**Important for mobile apps:** customer booking payments use `/api/Payment/CreateOrder` and `/api/Payment/VerifyPayment` (not only `/api/Razorpay/*`).

---

## 8. Frontend modules (what each UI area does)

| Folder / area | Purpose |
|---------------|---------|
| `src/pages/` | Route-level screens (this doc catalogues them) |
| `src/pages/user/` | Customer portal + appointment booking |
| `src/pages/organization/` | Org dashboard, CRM, settings, builder |
| `src/components/` | Shared UI, layouts, booking widgets |
| `src/services/` | API client helpers (payment, subscription, etc.) |
| `src/contexts/` | Auth and global app state |
| `public/appointza-urls.json` | Dev seed for URL config (build preserves deploy file) |
| `public/config.js` | Public client keys (maps, VAPID) — **not** API URLs |

Routes live in `src/App.tsx`.

---

## 9. Offering types (drives which screens appear)

| Offering | Customer books via | Org manages via |
|----------|--------------------|-----------------|
| **Services** | `/book-appointment/...` | Bookings + Services catalogue + Timing |
| **Events** | `/user/events/:id/book` | Bookings `?kind=events` + Events catalogue |
| **Rooms / stays** | `/book` | Bookings `?kind=rooms` + Hospitality |

Org “catalogue offerings” change sidebar labels and which booking kinds are shown.

---

## 10. Customer journey (happy path)

1. Land on marketing `/` or an org `/template/...` / subdomain  
2. Discover via `/explore`, `/services`, `/events`, `/organisations`  
3. Book service / event / room  
4. Login / OTP if required; pay if required  
5. Manage under `/user/dashboard`, appointments, my event/room bookings  
6. Review after completion  

---

## 11. Organisation journey (happy path)

1. Register as organisation → OTP  
2. Onboarding: custom domain → catalogue → timing → website template  
3. Profile: payment (Razorpay), staff, locations, loyalty, billing  
4. Daily: dashboard, bookings, clients, leads  
5. Grow: template polish, multi-location, integrations  
6. Pay Appointza: credit wallet / top-up when on metered plans  

---

## 12. Every screen — what to do

### 12.1 Marketing & legal (public)

| Route | Screen | What it does / what to do |
|-------|--------|---------------------------|
| `/` | Home | Main host: marketing home and CTAs. Org subdomain: jump to that org’s public booking site. |
| `/plans` | Pricing | Compare plans; start signup with a plan code. |
| `/demo` | Demo request | Submit contact/business details for a sales demo. |
| `/use-cases` | Use cases | Read industry stories; register. |
| `/features` | Features | Feature marketing; register CTAs. |
| `/contact` | Contact | Send enquiry. |
| `/help` | Help center | Search FAQs. |
| `/blog` | Blog | Browse posts listing. |
| `/terms` | Terms | Legal terms. |
| `/privacy` | Privacy | Privacy policy. |

### 12.2 Auth

| Route | Screen | What it does / what to do |
|-------|--------|---------------------------|
| `/login` | Login | Mobile OTP or Google sign-in. |
| `/register` | Register | Choose Customer or Organisation; enter details; continue OTP/Google. |
| `/otp` | OTP | Enter code to finish login/registration. |

### 12.3 Public browse

| Route | Screen | What it does / what to do |
|-------|--------|---------------------------|
| `/explore`, `/explore-services` | Explore | Search orgs and events; open booking. |
| `/services` | Browse services | Public service catalogue → book slot. |
| `/events` | Browse events | Public events → book. |
| `/organisations` | Browse orgs | Find verified orgs → public site / book. |
| `/turf` | Turf directory | City/venue directory (niche). |
| `/organization/:id` | Org detail | Org-oriented booking entry. |

### 12.4 Public booking sites & book flows

| Route | Screen | What it does / what to do |
|-------|--------|---------------------------|
| `/template/:templateId` | Published website | Live org booking site (iframe HTML). |
| `/org/template/:orgId/:templateType` | Template microsite | Themed org page; Book now. |
| `/public/org/:organizationId` | Public org page | Public card; book/contact. |
| `/book-appointment/:organisationId/:organisationLocationId` | **Service booking** | Services + date + slot; confirm; Razorpay if required. |
| `/user/events/:eventId/book` | **Event booking** | Event details + form; pay if required. |
| `/book` | **Room booking** | Dates/guests/quote; confirm stay. |

### 12.5 Customer portal (`/user`) — login required

| Route | Screen | What it does / what to do |
|-------|--------|---------------------------|
| `/user`, `/user/dashboard` | Dashboard | Upcoming bookings, stats; leave reviews. |
| `/user/appointments` | My appointments | List/filter/cancel service bookings. |
| `/user/events` | Events browse | Find events to book. |
| `/user/my-event-bookings` | My event bookings | Manage event registrations; QR; reviews. |
| `/user/my-room-bookings` | My room bookings | Manage hospitality stays. |
| `/user/profile` | Profile | Edit profile; account logout/delete (`?tab=`). |
| `/user/settings` | Settings | Notification/privacy prefs. |

Legacy: `/profile` → `/user/profile`, `/settings` → `/user/settings`.

### 12.6 Organisation dashboard — login required

| Route | Screen | What it does / what to do |
|-------|--------|---------------------------|
| `/organization/dashboard` | Dashboard | Stats, search by mobile, public links. |
| `/organization/appointments` | **Bookings** | Unified services/events/rooms (`?kind=`). |
| `/organization/calendar` | Calendar | Redirect → appointments. |
| `/organization/event-bookings` | Event bookings | Redirect → appointments `?kind=events`. |
| `/organization/services` | Catalogue | CRUD services / events / rooms. |
| `/organization/timing` | Hours & slots | Opening hours, slots, leave. |
| `/organization/leads` | Leads | Enquiry inbox. |
| `/organization/clients` | CRM | Find/create clients; timeline; book for them. |
| `/organization/clients/on-spot-registration` | Walk-in | Register + book at desk. |
| `/organization/clients/:clientId/book` | Book for client | Service/event/room for known client. |
| `/organization/appointments/:id/record` | Appointment record | Notes, tasks, files for one booking. |
| `/organization/hospitality` | Hospitality | Rooms, policies, packages, status (`?section=`). |
| `/organization/assets` | Assets | Images for template builder. |
| `/organization/custom-domain` | Custom domain | Claim public subdomain slug. |
| `/organization/templates` | Templates | Assign/share booking sites. |
| `/organization/template-builder` | Builder | Visual edit / preview / save site. |
| `/organization/locations` | Locations | Org + branch CRUD. |
| `/organization/staff` | Staff | List, permissions, remove. |
| `/organization/staff/add` | Add staff | Find by mobile; assign privileges. |
| `/organization/payment-settings` | Payments | Org Razorpay keys; test pay. |
| `/organization/settings` | Preferences | Org notification toggles. |
| `/organization/profile` | **Settings hub** | All tabs below. |
| `/organization/rooms/*` | Rooms legacy | Redirect into hospitality. |
| `/organization/:id/dashboard` | Legacy dashboard URL | Same dashboard. |

### 12.7 Organisation Profile tabs (`/organization/profile?tab=...`)

| Tab | What it does / what to do |
|-----|---------------------------|
| `profile` | Owner profile, referral, integrations, delete org (owner). |
| `business-hours` | Same as Timing. |
| `staff` | Same as Staff. |
| `organization` | Org business profile / branding. |
| `location` | Branch locations. |
| `templates` | Booking website templates. |
| `payment` | Razorpay / gateway for customer checkout. |
| `loyalty` | Loyalty schemes / tiers. |
| `billing` | Credit wallet — recharge to pay Appointza. |
| `account` | Logout / account actions. |

Legacy: `/organization/loyalty` → profile loyalty; `/organization/booking-page` → templates.

### 12.8 Onboarding (first-time org)

Typical locked sequence:

1. Custom domain  
2. Catalogue (services/events/rooms)  
3. Timing  
4. Templates / template builder  

Until complete, org navigation stays on allowed setup routes.

### 12.9 Campusza

| Route | Screen | What it does / what to do |
|-------|--------|---------------------------|
| `/campusza/staff` | Staff hub | School staff menu tiles. Many deep links may not be fully wired. |

### 12.10 Errors

| Route | Screen | What to do |
|-------|--------|------------|
| `*` | 404 | Return to home. |

---

## 13. Payments — what each piece does

| Piece | Who pays whom | API / screen |
|-------|---------------|--------------|
| **Customer checkout** | Customer → Organisation | `/api/Payment/CreateOrder` + `VerifyPayment`; booking screens; org Payment Settings |
| **Org Razorpay keys** | Config only | `/organization/profile?tab=payment` or `/organization/payment-settings` |
| **Wallet recharge / top-up** | Organisation → Appointza | `/api/Subscription/CreateWalletRechargeOrder` + verify; Profile → Billing |
| **Low-level Razorpay** | Internal | `integrations/Razorpay` (`/api/Razorpay/Order`, contacts, export order) |

---

## 14. Pros/cons by audience (short)

### For customers

- **Pros:** discover + book + pay in one place; reviews; manage history  
- **Cons:** must trust each org’s payment setup; UX varies by template quality  

### For organisations

- **Pros:** ops, website, payments, staff, CRM in one product  
- **Cons:** setup/onboarding effort; need to configure Razorpay and timings correctly; billing wallet to understand  

### For developers / operators

- **Pros:** one build, one URL JSON, shared API for web + mobile  
- **Cons:** large surface area; secure secrets carefully; tighten CORS/Swagger for prod  

---

## 15. Run & build (pointer)

See [README.md](./README.md):

```powershell
.\run-all.ps1
.\build-appointza.ps1
```

Edit deploy URLs only in:

`D:\aravindan\build\appointza\appointza-urls.json`

---

## 16. Glossary

| Term | Meaning |
|------|---------|
| **Organisation** | Business tenant on Appointza |
| **Location** | Branch under an organisation |
| **Offering** | Services / events / rooms enabled for that org |
| **Template** | Published HTML booking website for a location |
| **Staff** | User with location permissions, not full owner |
| **Credit wallet** | Org prepaid credits for platform booking fees |
| **Leads** | Enquiries submitted to the org |
| **On-spot** | Walk-in registration + booking at the desk |

---

*Routes source of truth: `appointza-ui-canvas/src/App.tsx`.*
