set -eu

export ANDROID_HOME=$HOME/Android/Sdk # you need to set this in your shell config as well
PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools
mkdir -p ${ANDROID_HOME}/cmdline-tools/latest
curl -o commandlinetools.zip https://dl.google.com/android/repository/commandlinetools-linux-9477386_latest.zip && \
    unzip commandlinetools.zip && \
    rm commandlinetools.zip && \
    # Move the contents of cmdline-tools into the latest directory to avoid nested cmdline-tools
    mv cmdline-tools/* ${ANDROID_HOME}/cmdline-tools/latest/ && \
    rm -rf cmdline-tools
Ensure sdkmanager is executable
chmod +x ${ANDROID_HOME}/cmdline-tools/latest/bin/sdkmanager
# Accept licenses and install essential SDK components
yes | $ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager --licenses && \
    $ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager "platform-tools" "platforms;android-33" "build-tools;33.0.0"