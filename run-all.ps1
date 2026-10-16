#Requires -Version 5.1
<#
.SYNOPSIS
  Run API + all product UIs on separate ports.

  API        http://localhost:<port from appointza-urls.json>
  Webzys     http://localhost:8081
  Appointza  http://localhost:8083
  Campusza   http://localhost:8087
  Stay       http://localhost:8088

.EXAMPLE
  .\run-all.ps1
  .\run-all.ps1 -SkipApi
  .\run-all.ps1 -ApiOnly
#>
param(
    [switch]$SkipApi,
    [switch]$ApiOnly,
    [switch]$SkipUi
)

$ErrorActionPreference = "Stop"
$root = if ($PSScriptRoot) { $PSScriptRoot } else { Split-Path -Parent $MyInvocation.MyCommand.Path }

$apiExe = "D:\aravindan\build\appointza\appointza.exe"
function Resolve-ServerProjectPath {
    param([string]$RepoRoot)
    $candidates = @(
        (Join-Path $RepoRoot "appointza\appointza\appointza\appointza.csproj"),
        (Join-Path $RepoRoot "appointza\appointza\appointza.csproj")
    )
    foreach ($candidate in $candidates) {
        if (Test-Path $candidate) { return $candidate }
    }
    return (Join-Path $RepoRoot "appointza\appointza\appointza\appointza.csproj")
}

$serverProj = Resolve-ServerProjectPath -RepoRoot $root

function Get-ApiPort {
    foreach ($file in @(
        (Join-Path (Split-Path $apiExe) "appointza-urls.json"),
        (Join-Path $root "appointza-ui-canvas\public\appointza-urls.json")
    )) {
        if (-not (Test-Path $file)) { continue }
        $listen = [string](Get-Content -Raw -Path $file | ConvertFrom-Json).backendListen
        if ($listen -match ':(\d+)/?$') { return [int]$Matches[1] }
    }
    return 5050
}

$apiPort = Get-ApiPort

$uis = @(
    @{ Name = "Webzys";    Folder = "Webzys";             Port = 8081 },
    @{ Name = "Appointza"; Folder = "appointza-ui-canvas"; Port = 8083 },
    @{ Name = "Campusza";  Folder = "campusza";            Port = 8087 }
)

function Start-NpmDev([string]$Name, [string]$Folder, [int]$Port) {
    $path = Join-Path $root $Folder
    if (-not (Test-Path $path)) {
        Write-Host "Skip $Name - folder missing: $path" -ForegroundColor Yellow
        return
    }
    if (-not (Test-Path (Join-Path $path "node_modules"))) {
        Write-Host "Installing npm packages for $Name ..." -ForegroundColor Yellow
        Push-Location $path
        try {
            if (Test-Path "package-lock.json") { npm ci } else { npm install }
            if (-not $?) { throw "npm install failed for $Name" }
        } finally {
            Pop-Location
        }
    }

    Write-Host "Starting $Name on http://localhost:$Port ..." -ForegroundColor Cyan
    Start-Process -FilePath "npm.cmd" -ArgumentList @("run", "dev") -WorkingDirectory $path -WindowStyle Normal
}

Write-Host ""
Write-Host "Appointza multi-port local run" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green

if (-not $SkipApi) {
    $existing = Get-NetTCPConnection -LocalPort $apiPort -State Listen -ErrorAction SilentlyContinue
    if ($existing) {
        Write-Host "API already listening on :$apiPort" -ForegroundColor Yellow
    } elseif (Test-Path $apiExe) {
        Write-Host "Starting API: $apiExe (port $apiPort)" -ForegroundColor Cyan
        Start-Process -FilePath $apiExe -WorkingDirectory (Split-Path $apiExe) -WindowStyle Normal
    } elseif (Test-Path $serverProj) {
        Write-Host "Starting API via dotnet run (http://localhost:$apiPort) ..." -ForegroundColor Cyan
        $serverDir = Split-Path $serverProj
        Start-Process -FilePath "cmd.exe" -ArgumentList @(
            "/c",
            "dotnet run --launch-profile appointza"
        ) -WorkingDirectory $serverDir -WindowStyle Normal
    } else {
        Write-Host "API not found (no appointza.exe and no csproj). Start it manually on :$apiPort." -ForegroundColor Red
    }
}

if ($ApiOnly -or $SkipUi) {
    Write-Host "UI skipped." -ForegroundColor DarkGray
    exit 0
}

Start-Sleep -Seconds 2

foreach ($ui in $uis) {
    Start-NpmDev -Name $ui.Name -Folder $ui.Folder -Port $ui.Port
}

Write-Host ""
Write-Host "Open:" -ForegroundColor Green
Write-Host "  API        http://localhost:$apiPort"
Write-Host "  Webzys     http://localhost:8081"
Write-Host "  Appointza  http://localhost:8083"
Write-Host "  Campusza   http://localhost:8087"
Write-Host "  Stay       http://localhost:8088"
Write-Host ""
Write-Host "Appointza UI proxies /api to http://localhost:$apiPort" -ForegroundColor DarkGray
