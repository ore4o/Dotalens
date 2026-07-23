#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
JAVA_HOME_PATH="${DOTA_LENS_JAVA_HOME:-${JAVA_HOME:-}}"

if [[ -z "$JAVA_HOME_PATH" && -x /usr/libexec/java_home ]]; then
  JAVA_HOME_PATH="$(/usr/libexec/java_home -v 21 2>/dev/null || true)"
fi
if [[ -z "$JAVA_HOME_PATH" ]]; then
  echo "JDK 21 was not found. Set DOTA_LENS_JAVA_HOME or JAVA_HOME to a JDK 21 installation." >&2
  exit 1
fi
if [[ ! -x "$JAVA_HOME_PATH/bin/java" ]]; then
  echo "Java was not found at $JAVA_HOME_PATH/bin/java" >&2
  exit 1
fi
if ! "$JAVA_HOME_PATH/bin/java" -version 2>&1 | head -n 1 | grep -Eq '(version "21\.|openjdk 21\.)'; then
  echo "Dota Lens parser requires JDK 21; $JAVA_HOME_PATH is not a JDK 21 installation." >&2
  exit 1
fi
if ! command -v mvn >/dev/null 2>&1; then
  echo "Maven 3.9+ is required. Install it, then rerun this command." >&2
  exit 1
fi

export JAVA_HOME="$JAVA_HOME_PATH"
export PATH="$JAVA_HOME/bin:$PATH"
MAVEN_SETTINGS_ARGS=()
if [[ -n "${DOTA_LENS_MAVEN_SETTINGS:-}" ]]; then
  MAVEN_SETTINGS_ARGS=(-s "$DOTA_LENS_MAVEN_SETTINGS")
fi
if [[ -n "${DOTA_LENS_MAVEN_GLOBAL_SETTINGS:-}" ]]; then
  MAVEN_SETTINGS_ARGS=(-gs "$DOTA_LENS_MAVEN_GLOBAL_SETTINGS" "${MAVEN_SETTINGS_ARGS[@]}")
fi
mvn "${MAVEN_SETTINGS_ARGS[@]}" -f "$ROOT/tools/replay-parser/pom.xml" clean package "$@"

JAR="$ROOT/tools/replay-parser/target/stats-0.1.0.jar"
if [[ ! -f "$JAR" ]]; then
  echo "Build completed without the expected shaded JAR: $JAR" >&2
  exit 1
fi
echo "Parser JAR: $JAR"
