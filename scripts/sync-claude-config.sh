#!/bin/bash
# Sync Claude configuration from BOS-3.0 to other repositories
# Run this after making changes to .claude/ in BOS-3.0

set -e

SOURCE="/Users/alexbouhdary/Documents/GitHub/BOS-3.0/.claude"
GITHUB_DIR="/Users/alexbouhdary/Documents/GitHub"

# Target repositories
TARGETS=(
  "OS_design-directory"
  "OS_our-links"
  "BOS-1.0"
  "BOS-2.0"
)

# Components to sync (NOT settings files)
COMPONENTS=(
  "CLAUDE.md"
  "agents"
  "commands"
  "plugins"
  "skills"
  "brand"
  "reference"
  "data"
)

echo "🔄 Syncing Claude configuration from BOS-3.0..."
echo ""

for repo in "${TARGETS[@]}"; do
  TARGET="$GITHUB_DIR/$repo/.claude"

  if [ ! -d "$TARGET" ]; then
    echo "⚠️  Skipping $repo (no .claude directory)"
    continue
  fi

  echo "📁 Syncing to $repo..."

  for component in "${COMPONENTS[@]}"; do
    if [ -e "$SOURCE/$component" ]; then
      # Remove existing (but preserve settings files)
      rm -rf "$TARGET/$component"
      # Copy fresh from source
      cp -r "$SOURCE/$component" "$TARGET/$component"
      echo "   ✓ $component"
    fi
  done

  echo ""
done

echo "✅ Sync complete!"
echo ""
echo "Next steps:"
echo "  1. Review changes in each repo: git status"
echo "  2. Commit and push to GitHub"
