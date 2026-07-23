#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
JAVA_HOME_PATH="${DOTA_LENS_JAVA_HOME:-${JAVA_HOME:-}}"
OUTPUT_DIRECTORY="${1:-$ROOT/tools/runtime/jre-dota-lens}"

if [[ -z "$JAVA_HOME_PATH" && -x /usr/libexec/java_home ]]; then
  JAVA_HOME_PATH="$(/usr/libexec/java_home -v 21 2>/dev/null || true)"
fi
if [[ -z "$JAVA_HOME_PATH" || ! -x "$JAVA_HOME_PATH/bin/jlink" ]]; then
  echo "JDK 21 with jlink was not found. Set DOTA_LENS_JAVA_HOME or JAVA_HOME." >&2
  exit 1
fi
if ! "$JAVA_HOME_PATH/bin/java" -version 2>&1 | head -n 1 | grep -Eq '(version "21\.|openjdk 21\.)'; then
  echo "Dota Lens runtime requires JDK 21; $JAVA_HOME_PATH is not a JDK 21 installation." >&2
  exit 1
fi

OUTPUT_PARENT="$(dirname "$OUTPUT_DIRECTORY")"
mkdir -p "$OUTPUT_PARENT"
OUTPUT_DIRECTORY="$(cd "$OUTPUT_PARENT" && pwd)/$(basename "$OUTPUT_DIRECTORY")"
case "$OUTPUT_DIRECTORY" in
  "$ROOT/tools/runtime"/*) ;;
  *) echo "Output directory must stay inside $ROOT/tools/runtime" >&2; exit 1 ;;
esac

rm -rf "$OUTPUT_DIRECTORY"
"$JAVA_HOME_PATH/bin/jlink" \
  --add-modules java.base,java.logging,java.management,java.naming,java.net.http,java.security.jgss,jdk.crypto.ec,jdk.httpserver,jdk.unsupported \
  --strip-debug --no-man-pages --no-header-files --compress=2 --output "$OUTPUT_DIRECTORY"

if [[ ! -x "$OUTPUT_DIRECTORY/bin/java" ]]; then
  echo "Runtime build did not produce $OUTPUT_DIRECTORY/bin/java" >&2
  exit 1
fi
echo "Dota Lens runtime: $OUTPUT_DIRECTORY"
