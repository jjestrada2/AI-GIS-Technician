#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INSTALLER_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "==> Installing dependencies..."
cd "$INSTALLER_DIR"
pnpm install

echo "==> Building for all platforms..."
pnpm build:all

echo "==> Build output:"
if [ -d "$INSTALLER_DIR/dist" ]; then
  ls -lh "$INSTALLER_DIR/dist/"

  # Make AppImage executable if present
  for f in "$INSTALLER_DIR/dist/"*.AppImage; do
    if [ -f "$f" ]; then
      chmod +x "$f"
      echo "==> Made executable: $(basename "$f")"
    fi
  done
else
  echo "Warning: dist/ directory not found. Build may have failed."
  exit 1
fi

echo "==> Done."
