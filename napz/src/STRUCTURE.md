# Napz `src/` layout

See project navigation:

- `navigation/` — Root, Auth, Main tabs, Track, Account stacks
- `screens/{auth,track,saved,account}/` — feature screens
- `components/{common,map}/` — shared UI
- `location/` — disclosure, permissions, launch gate, GPS helpers
- `services/{firebase,maps,alarm,native,storage}/` — integrations & persistence
- `hooks/`, `context/` — reusable state
- `types/`, `constants/`, `theme/`, `utils/` — shared definitions

Native Kotlin mirrors: `android/.../TrackingSession.kt`, `DeviceLocation.kt`.
