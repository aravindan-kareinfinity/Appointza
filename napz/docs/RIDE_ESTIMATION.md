# Ride Estimation

Napz shows pickup → destination comparison on the **Rides** bottom tab. It does **not** book rides, take ride payments, or issue bus tickets.

## What the screen uses

| Source | Used for | Credentials |
| --- | --- | --- |
| Device GPS (foreground only) | Default pickup | Existing Napz location permission |
| OpenStreetMap Nominatim | Place search (free) | None |
| Google Places / Geocoding | Place search (Premium) | Existing Android-restricted Maps key in the app |
| OSRM public router | Walking, cycling, car, two-wheeler path/time | None. Typical road time, **not** live traffic |
| Google Directions API | Transit options, optional traffic-aware driving | Same Android Maps key. Enable **Directions API** in Google Cloud |
| `estimateTransitJourney` Cloud Function | Optional Google Routes (transit + traffic + two-wheeler) | Server env `GOOGLE_ROUTES_API_KEY` — **not** the Android app key |
| Uber official `m.uber.com/ul` / `uber://` | Open Uber with pickup and dropoff | Uber partner fare API is **not** integrated |
| Rapido Play listing / site | Open Rapido | No public official fare or coordinate deep-link contract |
| Google Maps `travelmode=transit` | Open Bus Route | None |

## Required Google Cloud APIs (existing Napz Maps key)

Enable if they are not already on:

- Maps SDK for Android
- Places API
- Geocoding API
- **Directions API** (needed for bus-route cards in the app)

Keep the key Android-restricted (`com.wakemethere` + SHA-1). Do not put a Google **server** key in the React Native app.

## Optional server key (richer transit)

1. Create a separate Google Cloud **server** key with Routes API only.
2. Set it on the `estimateTransitJourney` function as `GOOGLE_ROUTES_API_KEY`.
3. Prefer Secret Manager: `firebase functions:secrets:set GOOGLE_ROUTES_API_KEY` then add that secret to the function and redeploy.

Until that env is set, the callable returns `{ configured: false }` and the app uses Directions + OSRM.

## Partner approvals still required for real fares

- **Uber**: [Ride Requests / fare estimates](https://developer.uber.com/) — not approved in Napz. UI shows **Check fare in app**.
- **Rapido**: no public fare API. UI shows **Check fare in app**. Vehicle types listed are Rapido’s published categories (bike, auto, cab), not live availability.
- **Live bus tracking**: not integrated. Times are scheduled Directions/Routes data when Google returns them.

## Regional limits

- Transit quality follows Google coverage (stronger in large Indian cities).
- OSRM public instance can rate-limit; the screen shows “route unavailable” instead of inventing a time.
- Two-wheeler overview reuses car routing from OSRM unless Google Routes two-wheeler is configured.

## Foreground location only

Ride Estimation requests `foreground_only`. It does not start background tracking. **Set destination alarm** hands off to the existing Track screen.
