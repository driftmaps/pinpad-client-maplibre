#!/bin/bash

# Create formatters directory if it doesn't exist
mkdir -p .formatters

# Download ktlint for Kotlin formatting
echo "Downloading ktlint..."
curl -sSL https://github.com/pinterest/ktlint/releases/download/1.2.1/ktlint -o .formatters/ktlint
chmod +x .formatters/ktlint

# Download swiftformat for Swift formatting
echo "Downloading swiftformat..."
PLATFORM=$(uname)
if [ "$PLATFORM" = "Darwin" ]; then
  # macOS - download the binary
  curl -sSL https://github.com/nicklockwood/SwiftFormat/releases/download/0.53.0/swiftformat.zip -o .formatters/swiftformat.zip
  unzip -o .formatters/swiftformat.zip -d .formatters/
  rm .formatters/swiftformat.zip
  chmod +x .formatters/swiftformat
else
  # For non-macOS platforms, we'll provide instructions
  echo "SwiftFormat binary is only available for macOS."
  echo "For other platforms, please follow the installation instructions at:"
  echo "https://github.com/nicklockwood/SwiftFormat#command-line-tool"
  echo "Or use the Swift Package Manager version if Swift is installed."
fi

echo "Formatters setup complete!" 