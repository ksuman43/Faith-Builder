#!/bin/bash

OUTPUT_DIR="build"

# Automatically grab the latest Git tag. If no tags exist or git fails, fall back to "dev"
VERSION=$(git describe --tags --abbrev=0 2>/dev/null || echo "dev")

# Platforms to build for (Format: OS/ARCH)
PLATFORMS=(
    "linux/amd64"
    "linux/arm64"
    "windows/amd64"
    "darwin/amd64"
    "darwin/arm64"
)

# Clean previous builds
rm -rf ${OUTPUT_DIR}
mkdir -p ${OUTPUT_DIR}

echo "Building Faith Builder CLI (${VERSION}) for multiple platforms..."

for PLATFORM in "${PLATFORMS[@]}"; do
    GOOS=${PLATFORM%/*}
    GOARCH=${PLATFORM#*/}

    OUTPUT_NAME="${OUTPUT_DIR}/fb-${GOOS}-${GOARCH}"
    
    if [ "$GOOS" = "windows" ]; then
        OUTPUT_NAME="${OUTPUT_NAME}.exe"
    fi

    echo "Compiling for $GOOS/$GOARCH..."
    
    # Inject the dynamic Git version tag into main.Version
    GOOS=$GOOS GOARCH=$GOARCH go build -ldflags="-s -w -X main.Version=${VERSION}" -o $OUTPUT_NAME main.go

    if [ $? -ne 0 ]; then
        echo "Error compiling for $GOOS/$GOARCH. Aborting."
        exit 1
    fi
done

echo "All builds complete! Check the '${OUTPUT_DIR}' folder."