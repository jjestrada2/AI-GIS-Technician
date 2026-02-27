# OpenClaw Installer Release Guide

## Triggering a Release

### Option 1: Git Tag (recommended)

Create and push a tag to trigger the automated build pipeline:

```bash
git tag installer-v1.0.0
git push origin installer-v1.0.0
```

The workflow triggers on any tag matching `installer-v*`. The tag name becomes the release version.

### Option 2: Manual Dispatch (GitHub UI)

1. Go to **Actions** > **Build & Release OpenClaw Installer**
2. Click **Run workflow**
3. Enter the version tag (e.g. `installer-v1.0.0`)
4. Click **Run workflow**

This is useful for re-running a build without creating a new tag.

## What the Workflow Does

1. **create-release** job: creates a GitHub Release with platform download table
2. **build** matrix job (runs in parallel across 3 runners):
   - `macos-14` (Apple Silicon) builds `.dmg`
   - `windows-latest` builds `.exe`
   - `ubuntu-latest` builds `.AppImage`
3. Each runner uploads its artifact to the same GitHub Release

## Expected Download URLs

After a successful release, artifacts are available at:

```
https://github.com/jjestrada2/AI-GIS-Technician/releases/download/installer-v1.0.0/OpenClaw-Installer-arm64.dmg
https://github.com/jjestrada2/AI-GIS-Technician/releases/download/installer-v1.0.0/OpenClaw-Installer-Setup.exe
https://github.com/jjestrada2/AI-GIS-Technician/releases/download/installer-v1.0.0/OpenClaw-Installer.AppImage
```

Replace `installer-v1.0.0` with the actual tag name.

> **Repo changed?** Update the `"repository"` field in `installer/package.json` — that is the single source of truth. The GitHub Actions workflow uses `${{ github.repository }}` automatically, and Electron Builder reads `package.json` directly, so no other files need editing.

## GitHub Secrets (Optional macOS Code Signing)

The workflow builds unsigned installers by default. To enable macOS code signing and notarization, configure these repository secrets:

| Secret                        | Description                            |
| ----------------------------- | -------------------------------------- |
| `MAC_CERTS`                   | Base64-encoded `.p12` certificate file |
| `MAC_CERTS_PASSWORD`          | Password for the `.p12` certificate    |
| `APPLE_ID`                    | Apple ID email for notarization        |
| `APPLE_APP_SPECIFIC_PASSWORD` | App-specific password for the Apple ID |
| `APPLE_TEAM_ID`               | Apple Developer Team ID                |

To export a `.p12` as base64:

```bash
base64 -i Certificates.p12 | pbcopy
```

Windows and Linux builds do not require code signing secrets.

## Local Testing

Build all platforms locally before pushing a release tag:

```bash
cd installer
pnpm install
pnpm build:all
```

Build a single platform:

```bash
pnpm build:mac     # macOS .dmg
pnpm build:win     # Windows .exe
pnpm build:linux   # Linux .AppImage
```

Verify the output files exist in `installer/dist/`.

## Troubleshooting

### Build fails on macOS with code signing error

If `MAC_CERTS` is not set, electron-builder skips signing. If it is set but invalid, the build fails. Verify the base64 encoding:

```bash
echo "$MAC_CERTS" | base64 -d > /tmp/test.p12
security import /tmp/test.p12 -P "$MAC_CERTS_PASSWORD"
```

### Windows build fails with NSIS error

Ensure the `build.nsis` configuration in `package.json` is valid. Common cause: missing `build.win.target` or incorrect icon path.

### Linux build fails with AppImage error

AppImage requires `fuse` on the build runner. The `ubuntu-latest` runner includes it by default. If building locally, install it:

```bash
sudo apt-get install -y fuse libfuse2
```

### Artifact not appearing on the release

Check the `files` glob pattern in the upload step. The pattern uses `installer/dist/*.dmg` (etc.) relative to the repo root. If electron-builder outputs to a different directory, update `artifact_pattern` in the matrix.

### workflow_dispatch creates a release but no tag exists

Manual dispatch creates a release with the specified tag name even if the tag does not exist in the repo. The release will show as a draft-like state. Either push the tag first, or use the tag trigger for production releases.
