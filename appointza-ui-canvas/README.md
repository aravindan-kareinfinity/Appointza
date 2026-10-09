# Appointza UI (`appointza-ui-canvas`)

React + Vite + Capacitor front end for Appointza. **All routes and screens** are registered in `src/App.tsx`.

**End-user documentation:** see [USER_MANUAL.md](./USER_MANUAL.md) for how customers and businesses use the app day to day.

**Business / pitch narrative:** see [BUSINESS_OVERVIEW_PITCH.md](./BUSINESS_OVERVIEW_PITCH.md) for overview, problem–solution, revenue model, market segments, and per-screen talking points (no separate in-app screen).

**Template Builder — Appointza · Live data (third-party / integrators):** see [TEMPLATE_BUILDER_APPOINTZA_LIVE_DATA.md](./TEMPLATE_BUILDER_APPOINTZA_LIVE_DATA.md) for block types, placeholder rules, builder vs public URL behaviour, and JSON/HTML export format.

---

## App screens (short reference)

Appointza has **two login types**: **User login** (customers) and **Organisation login** (business/staff).

### Organisation login (6 main screens)

| # | Screen | What it does |
|---|--------|--------------|
| 1 | **Dashboard** | Business overview: today’s bookings, revenue, stats, and quick insights. |
| 2 | **Bookings** | View and manage all client appointments (upcoming/past, status, payment, staff). |
| 3 | **Event Participants** | Manage event registrations (confirm, payment, check-in, filters). |
| 4 | **Services & Events** | Create and manage services and events offered by the business. |
| 5 | **Customers** | Search clients, view history/timeline, and do on-spot booking/registration. |
| 6 | **Settings** | Central setup area with 9 sub-sections (below). |

#### Settings → 9 sub-sections

| Sub-section | What it does |
|-------------|--------------|
| **Profile** | Edit organisation owner profile and basic business details. |
| **Business Hours** | Set working days and time slots for each location. |
| **Staff** | Add/manage staff and their access/roles. |
| **Location** | Add/edit business locations/branches. |
| **Templates** | Choose/create booking page templates and booking links. |
| **Payment Settings** | Configure payment methods and payment-related options. |
| **Billing** | View subscription plan, usage, and billing/payment status. |
| **Appointment Values** | Manage dropdown/reference values used in appointments. |
| **Account** | Account actions like logout, delete account, and org switching. |

### User login (5 main screens)

| # | Screen | What it does |
|---|--------|--------------|
| 1 | **Home** | Discover and browse businesses, services, and events. |
| 2 | **Dashboard** | Personal summary: upcoming bookings, stats, and reviews. |
| 3 | **Appointments** | View/manage your service appointments (upcoming/past, filters). |
| 4 | **My Event Bookings** | View/manage your event registrations and booking details. |
| 5 | **Settings** | Update user profile and personal account preferences. |

#### Home → 3 divisions

| Division | What it does |
|----------|--------------|
| **Organisations** | Browse and search businesses to book from. |
| **Services** | Browse services across organisations and start booking. |
| **Events** | Browse events and register/book participation. |

---

## Project info (Lovable)

**URL**: https://lovable.dev/projects/8b4d0776-a53f-426d-93d2-df2db1af7c49

---

## Application screens (complete catalog)

Legend: **Public** = no login required. **Auth** = requires login. **Org** = organization/staff area (login + onboarding guard). **User** = signed-in customer area.

### Marketing, auth, and legal (public)

| Screen name | Route(s) | Description |
| --- | --- | --- |
| **Home / landing** | `/` | Marketing home: hero, features, use cases, CTAs, and entry to sign up or explore. On a **verified org subdomain**, `/` may run **custom-domain** handling instead (see below). |
| **Login** | `/login` | Email/mobile/Google (as configured) sign-in; redirects to the intended route after success. |
| **Register** | `/register` | New account registration for customers or flows that start onboarding. |
| **OTP verification** | `/otp` | One-time password step after registration or phone verification. |
| **Pricing plans** | `/plans` | Subscription or plan presentation. |
| **Demo request** | `/demo` | Request a product demo. |
| **Use cases** | `/use-cases` | Use-case marketing content. |
| **Features** | `/features` | Product features overview. |
| **Contact** | `/contact` | Contact form or details. |
| **Help center** | `/help` | Help and support content. |
| **Blog** | `/blog` | Blog listing or articles. |
| **Terms** | `/terms` | Terms of service. |
| **Privacy** | `/privacy` | Privacy policy. |
| **Not found** | `*` (any unknown path) | 404 page for unmatched routes. |

