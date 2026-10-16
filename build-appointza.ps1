# Appointza production build (UI + server).
# One URL/port file in the build: <OutDir>\appointza-urls.json (next to appointza.exe)
#   backendListen       port the server runs on
#   frontendApiBaseUrl  URL the frontend calls ("" = same host as the page)
# First build seeds it from appointza-ui-canvas/public/appointza-urls.json; rebuilds keep your edits.
#
# Output (UI + server):
#   D:\aravindan\build\appointza
#
# Usage:
#   .\build-appointza.ps1
#   .\build-appointza.ps1 -OutDir D:\aravindan\build\appointza
#   .\build-appointza.ps1 -BackendListen "http://0.0.0.0:5050" -FrontendApiBaseUrl "https://appointza.com"
#   .\build-appointza.ps1 -BackendListen "http://0.0.0.0:5050" -FrontendApiBaseUrl ""

#Requires -Version 5.1

param(
    [string]$BackendListen = "",
    [string]$FrontendApiBaseUrl = "",
    [string]$OutDir = "D:\aravindan\build\appointza",
    # Legacy aliases (map into FrontendApiBaseUrl / ignored for UiUrl - UI uses page origin)
    [string]$ApiUrl = "",
    [string]$UiUrl = ""
)

$ErrorActionPreference = "Stop"

$root = if ($PSScriptRoot) { $PSScriptRoot } else { Split-Path -Parent $MyInvocation.MyCommand.Path }
$uiDir = Join-Path $root "appointza-ui-canvas"
$prodOut = $OutDir
$wwwroot = Join-Path $prodOut "wwwroot"
$urlsPublic = Join-Path $uiDir "public\appointza-urls.json"
$urlsBuild = Join-Path $prodOut "appointza-urls.json"
$env:APPOINTZA_BUILD_OUT = $prodOut

if (-not $BackendListen -and $ApiUrl) {
    # Derive listen port from API URL if only legacy -ApiUrl was passed
    try {
        $u = [Uri]$ApiUrl
        $BackendListen = "http://0.0.0.0:$($u.Port)"
    } catch {
        $BackendListen = "http://0.0.0.0:5050"
    }
}
if (-not $FrontendApiBaseUrl -and $ApiUrl) {
    $FrontendApiBaseUrl = $ApiUrl.Trim().TrimEnd('/')
}

function Write-Step([string]$Message) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  $Message" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
}

function Resolve-ServerProjectPath {
    $candidates = @(
        (Join-Path $root "appointza\appointza\appointza\appointza.csproj"),
        (Join-Path $root "appointza\appointza\appointza.csproj")
    )
    foreach ($candidate in $candidates) {
        if (Test-Path $candidate) {
            return (Resolve-Path $candidate).Path
        }
    }
    throw "Server project not found."
}

function Install-NpmIfNeeded([string]$ProjectPath) {
    if (Test-Path (Join-Path $ProjectPath "node_modules")) { return }
    Write-Host "Installing npm packages..." -ForegroundColor Yellow
    Push-Location $ProjectPath
    try {
        if (Test-Path "package-lock.json") { npm ci } else { npm install }
        if (-not $?) { throw "npm install failed" }
    } finally {
        Pop-Location
    }
}

function Stop-RunningServer {
    $proc = Get-Process -Name "appointza" -ErrorAction SilentlyContinue
    if ($proc) {
        Write-Host "Stopping running appointza.exe ..." -ForegroundColor Yellow
        Stop-Process -Name "appointza" -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 2
    }
}

function Write-UrlsJson([string]$Path, [string]$Listen, [string]$ApiBase) {
    $obj = [ordered]@{
        backendListen      = $Listen
        frontendApiBaseUrl = $ApiBase
    }
    ($obj | ConvertTo-Json -Depth 3) + "`n" | Set-Content -Path $Path -Encoding UTF8
}

