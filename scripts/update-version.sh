#!/bin/bash
# Helper script to manually update semantic version in CONFIG
# Usage: ./scripts/update-version.sh [major|minor|patch]

VERSION_TYPE="${1:-patch}"

# Validate input
if [[ ! "$VERSION_TYPE" =~ ^(major|minor|patch)$ ]]; then
  echo "Usage: ./scripts/update-version.sh [major|minor|patch]"
  exit 1
fi

# Extract current version from app.js
CURRENT_VERSION=$(grep -oP 'VERSION: "\K[^"]+' app.js | head -1)

if [ -z "$CURRENT_VERSION" ]; then
  echo "Error: Could not find VERSION in app.js"
  exit 1
fi

# Parse version
IFS='.' read -r major minor patch <<< "$CURRENT_VERSION"

# Increment version based on type
case $VERSION_TYPE in
  major)
    major=$((major + 1))
    minor=0
    patch=0
    ;;
  minor)
    minor=$((minor + 1))
    patch=0
    ;;
  patch)
    patch=$((patch + 1))
    ;;
esac

NEW_VERSION="$major.$minor.$patch"

# Update app.js
sed -i '' "s/VERSION: \"$CURRENT_VERSION\"/VERSION: \"$NEW_VERSION\"/g" app.js

# Update index.html fallback
sed -i '' "s/>v$CURRENT_VERSION</>v$NEW_VERSION</g" index.html

echo "Version bumped: $CURRENT_VERSION → $NEW_VERSION"
echo "Files updated: app.js, index.html"
echo "Remember to commit with appropriate message (e.g., 'FEAT: Add new feature')"