### Public discovery, templates, and booking entry (public)

| Screen name | Route(s) | Description |
| --- | --- | --- |
| **Explore (organizations & services)** | `/explore`, `/explore-services` | Search and browse real organizations, locations, services, events, and filters; jump to booking or org-specific URLs. |
| **Organization detail (customer view)** | `/organization/:id` | Detailed view of one organization for end users (info, services, booking entry as implemented). |
| **Organization template (preview style)** | `/org/template/:orgId/:templateType` | Template-oriented org presentation (layout depends on template type). |
| **Public organization page** | `/public/org/:organizationId` | Lightweight public org page; can render from `data` query (base64 payload) or be extended to load by id. |
| **Dynamic template page** | `/template/:templateId`, `/organization/:id/template` | Resolves template/location from encrypted or id parameters, loads site details, and **renders the HTML microsite** for a shareable booking/marketing URL. |
| **Custom domain redirect** | `/` when host is an **org subdomain** | Parses the hostname against the configured app domain, resolves the organization location, and redirects visitors into the correct **template/booking** experience (with loading and error states). |

### End user (customer) — authenticated

| Screen name | Route(s) | Description |
| --- | --- | --- |
| **Dashboard** | `/user`, `/user/dashboard` | Personal home: appointment stats, upcoming visits, spend summary, reviews for completed services. |
| **Appointments** | `/user/appointments` | Upcoming and past bookings; filters; cancel; record payments; view service/location details. |
| **Profile** | `/user/profile` | Edit profile and photo; sign out; account deletion flow. |
| **Settings** | `/user/settings` | Account preferences (notifications, privacy tabs). |
| **Browse events** | `/user/events` | Public, active events with search/filters; opens booking for a chosen event. |
| **Event booking** | `/user/events/:eventId/book` | Book seats: headcount, names, org-defined form fields, optional Razorpay checkout. |
| **My event bookings** | `/user/my-event-bookings` | Your event registrations: status filters, check-in QR, cancel, reviews. |
| **Book service appointment** | `/book-appointment/:organisationId/:organisationLocationId` | Full service booking: pick services, staff, slot, holidays/hours, optional payment. |

Redirects: `/profile` → `/user/profile`, `/settings` → `/user/settings`.

**In-app navigation (sidebar / bottom nav):** Dashboard, Appointments, My event bookings (mobile label may be “Events”), Explore, Profile. **Browse events** (`/user/events`) is a valid route but not always a primary nav item.

### Organization (business) — authenticated + onboarding

| Screen name | Route(s) | Description |
| --- | --- | --- |
| **Dashboard** | `/organization/dashboard`, `/organization/:id/dashboard` | Location-scoped ops: payments/revenue summary, stats, search appointments by phone, drill into details and files. |
| **Business hours & availability** | `/organization/timing` | Per-location schedule, slots, leave/blackout dates. |
| **Services & events** | `/organization/services` | CRUD for services and events, pricing, media, visibility, location scope. |
| **Appointments** | `/organization/appointments` | Manage bookings: calendar/date filters, statuses, staff assignment, detail modals. |
| **Appointment record** | `/organization/appointments/:id/record` | Visit record: checklist/tasks from reference data, notes, report text, uploads. |
| **Event bookings** | `/organization/event-bookings` | All event registrations for the org/location; update payment, check-in, confirmation; card/row/column views. |
| **Locations** | `/organization/locations` | Branches: address, map, images, public/booking links. |
| **Staff management** | `/organization/staff` | Staff list; permissions for dashboard, appointments, events, services, clients, hours, locations, templates, payments, reference data. |
| **Add staff** | `/organization/staff/add` | Look up user by mobile, assign location, set permissions, add to org. |
| **Templates & booking links** | `/organization/templates` (use `?tab=booking` for URL tools) | Visual template selection and **shareable booking URLs** (including encrypted/custom patterns) per location. |
| **Booking page shortcut** | `/organization/booking-page` | Redirects to `/organization/templates?tab=booking`. |
| **Organization settings** | `/organization/settings` | Org-level notifications, preferences, privacy (tabs). |
| **Organization profile & hub** | `/organization/profile` | Tabbed hub: profile, embedded hours, staff, locations, templates, payment, wallet, and account (visibility depends on **staff permissions**). |
| **Payment settings** | `/organization/payment-settings` | Payment gateways (e.g. Razorpay): keys, environment, webhooks, test flows. |
| **Leads** | `/organization/leads` | Contact-form enquiries, lead search, details, and integration URLs. |
| **Clients** | `/organization/clients` | Client search, timelines, history, today’s appointment, create client, links to walk-in booking. |
| **On-spot registration** | `/organization/clients/on-spot-registration` | Register a walk-in (OTP when needed) and book a service or event immediately. |
| **Book for client** | `/organization/clients/:clientId/book` | Staff books a service or event for an existing client. |

