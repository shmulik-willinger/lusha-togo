#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"

# Resolve node binary
NODE=$( (ls /opt/homebrew/Cellar/node/*/bin/node 2>/dev/null | sort -V | tail -1) || echo "node" )
export PATH="$(dirname "$NODE"):/opt/homebrew/bin:/usr/local/bin:$PATH"

# Resolve Java 17
JAVA17_BASE="/opt/homebrew/Cellar/openjdk@17"
JAVA17_VER=$(ls "$JAVA17_BASE" 2>/dev/null | sort -V | tail -1)
JAVA17_HOME="$JAVA17_BASE/$JAVA17_VER/libexec/openjdk.jdk/Contents/Home"
if [ -x "$JAVA17_HOME/bin/java" ]; then
  export JAVA_HOME="$JAVA17_HOME"
  export PATH="$JAVA_HOME/bin:$PATH"
  echo "☕ Java: $($JAVA_HOME/bin/java -version 2>&1 | head -1)"
fi
EXPO="$NODE ./node_modules/.bin/expo"

echo "⚙️  Running expo prebuild..."
$EXPO prebuild --platform android --no-install 2>&1 | tail -5

# Patch 1: tell Gradle where to find node
sed -i '' "s|// nodeExecutableAndArgs = \[\"node\"\]|nodeExecutableAndArgs = [\"$NODE\"]|" android/app/build.gradle

# Patch 2: add release signingConfig block after the debug block
# Prebuild always generates:  keyPassword 'android'\n        }\n    }
# We replace that closing with the closing + a new release block
sed -i '' "s|            keyPassword 'android'\n        }\n    }|            keyPassword 'android'\n        }\n        release {\n            storeFile file('lusha-togo.keystore')\n            storePassword '808080'\n            keyAlias 'lusha-togo'\n            keyPassword '808080'\n        }\n    }|" android/app/build.gradle 2>/dev/null || true

# Patch 2 (fallback — if sed doesn't handle \n, use Python):
if ! grep -q "lusha-togo.keystore" android/app/build.gradle; then
  python3 - <<'PYEOF'
import re
path = 'android/app/build.gradle'
c = open(path).read()
release_block = """
        release {
            storeFile file('lusha-togo.keystore')
            storePassword '808080'
            keyAlias 'lusha-togo'
            keyPassword '808080'
        }"""
# Insert release block after the debug signingConfig closing brace
c = re.sub(
    r"(signingConfigs \{.*?debug \{.*?\})",
    lambda m: m.group(0) + release_block,
    c, flags=re.DOTALL, count=1
)
open(path, 'w').write(c)
print("✅ Injected release signingConfig")
PYEOF
fi

# Patch 3: point buildTypes.release at signingConfigs.release
sed -i '' 's|signingConfig signingConfigs\.debug // release|signingConfig signingConfigs.release|' android/app/build.gradle
# Standard prebuild puts signingConfigs.debug in release buildType — replace it
python3 - <<'PYEOF'
import re
path = 'android/app/build.gradle'
c = open(path).read()
# In buildTypes.release, replace signingConfig signingConfigs.debug with .release
c = re.sub(
    r'(buildTypes \{.*?release \{.*?signingConfig\s+)signingConfigs\.debug',
    r'\1signingConfigs.release',
    c, flags=re.DOTALL, count=1
)
open(path, 'w').write(c)
print("✅ Wired release buildType to signingConfigs.release")
PYEOF

echo "🔨 Building release AAB..."
cd android
./gradlew bundleRelease --no-daemon
cd ..

AAB="android/app/build/outputs/bundle/release/app-release.aab"
if [ -f "$AAB" ]; then
  SIZE=$(du -h "$AAB" | cut -f1)
  echo ""
  echo "✅ Release AAB ready ($SIZE): $AAB"
  echo "📦 Upload this file to Google Play Console → Internal Testing"
else
  echo "❌ AAB not found — check build output above"
  exit 1
fi