try {
    Set-Location $root
    if (-not (Test-Path $urlsPublic)) {
        Write-UrlsJson -Path $urlsPublic -Listen "http://0.0.0.0:5050" -ApiBase ""
        Write-Host "Created $urlsPublic" -ForegroundColor Yellow
    }

    # Keep the deployed URL file across the full rebuild (older builds kept it in wwwroot)
    $preservedUrls = $null
    foreach ($candidate in @($urlsBuild, (Join-Path $wwwroot "appointza-urls.json"))) {
        if (Test-Path $candidate) {
            $preservedUrls = Get-Content -Raw -Path $candidate
            break
        }
    }

    Write-Step "Appointza build"

    Write-Step "Publish .NET server"
    Stop-RunningServer
    $serverProj = Resolve-ServerProjectPath
    $serverDir = Split-Path -Parent $serverProj
    $appSettings = Join-Path $serverDir "appsettings.json"
    $appSettingsExample = Join-Path $serverDir "appsettings.example.json"
    if (-not (Test-Path $appSettings)) {
        if (-not (Test-Path $appSettingsExample)) {
            throw "Missing appsettings.json - copy appsettings.example.json to appsettings.json and configure it."
        }
        Copy-Item -Path $appSettingsExample -Destination $appSettings -Force
        Write-Host "Created appsettings.json from example - edit secrets before production deploy." -ForegroundColor Yellow
    }

    if (Test-Path $prodOut) {
        Remove-Item -Path $prodOut -Recurse -Force
    }
    Push-Location $serverDir
    $prevPref = $ErrorActionPreference
    try {
        $ErrorActionPreference = "Continue"
        & dotnet publish $serverProj -c Release -o $prodOut
        if ($LASTEXITCODE -ne 0) { throw "dotnet publish failed (exit $LASTEXITCODE)" }
    } finally {
        $ErrorActionPreference = $prevPref
        Pop-Location
    }
    foreach ($extra in @("appsettings.Development.json", "appsettings.Production.json", "appsettings.example.json")) {
        $extraPath = Join-Path $prodOut $extra
        if (Test-Path $extraPath) {
            Remove-Item -Path $extraPath -Force
        }
    }
    if (Test-Path $wwwroot) {
        Remove-Item -Path $wwwroot -Recurse -Force
    }
    New-Item -ItemType Directory -Path $wwwroot -Force | Out-Null

    if ($preservedUrls) {
        Set-Content -Path $urlsBuild -Value $preservedUrls -Encoding UTF8
    }

    Write-Step "Build UI (Vite)"
    Install-NpmIfNeeded -ProjectPath $uiDir
    Push-Location $uiDir
    $prevPref = $ErrorActionPreference
    try {
        # npm writes warnings to stderr; PowerShell 5.1 would treat them as fatal under "Stop".
        $ErrorActionPreference = "Continue"
        & npm run build
        if ($LASTEXITCODE -ne 0) { throw "UI build failed (exit $LASTEXITCODE)" }
    } finally {
        $ErrorActionPreference = $prevPref
        Pop-Location
    }

    if (-not (Test-Path (Join-Path $wwwroot "index.html"))) {
        throw "Missing wwwroot/index.html after UI build."
    }

    if (-not (Test-Path $urlsBuild)) {
        Copy-Item -Path $urlsPublic -Destination $urlsBuild -Force
    }
    Remove-Item -Path (Join-Path $wwwroot "appointza-urls.json") -Force -ErrorAction SilentlyContinue

    if ($BackendListen -or $PSBoundParameters.ContainsKey("FrontendApiBaseUrl") -or $ApiUrl) {
        $existing = Get-Content -Raw -Path $urlsBuild | ConvertFrom-Json
        $listen = if ($BackendListen) { $BackendListen.Trim().TrimEnd('/') } else { [string]$existing.backendListen }
        $apiBase = if ($PSBoundParameters.ContainsKey("FrontendApiBaseUrl") -or $ApiUrl) {
            if ($null -eq $FrontendApiBaseUrl) { "" } else { $FrontendApiBaseUrl.Trim().TrimEnd('/') }
        } else {
            [string]$existing.frontendApiBaseUrl
        }
        if (-not $listen) { $listen = "http://0.0.0.0:5050" }
        Write-UrlsJson -Path $urlsBuild -Listen $listen -ApiBase $apiBase
    }

    $finalUrls = Get-Content -Raw -Path $urlsBuild | ConvertFrom-Json

    @"
@echo off
cd /d "%~dp0"
appointza.exe
"@ | Set-Content -Path (Join-Path $prodOut "run.cmd") -Encoding ASCII

    Get-ChildItem -Path $prodOut -Recurse -File -ErrorAction SilentlyContinue |
        Unblock-File -ErrorAction SilentlyContinue

    Write-Step "Build completed"
    Write-Host "Output: $prodOut" -ForegroundColor Green
    Write-Host "Run:    $prodOut\run.cmd" -ForegroundColor Cyan
    Write-Host "Config: $urlsBuild" -ForegroundColor Cyan
    Write-Host "  backendListen:      $($finalUrls.backendListen)" -ForegroundColor DarkGray
    Write-Host "  frontendApiBaseUrl: $(if ($finalUrls.frontendApiBaseUrl) { $finalUrls.frontendApiBaseUrl } else { '(same host as the page)' })" -ForegroundColor DarkGray
    Write-Host "Edit that file and restart to change the port or the API URL." -ForegroundColor DarkGray
    exit 0
}
catch {
    Write-Host ""
    Write-Host "BUILD FAILED:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}
finally {
    Set-Location $root
}
