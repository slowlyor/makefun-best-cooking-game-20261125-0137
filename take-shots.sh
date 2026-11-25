#!/usr/bin/env bash
# Take the entry's screenshots with the headless Chrome in .tools/.
# Usage: ./take-shots.sh [port] — serves game/ and shoots each ?shot= scene.
set -euo pipefail
DIR="$(cd "$(dirname "$0")" && pwd)"
PORT="${1:-8123}"
CHROME="/home/hatch/workspace/makefun/.tools/chrome-headless-shell-linux64/chrome-headless-shell"
TMP="$DIR/.shots-tmp"
mkdir -p "$TMP"

node "$DIR/serve.ts" --port "$PORT" >"$TMP/server.log" 2>&1 &
SERVER_PID=$!
trap 'kill $SERVER_PID 2>/dev/null || true' EXIT
sleep 1

for spec in "1-cover:cover" "2-mid:mid" "3-serve:serve" "4-end:end"; do
  name="${spec%%:*}"
  shot="${spec##*:}"
  "$CHROME" --headless --disable-gpu --no-sandbox --hide-scrollbars \
    --window-size=1280,800 --virtual-time-budget=4000 \
    --screenshot="$TMP/$name.png" \
    "http://127.0.0.1:$PORT/index.html?shot=$shot&seed=1" >/dev/null 2>&1
  python3 - "$TMP/$name.png" "$DIR/screenshots/$name.jpg" <<'PY'
import sys
from PIL import Image
src, dst = sys.argv[1], sys.argv[2]
im = Image.open(src).convert("RGB")
im.save(dst, "JPEG", quality=88)
print(dst, im.size)
PY
done
ls -la "$DIR/screenshots/"
