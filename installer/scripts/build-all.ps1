$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$InstallerDir = Resolve-Path (Join-Path $ScriptDir "..")

Write-Host "==> Installing dependencies..."
Set-Location $InstallerDir
pnpm install

Write-Host "==> Building for all platforms..."
pnpm build:all

Write-Host "==> Build output:"
$DistDir = Join-Path $InstallerDir "dist"
if (Test-Path $DistDir) {
    Get-ChildItem -Path $DistDir | Format-Table Name, Length, LastWriteTime -AutoSize
} else {
    Write-Error "dist/ directory not found. Build may have failed."
    exit 1
}

Write-Host "==> Done."
