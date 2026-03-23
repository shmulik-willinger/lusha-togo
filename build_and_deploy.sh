#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"

# Resolve node binary — homebrew symlinks may be broken, use Cellar path directly
NODE=$( (ls /opt/homebrew/Cellar/node/*/bin/node 2>/dev/null | sort -V | tail -1) || echo "node" )
export PATH="$(dirname "$NODE"):/opt/homebrew/bin:/usr/local/bin:$PATH"

# Resolve Java 17 (required by Gradle / Android build)
JAVA17_BASE="/opt/homebrew/Cellar/openjdk@17"
JAVA17_VER=$(ls "$JAVA17_BASE" 2>/dev/null | sort -V | tail -1)
JAVA17_HOME="$JAVA17_BASE/$JAVA17_VER/libexec/openjdk.jdk/Contents/Home"
if [ -x "$JAVA17_HOME/bin/java" ]; then
  export JAVA_HOME="$JAVA17_HOME"
  export PATH="$JAVA_HOME/bin:$PATH"
  echo "☕ Java: $($JAVA_HOME/bin/java -version 2>&1 | head -1)"
fi
EXPO="$NODE ./node_modules/.bin/expo"

LOCK=/tmp/lusha_togo_build.lock
if [ -e "$LOCK" ]; then
  echo "⚠️  Build already running — skipping."
  exit 0
fi
touch "$LOCK"
trap "rm -f $LOCK" EXIT

# ── 1. Bump patch version in app.json + package.json ────────────────────────
# app.json is the source of truth; expo prebuild reads it to write build.gradle
CURRENT=$("$NODE" -e "console.log(require('./app.json').expo.version)")
IFS='.' read -r MAJOR MINOR PATCH <<< "$CURRENT"
PATCH=$((PATCH + 1))
NEW_VERSION="$MAJOR.$MINOR.$PATCH"

# Read current versionCode from app.json (falls back to build.gradle if not set)
CURRENT_CODE=$("$NODE" -e "
const d = require('./app.json');
const vc = d.expo && d.expo.android && d.expo.android.versionCode;
console.log(vc || 0);
")
if [ "$CURRENT_CODE" -eq 0 ]; then
  # Bootstrap from build.gradle
  CURRENT_CODE=$(grep 'versionCode ' android/app/build.gradle | grep -o '[0-9]*' | head -1)
fi
NEW_CODE=$((CURRENT_CODE + 1))

# Write updated app.json (version + versionCode — so prebuild picks them up)
"$NODE" -e "
const fs = require('fs');
const p = './app.json';
const d = JSON.parse(fs.readFileSync(p));
d.expo.version = '$NEW_VERSION';
if (!d.expo.android) d.expo.android = {};
d.expo.android.versionCode = $NEW_CODE;
fs.writeFileSync(p, JSON.stringify(d, null, 2) + '\n');
"

# Write updated package.json
"$NODE" -e "
const fs = require('fs');
const p = './package.json';
const d = JSON.parse(fs.readFileSync(p));
d.version = '$NEW_VERSION';
fs.writeFileSync(p, JSON.stringify(d, null, 2) + '\n');
"

echo "🔢 Version bumped: $CURRENT → $NEW_VERSION (code $NEW_CODE)"

# ── 2. Expo prebuild (writes versionCode/versionName into build.gradle) ──────
echo "⚙️  Running expo prebuild..."
$EXPO prebuild --platform android --no-install 2>&1 | tail -5

# ── 2b. Patch build.gradle to bundle JS in debug builds (no Metro needed) ────
# By default Expo/RN skips JS bundling for 'debug' variant (requires Metro).
# Setting debuggableVariants=[] forces the bundle to be baked into the APK.
sed -i '' 's|// debuggableVariants = \["liteDebug", "prodDebug"\]|debuggableVariants = []|' android/app/build.gradle
# Tell Gradle where to find node (homebrew symlinks may be broken)
sed -i '' "s|// nodeExecutableAndArgs = \[\"node\"\]|nodeExecutableAndArgs = [\"$NODE\"]|" android/app/build.gradle

# ── 3. Gradle debug build ─────────────────────────────────────────────────────
echo "🔨 Building debug APK (with bundled JS)..."
cd android
./gradlew assembleDebug --no-daemon -q
cd ..

APK="android/app/build/outputs/apk/debug/app-debug.apk"
echo "✅ Build complete: $APK"

# ── 4. ADB install (allow downgrade with -d for dev convenience) ──────────────
ADB="$HOME/Library/Android/sdk/platform-tools/adb"
[ -x "$ADB" ] || ADB="adb"

if "$ADB" devices 2>/dev/null | grep -q "device$"; then
  echo "📱 Installing on device..."
  # Prefer physical device over emulator when multiple devices are connected
  PHYSICAL=$("$ADB" devices | awk '/\tdevice$/ && !/emulator/ {print $1; exit}')
  if [ -n "$PHYSICAL" ]; then
    "$ADB" -s "$PHYSICAL" install -r -d "$APK"
  else
    "$ADB" install -r -d "$APK"
  fi
  echo "🚀 Installed v$NEW_VERSION (code $NEW_CODE)"
else
  echo "ℹ️  No ADB device connected — skipping install."
fi