**Primary org nav:** Dashboard, Appointments, Event bookings, Services (& events), Clients, Settings (opens the **profile hub**). **Staff** users only see items allowed by their permission flags.

### Other product surfaces (authenticated)

| Screen name | Route(s) | Description |
| --- | --- | --- |
| **Campusza staff hub** | `/campusza/staff` | Campusza-oriented menu of staff actions (UI entry points; paths shown inside may be placeholders for future routes). Shell nav hidden. |

### Source files vs routes

Page components live under `src/pages/` (and `src/pages/user/`, `src/pages/organization/`, etc.). A few components are **imported in `App.tsx` but have no `<Route>`** (e.g. legacy or inline embeds only): **`BookingPagePreview`**, **`OrganizationTimingSetup`** — use the routed **Timing** (`/organization/timing`) and **Templates** screens unless you add explicit routes.

The page **`ExploreOrganizations`** exists under `src/pages/user/` but is **not** wired to a route; **Explore** uses **`ExploreServices`** at `/explore`.

---

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/8b4d0776-a53f-426d-93d2-df2db1af7c49) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

## Global URL configuration

Edit **`public/appointza-urls.json` only** (Krios-style). Do not put URLs in `config.js`.

```sh
npm run set:url -- http://0.0.0.0:5050 ""
npm run set:url -- http://0.0.0.0:5050 https://appointza.com
```

| File | Purpose |
|------|---------|
| `public/appointza-urls.json` | URLs (`backendListen`, `frontendApiBaseUrl`) |
| `public/config.js` | Public browser keys only: Google Maps, VAPID (no URLs, no secrets) |

**Full deploy (from repo root):**

```powershell
.\build-appointza.ps1
```

After deploy, edit only `<build>\appointza-urls.json` (next to `appointza.exe`) and restart.

**UI dev only** (from this folder):

```sh
npm run dev
```

**Capacitor** (after a full build):

```sh
npm run cap:sync
```

Build output: `D:/aravindan/build/appointza/wwwroot/`

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- Capacitor (for Android & iOS mobile apps)

## Mobile App Development (Android & iOS)

This project has been configured as a Capacitor app supporting both Android and iOS platforms.

### Prerequisites

**For Android:**
- Android Studio installed
- Android SDK configured
- Java Development Kit (JDK) installed

**For iOS:**
- macOS (required for iOS development)
- Xcode installed
- CocoaPods installed (`sudo gem install cocoapods`)

### Development Workflow

1. **Build the web app:**
   ```sh
   npm run build
   ```

2. **Sync Capacitor (copies web build to native platforms):**
   ```sh
   npm run cap:sync
   ```

3. **Open in IDE:**
   - **Android:** `npm run cap:open` or `npm run cap:run`
   - **iOS:** `npm run cap:open:ios` or `npm run cap:run:ios`

### Available Capacitor Scripts

- `npm run cap:sync` - Sync web assets to all native platforms
- `npm run cap:copy` - Copy web assets only
- `npm run cap:update` - Update native dependencies
- `npm run cap:open` - Open Android project in Android Studio
- `npm run cap:open:ios` - Open iOS project in Xcode
- `npm run cap:run` - Build, sync, and open Android Studio
- `npm run cap:run:ios` - Build, sync, and open Xcode

### Configuration

- App ID: `com.apppointza`
- App Name: `Appointza`
- Configuration file: `capacitor.config.ts`

After making changes to your web app, remember to rebuild and sync:
```sh
npm run build && npm run cap:sync
```

### Safe Area Support

The app includes full safe area support for both Android and iOS to handle notches, status bars, and system UI elements:

- **Automatic safe area detection** - The app automatically detects and applies safe area insets
- **Status bar integration** - Status bar is configured to work seamlessly with safe areas
- **CSS environment variables** - Safe area insets are available as CSS variables:
  - `--safe-area-inset-top`
  - `--safe-area-inset-bottom`
  - `--safe-area-inset-left`
  - `--safe-area-inset-right`
- **Utility class** - Use `.safe-area-padding` class for components that need safe area padding

The safe area implementation ensures your content is never hidden behind notches, status bars, or navigation bars on modern devices.

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/8b4d0776-a53f-426d-93d2-df2db1af7c49) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
