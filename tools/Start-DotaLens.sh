#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
JAVA_HOME_PATH="${DOTA_LENS_JAVA_HOME:-${JAVA_HOME:-}}"
if [[ -z "$JAVA_HOME_PATH" && -x /usr/libexec/java_home ]]; then
  JAVA_HOME_PATH="$(/usr/libexec/java_home -v 21 2>/dev/null || true)"
fi
if [[ -z "$JAVA_HOME_PATH" || ! -x "$JAVA_HOME_PATH/bin/java" ]]; then
  echo "JDK 21 was not found. Set DOTA_LENS_JAVA_HOME or JAVA_HOME." >&2
  exit 1
fi
if ! "$JAVA_HOME_PATH/bin/java" -version 2>&1 | head -n 1 | grep -Eq '(version "21\.|openjdk 21\.)'; then
  echo "Dota Lens requires JDK 21; $JAVA_HOME_PATH is not a JDK 21 installation." >&2
  exit 1
fi

JAR="$ROOT/tools/replay-parser/target/stats-0.1.0.jar"
if [[ ! -f "$JAR" ]]; then
  "$ROOT/tools/Build-DotaLensParser.sh"
fi
export DOTA_LENS_JAVA_HOME="$JAVA_HOME_PATH"
npm --prefix "$ROOT" run desktop:dev:mac
