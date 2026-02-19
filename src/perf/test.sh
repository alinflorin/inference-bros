#!/bin/bash

set -e

# Configuration
VERSION="v0.3.1"
BASE_URL="https://github.com/wheynelau/llmperf-rs/releases/download/${VERSION}"
INSTALL_DIR="."

# Environment variable defaults
LLMPERF_MODEL="${LLMPERF_MODEL:-qwen25-05b-instruct}"
LLMPERF_CONCURRENT="${LLMPERF_CONCURRENT:-5}"
LLMPERF_MAX_REQUESTS="${LLMPERF_MAX_REQUESTS:-50}"
LLMPERF_MEAN_TOKENS="${LLMPERF_MEAN_TOKENS:-300}"
LLMPERF_STDDEV_INPUT_TOKENS="${LLMPERF_STDDEV_INPUT_TOKENS:-150}"
LLMPERF_MEAN_OUTPUT_TOKENS="${LLMPERF_MEAN_OUTPUT_TOKENS:-150}"
LLMPERF_STDDEV_OUTPUT_TOKENS="${LLMPERF_STDDEV_OUTPUT_TOKENS:-50}"
LLMPERF_ENV="${LLMPERF_ENV:-local}"
OPENAI_API_BASE="${OPENAI_API_BASE:-https://bifrost.${LLMPERF_ENV}.inferencebros.com/v1}"
LLMPERF_TIMEOUT="${LLMPERF_TIMEOUT:-180}"
# OPENAI_API_KEY should be set by user (no default for security)
export OPENAI_API_BASE
export OPENAI_API_KEY

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Helper functions
info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

# Detect OS and architecture
detect_platform() {
    local os=$(uname -s)
    local arch=$(uname -m)

    case "$os" in
        Linux)
            if [ "$arch" = "x86_64" ]; then
                echo "x86_64-unknown-linux-gnu"
            elif [ "$arch" = "aarch64" ] || [ "$arch" = "arm64" ]; then
                echo "aarch64-unknown-linux-gnu"
            else
                error "Unsupported Linux architecture: $arch"
            fi
            ;;
        Darwin)
            if [ "$arch" = "x86_64" ]; then
                echo "x86_64-apple-darwin"
            elif [ "$arch" = "arm64" ]; then
                error "This script is for Intel Mac only. For Apple Silicon, use: aarch64-apple-darwin"
            else
                error "Unsupported macOS architecture: $arch"
            fi
            ;;
        MINGW*|MSYS*|CYGWIN*)
            if [ "$arch" = "x86_64" ]; then
                echo "x86_64-pc-windows-msvc"
            else
                error "Unsupported Windows architecture: $arch"
            fi
            ;;
        *)
            error "Unsupported OS: $os"
            ;;
    esac
}

# Download and extract binary
install_llmperf() {
    local platform=$1
    local is_windows=false

    # Check if Windows
    if [[ "$platform" == *"windows"* ]]; then
        is_windows=true
        local archive_name="llmperf-${platform}.zip"
        local extract_dir="llmperf-${platform}"
    else
        local archive_name="llmperf-${platform}.tar.xz"
        local extract_dir="llmperf-${platform}"
    fi

    local download_url="${BASE_URL}/${archive_name}"

    info "Detected platform: $platform"

    info "Downloading llmperf from: $download_url"
    if command -v curl &> /dev/null; then
        curl -L -o "${archive_name}" "$download_url" || error "Failed to download"
    elif command -v wget &> /dev/null; then
        wget -O "${archive_name}" "$download_url" || error "Failed to download"
    else
        error "Neither curl nor wget found. Please install one of them."
    fi

    info "Extracting archive..."
    if [ "$is_windows" = true ]; then
        if command -v unzip &> /dev/null; then
            unzip -q "${archive_name}" || error "Failed to extract"
        else
            error "unzip not found. Please install unzip."
        fi
    else
        tar -xf "${archive_name}" || error "Failed to extract"
    fi

    info "Moving binary to current directory..."
    if [ "$is_windows" = true ]; then
        if [ -f "${extract_dir}/llmperf.exe" ]; then
            mv "${extract_dir}/llmperf.exe" "${INSTALL_DIR}/" || error "Failed to move binary"
        else
            error "Binary not found in ${extract_dir}/"
        fi
        chmod +x "${INSTALL_DIR}/llmperf.exe" 2>/dev/null || true
    else
        if [ -f "${extract_dir}/llmperf" ]; then
            mv "${extract_dir}/llmperf" "${INSTALL_DIR}/" || error "Failed to move binary"
        else
            error "Binary not found in ${extract_dir}/"
        fi
        chmod +x "${INSTALL_DIR}/llmperf"
    fi

    info "Cleaning up..."
    rm "${archive_name}"
    rm -rf "${extract_dir}"

    info "Installation complete!"
}

# Check if llmperf is already installed
check_installation() {
    if [ -f "./llmperf" ] || [ -f "./llmperf.exe" ]; then
        if [ -f "./llmperf" ]; then
            info "llmperf already installed at ./llmperf"
        else
            info "llmperf already installed at ./llmperf.exe"
        fi
        return 0
    else
        return 1
    fi
}

# Run llmperf with provided arguments
run_llmperf() {
    local binary="./llmperf"

    # Check for Windows binary
    if [ -f "./llmperf.exe" ]; then
        binary="./llmperf.exe"
    elif [ ! -f "./llmperf" ]; then
        error "llmperf not found. Please install first."
    fi

    # Check if API key is set
    if [ -z "$OPENAI_API_KEY" ]; then
        warn "OPENAI_API_KEY is not set. The benchmark may fail if authentication is required."
        echo ""
    fi

    info "Running llmperf with configuration:"
    info "  OPENAI_API_BASE: ${OPENAI_API_BASE}"
    info "  OPENAI_API_KEY: ${OPENAI_API_KEY:+***set***}"
    info "  Model: ${LLMPERF_MODEL}"
    info "  Timeout: ${LLMPERF_TIMEOUT}"
    info "  Concurrent requests: ${LLMPERF_CONCURRENT}"
    info "  Max requests: ${LLMPERF_MAX_REQUESTS}"
    info "  Mean input tokens: ${LLMPERF_MEAN_TOKENS} (±${LLMPERF_STDDEV_INPUT_TOKENS})"
    info "  Mean output tokens: ${LLMPERF_MEAN_OUTPUT_TOKENS} (±${LLMPERF_STDDEV_OUTPUT_TOKENS})"
    echo ""

    "${binary}" \
        --model "kubeai/${LLMPERF_MODEL}" \
        --num-concurrent-requests "${LLMPERF_CONCURRENT}" \
        --no-check-endpoint \
        --no-thinking \
        --timeout ${LLMPERF_TIMEOUT} \
        --max-num-completed-requests "${LLMPERF_MAX_REQUESTS}" \
        --mean-input-tokens "${LLMPERF_MEAN_TOKENS}" \
        --stddev-input-tokens "${LLMPERF_STDDEV_INPUT_TOKENS}" \
        --mean-output-tokens "${LLMPERF_MEAN_OUTPUT_TOKENS}" \
        --stddev-output-tokens "${LLMPERF_STDDEV_OUTPUT_TOKENS}" \
        --results-dir results/
}

# Main script
main() {
    info "llmperf-rs test script"
    info "Version: ${VERSION}"
    echo ""

    # Install if not already present
    if ! check_installation; then
        platform=$(detect_platform)
        install_llmperf "$platform"
        echo ""
    fi

    # Run llmperf with configured parameters
    run_llmperf
}

main "$@"
