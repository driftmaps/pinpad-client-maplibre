#!/bin/bash
set -eu

# Define the installation directory
ANDROID_HOME="$HOME/Library/Android/sdk"

# Check if Android SDK is globally installed
if [ -d "$ANDROID_HOME" ]; then
    echo "Android SDK is already installed at ${ANDROID_HOME}."
    echo "Are you using Android Studio?"
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

# Define the installation directory
CMDLINE_TOOLS_DIR="${ANDROID_HOME}/cmdline-tools/latest"
EMU_NAME="GigglyGadget"  # Funny and distinctive emulator name

# Function to clean up temporary files in case of an error
cleanup() {
    rm -rf commandlinetools.zip "$tmp_dir" 2>/dev/null || true
}
trap cleanup EXIT

# Create necessary directories
mkdir -p "$CMDLINE_TOOLS_DIR"

# Download the command line tools
echo "Downloading Android command line tools..."
curl -f -L -o commandlinetools.zip https://dl.google.com/android/repository/commandlinetools-mac-9477386_latest.zip
# # For Linux,
# curl -f -L -o commandlinetools.zip https://dl.google.com/android/repository/commandlinetools-`linux`-9477386_latest.zip

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

# Ensure sdkmanager and avdmanager are executable
chmod +x "${CMDLINE_TOOLS_DIR}/bin/sdkmanager"
chmod +x "${CMDLINE_TOOLS_DIR}/bin/avdmanager"

# Update PATH for the current script execution
export PATH="$PATH:${CMDLINE_TOOLS_DIR}/bin:${ANDROID_HOME}/platform-tools:${ANDROID_HOME}/emulator"

# Accept licenses and install essential SDK components
echo "Accepting licenses and installing essential SDK components..."
yes | "${CMDLINE_TOOLS_DIR}/bin/sdkmanager" --licenses
"${CMDLINE_TOOLS_DIR}/bin/sdkmanager" "platform-tools" "platforms;android-33" "build-tools;33.0.0"

# Install Emulator and System Image
echo "Installing Emulator and System Image..."
yes | "${CMDLINE_TOOLS_DIR}/bin/sdkmanager" "emulator" "system-images;android-33;google_apis;arm64-v8a"
# # For Linux, try
# yes | "${CMDLINE_TOOLS_DIR}/bin/sdkmanager" "emulator" "system-images;android-33;google_apis;x86_64"

# Install the NDK
echo "Installing Android NDK (ARM64)..."
NDK_VERSION="26.1.10893604"  # Replace with desired NDK version if needed
yes | "${CMDLINE_TOOLS_DIR}/bin/sdkmanager" "ndk;${NDK_VERSION}" "cmake;3.26.4"

# Verify NDK Installation
NDK_DIR="${ANDROID_HOME}/ndk/${NDK_VERSION}"
if [ ! -f "${NDK_DIR}/source.properties" ]; then
    echo "Error: NDK installation incomplete. 'source.properties' not found in ${NDK_DIR}."
    exit 1
fi
echo "NDK installed successfully at ${NDK_DIR}."

# Verify CMake Installation
CMAKE_VERSION="3.26.4"  # Updated to a newer version for better compatibility
CMAKE_DIR="${ANDROID_HOME}/cmake/${CMAKE_VERSION}"
if [ ! -f "${CMAKE_DIR}/bin/cmake" ]; then
    echo "Error: CMake installation incomplete. 'cmake' not found in ${CMAKE_DIR}/bin."
    exit 1
fi
echo "CMake installed successfully at ${CMAKE_DIR}."

# Ensure 'ninja' is executable
NINJA_PATH="${CMAKE_DIR}/bin/ninja"
if [ -f "$NINJA_PATH" ]; then
    chmod +x "$NINJA_PATH"
    echo "'ninja' is now executable."
else
    echo "Error: 'ninja' executable not found at ${NINJA_PATH}."
    exit 1
fi

# Add CMake's bin directory to PATH
export PATH="$PATH:${CMAKE_DIR}/bin"

# Create the AVD with a funny and distinctive name
echo "Creating Android Virtual Device (AVD) named '${EMU_NAME}'..."
echo "no" | "${CMDLINE_TOOLS_DIR}/bin/avdmanager" create avd -n "${EMU_NAME}" -k "system-images;android-33;google_apis;arm64-v8a" --force
# # For Linux, try
# echo "no" | avdmanager create avd -n "${EMU_NAME}" -k "system-images;android-33;google_apis;x86_64" --force

# Ensure emulator is executable
chmod +x "${ANDROID_HOME}/emulator/emulator"

# Reminder to set ANDROID_HOME
echo ""
echo "Android SDK has been successfully installed to ${ANDROID_HOME}."
echo "Please set ANDROID_HOME in your shell configuration (e.g., ~/.bashrc or ~/.zshrc):"
echo "export ANDROID_HOME=\"${ANDROID_HOME}\""
echo "export PATH=\"\$PATH:\$ANDROID_HOME/cmdline-tools/latest/bin:\$ANDROID_HOME/platform-tools:\$ANDROID_HOME/emulator:\$ANDROID_HOME/cmake/${CMAKE_VERSION}/bin\""
echo "After adding the above lines, reload your shell configuration by running 'source ~/.bashrc' or 'source ~/.zshrc'."

# Instructions to launch the newly created emulator
echo ""
echo "You have successfully created an Android emulator named '${EMU_NAME}'."
echo "To launch the emulator, run the following command:"
echo "  emulator -avd ${EMU_NAME}"
echo "Alternatively, you can launch it from Android Studio's AVD Manager."
