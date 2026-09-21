#!/bin/bash

# Output directory
OUTPUT_DIR="build"
VERSION="v1.0.0"

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

echo "Building Faith Builder CLI for multiple platforms..."

for PLATFORM in "${PLATFORMS[@]}"; do
    # Split platform string into OS and Architecture
    GOOS=${PLATFORM%/*}
    GOARCH=${PLATFORM#*/}

    # Set output file name
    OUTPUT_NAME="${OUTPUT_DIR}/fb-${GOOS}-${GOARCH}"
    
    # Add .exe extension for Windows
    if [ "$GOOS" = "windows" ]; then
        OUTPUT_NAME="${OUTPUT_NAME}.exe"
    fi

    echo "Compiling for $GOOS/$GOARCH..."
    
    # Run the Go compiler with the target OS and Arch
    GOOS=$GOOS GOARCH=$GOARCH go build -ldflags="-s -w -X main.Version=${VERSION}" -o $OUTPUT_NAME main.go

    if [ $? -ne 0 ]; then
        echo "Error compiling for $GOOS/$GOARCH. Aborting."
        exit 1
    fi
done

echo "All builds complete! Check the '${OUTPUT_DIR}' folder."