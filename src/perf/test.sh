#!/usr/bin/env bash
set -eu

# --- Defaults and environment variables ---
LOCATION="${LOCATION:-local}"                         # default location
API_KEY="${API_KEY:-}"                                # default empty string
MODEL_NAME="${MODEL_NAME:-qwen25-05b-instruct}"       # default model
MAX_CONCURRENCY="${MAX_CONCURRENCY:-16}"             # default max concurrency
MAX_TOKENS="${MAX_TOKENS:-512}"                      # default max tokens
NUM_WORDS="${NUM_WORDS:-50}"                        # default num words

BIN_NAME="llmapibenchmark_linux_amd64"
ARCHIVE_NAME="${BIN_NAME}.tar.gz"
BIN_VERSION="${BIN_VERSION:-v1.0.7}"  
DOWNLOAD_URL="https://github.com/Yoosu-L/llmapibenchmark/releases/download/${BIN_VERSION}/${ARCHIVE_NAME}"
BIN="./${BIN_NAME}"

RESULTS_FILE="./results.json"

# --- Download binary if missing ---
if [ ! -x "$BIN" ]; then
    echo "[INFO] $BIN not found, downloading..."
    if command -v curl >/dev/null 2>&1; then
        curl -fL -o "$ARCHIVE_NAME" "$DOWNLOAD_URL"
    elif command -v wget >/dev/null 2>&1; then
        wget -O "$ARCHIVE_NAME" "$DOWNLOAD_URL"
    else
        echo "[ERROR] Neither curl nor wget found"
        exit 1
    fi

    echo "[INFO] Extracting $BIN_NAME..."
    tar -xzf "$ARCHIVE_NAME"
    chmod +x "$BIN"
    rm -f "$ARCHIVE_NAME"
    echo "[OK] $BIN_NAME is ready"
fi

# --- Build concurrency string ---
CONCURRENCY=$(seq 1 "$MAX_CONCURRENCY" | paste -sd, -)

# --- Build base URL ---
BASE_URL="https://bifrost.${LOCATION}.inferencebros.com/v1"

# --- Show configuration ---
echo "[INFO] Configuration:"
echo "BASE_URL     = $BASE_URL"
echo "API_KEY      = ${API_KEY:+****}"  # hide actual key
echo "MODEL        = kubeai/$MODEL_NAME"
echo "CONCURRENCY  = $CONCURRENCY"
echo "MAX_TOKENS   = $MAX_TOKENS"
echo "NUM_WORDS    = $NUM_WORDS"
echo "RESULTS FILE = $RESULTS_FILE"

# --- Run benchmark and save JSON ---
"$BIN" \
  --base-url "$BASE_URL" \
  $( [ -n "$API_KEY" ] && echo "--api-key $API_KEY" ) \
  --model "kubeai/$MODEL_NAME" \
  --concurrency "$CONCURRENCY" \
  --max-tokens "$MAX_TOKENS" \
  --num-words "$NUM_WORDS" \
  --format json > "$RESULTS_FILE"

echo "[OK] Benchmark finished. Results saved to $RESULTS_FILE"
cat $RESULTS_FILE