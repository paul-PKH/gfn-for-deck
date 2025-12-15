#!/bin/bash
# Bundle Python dependencies with the plugin

echo "Bundling Python dependencies..."

# Create a temporary directory for dependencies
DEPS_DIR="py_modules"
rm -rf "$DEPS_DIR"
mkdir -p "$DEPS_DIR"

# Install requests and its dependencies to the py_modules directory
pip3 install --target="$DEPS_DIR" requests

echo "✅ Python dependencies bundled in $DEPS_DIR/"
echo "These will be included when you deploy the plugin."
