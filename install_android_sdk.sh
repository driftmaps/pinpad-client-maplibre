#!/bin/bash
set -eu

# Define the installation directory
ANDROID_HOME="$HOME/Library/Android/sdk"

# Check if Android SDK is already installed
if [ -d "$ANDROID_HOME" ]; then
    echo "Android SDK is already installed at ${ANDROID_HOME}."
    echo "Are you using Android studio?"
    echo "Installation aborted."
    exit 0
fi

# Define the installation directory
ANDROID_HOME="$HOME/Android/Sdk"
# Check if Android SDK is already installed
if [ -d "$ANDROID_HOME" ]; then
    echo "Android SDK is already installed at ${ANDROID_HOME}."
    echo "Installation aborted."
    exit 0
fi


# Create necessary directories
mkdir -p "$CMDLINE_TOOLS_DIR"

# Download the command line tools
echo "Downloading Android command line tools..."
curl -o commandlinetools.zip https://dl.google.com/android/repository/commandlinetools-linux-9477386_latest.zip

# Create a temporary directory for extraction
tmp_dir=$(mktemp -d)

# Extract the downloaded zip into the temporary directory
echo "Extracting command line tools..."
unzip commandlinetools.zip -d "$tmp_dir"

# Move the extracted cmdline-tools to the final installation directory
echo "Moving command line tools to ${CMDLINE_TOOLS_DIR}..."
mv "$tmp_dir/cmdline-tools/"* "$CMDLINE_TOOLS_DIR/"

# Clean up temporary files
rm -rf commandlinetools.zip "$tmp_dir"

# Ensure sdkmanager is executable
chmod +x "${CMDLINE_TOOLS_DIR}/bin/sdkmanager"

# Update PATH
export PATH="$PATH:${CMDLINE_TOOLS_DIR}/bin:${ANDROID_HOME}/platform-tools"

# Accept licenses and install essential SDK components
echo "Accepting licenses and installing essential SDK components..."
yes | "${CMDLINE_TOOLS_DIR}/bin/sdkmanager" --licenses
"${CMDLINE_TOOLS_DIR}/bin/sdkmanager" "platform-tools" "platforms;android-33" "build-tools;33.0.0"

# Reminder to set ANDROID_HOME
echo ""
echo "Android SDK has been successfully installed to ${ANDROID_HOME}."
echo "Please set ANDROID_HOME in your shell configuration (e.g., ~/.bashrc or ~/.zshrc):"
echo "export ANDROID_HOME=\"${ANDROID_HOME}\""
echo "export PATH=\"\$PATH:\$ANDROID_HOME/cmdline-tools/latest/bin:\$ANDROID_HOME/platform-tools\""
echo "After adding the above lines, reload your shell configuration by running 'source ~/.bashrc' or 'source ~/.zshrc'."
