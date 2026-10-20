# appointza

Appointza UI + .NET API monorepo.

**Every screen (what users and organisations do):** see [SCREENS.md](./SCREENS.md).

## Local dev

```powershell
.\run-all.ps1
```

| App | URL |
|-----|-----|
| API (.NET) | http://localhost:5051 (from `appointza-urls.json`) |
| Appointza UI | http://localhost:8083 |

## Production build

```powershell
.\build-appointza.ps1
D:\aravindan\build\appointza\run.cmd
```

| What | Path |
|------|------|
| Build script | `build-appointza.ps1` |
| **URLs only** | `appointza-ui-canvas/public/appointza-urls.json` |
| After deploy (edit this) | `D:\aravindan\build\appointza\appointza-urls.json` (next to `appointza.exe`) |
| Maps / push (VAPID) keys | `public/config.js` (public keys only, no URLs) |
| Output | `D:\aravindan\build\appointza\` |

### URLs (Krios-style — one file)

Edit **`<build>\appointza-urls.json`** (next to `appointza.exe`) only. The server reads it for its port and serves it to the browser at `/appointza-urls.json`:

```json
{
  "backendListen": "http://0.0.0.0:5050",
  "frontendApiBaseUrl": ""
}
```

| Field | Meaning |
|-------|---------|
| `backendListen` | API bind. Open **http://localhost:PORT/** in the browser (not `0.0.0.0`). |
| `frontendApiBaseUrl` | Browser API origin. **Empty = same origin**. |

Production:

```json
{
  "backendListen": "http://0.0.0.0:5050",
  "frontendApiBaseUrl": "https://appointza.com"
}
```

Or:

```powershell
cd appointza-ui-canvas
npm run set:url -- http://0.0.0.0:5050 https://appointza.com
```

Restart after editing. Rebuilds preserve an existing `<build>\appointza-urls.json`.
