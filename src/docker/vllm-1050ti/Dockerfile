# =============================================================================
# Custom vLLM image for NVIDIA Pascal (GTX 1050 Ti, sm_61 / CC 6.1)
# amd64 only. Flash Attention is disabled (not supported on Pascal).
# Build time: ~1-3 hours. Final image: significantly smaller than official.
#
# Build:
#   DOCKER_BUILDKIT=1 docker build \
#     --build-arg max_jobs=$(nproc) \
#     -t vllm-pascal:latest .
#
# Run:
#   docker run --runtime nvidia --gpus all \
#     -v ~/.cache/huggingface:/root/.cache/huggingface \
#     -e HF_TOKEN=$HF_TOKEN \
#     -p 8000:8000 --ipc=host \
#     vllm-pascal:latest --model <your-model>
# =============================================================================

# --- Stage 1: Builder ---
# Use the CUDA 12.4 devel image (includes nvcc, headers, libraries needed to compile)
FROM nvidia/cuda:12.4.1-devel-ubuntu22.04 AS builder

# Only target Pascal (sm_61). Omitting other archs keeps build fast & image slim.
ARG TORCH_CUDA_ARCH_LIST="6.1"
ARG max_jobs=4
ARG PYTHON_VERSION=3.11
ARG VLLM_VERSION=v0.9.1

ENV DEBIAN_FRONTEND=noninteractive \
    TORCH_CUDA_ARCH_LIST="${TORCH_CUDA_ARCH_LIST}" \
    MAX_JOBS=${max_jobs} \
    # Disable Flash Attention — not supported on Pascal (sm < 8.0)
    VLLM_FLASH_ATTN_VERSION=0 \
    VLLM_SKIP_FLASH_ATTN=1 \
    # Tell vLLM/PyTorch not to try loading flash-attn
    VLLM_ATTENTION_BACKEND=XFORMERS \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Install system dependencies for building
RUN apt-get update && apt-get install -y --no-install-recommends \
        python${PYTHON_VERSION} \
        python${PYTHON_VERSION}-dev \
        python${PYTHON_VERSION}-venv \
        python3-pip \
        git \
        curl \
        wget \
        build-essential \
        ninja-build \
        cmake \
        libssl-dev \
        libffi-dev \
        libnuma-dev \
    && rm -rf /var/lib/apt/lists/*

# Set Python 3.11 as default
RUN update-alternatives --install /usr/bin/python3 python3 /usr/bin/python${PYTHON_VERSION} 1 \
    && update-alternatives --install /usr/bin/python python /usr/bin/python${PYTHON_VERSION} 1 \
    && python -m pip install --upgrade pip setuptools wheel

# Install PyTorch for CUDA 12.4 (cu124 wheel supports sm_61 when you build vLLM from source)
RUN pip install \
    torch==2.4.0 \
    torchvision \
    torchaudio \
    --index-url https://download.pytorch.org/whl/cu124

# Clone vLLM at the specified version tag
WORKDIR /workspace
RUN git clone --depth 1 --branch ${VLLM_VERSION} https://github.com/vllm-project/vllm.git

WORKDIR /workspace/vllm

# Install build dependencies (without flash-attn)
RUN pip install -r requirements/build.txt

# Install xformers — works on Pascal and used as the attention backend
RUN pip install xformers --index-url https://download.pytorch.org/whl/cu124

# Build vLLM from source, targeting only sm_61
# VLLM_INSTALL_PUNICA_KERNELS=0 — LoRA Punica kernels need sm >= 8.0
# VLLM_SKIP_FLASH_ATTN=1 — skip Flash Attention compilation
# vllm_fa_cmake_gpu_arches — empty to skip FA build
RUN VLLM_SKIP_FLASH_ATTN=1 \
    VLLM_INSTALL_PUNICA_KERNELS=0 \
    pip install --no-build-isolation \
        --extra-index-url https://download.pytorch.org/whl/cu124 \
        -e . 2>&1 | tee /tmp/vllm_build.log

# --- Stage 2: Runtime ---
# Switch to a lighter CUDA runtime base (no nvcc, just the CUDA runtime libs)
FROM nvidia/cuda:12.4.1-runtime-ubuntu22.04

ARG PYTHON_VERSION=3.11

ENV DEBIAN_FRONTEND=noninteractive \
    # Point to the correct attention backend at runtime (no flash-attn on Pascal)
    VLLM_ATTENTION_BACKEND=XFORMERS \
    VLLM_FLASH_ATTN_VERSION=0 \
    VLLM_SKIP_FLASH_ATTN=1 \
    # Allocate ~80% GPU memory (adjust for 4GB VRAM on 1050 Ti)
    VLLM_GPU_MEMORY_UTILIZATION=0.80 \
    HF_HOME=/root/.cache/huggingface \
    PYTHONUNBUFFERED=1

RUN apt-get update && apt-get install -y --no-install-recommends \
        python${PYTHON_VERSION} \
        python${PYTHON_VERSION}-venv \
        python3-pip \
        libgomp1 \
        libnuma1 \
        curl \
    && rm -rf /var/lib/apt/lists/*

RUN update-alternatives --install /usr/bin/python3 python3 /usr/bin/python${PYTHON_VERSION} 1 \
    && update-alternatives --install /usr/bin/python python /usr/bin/python${PYTHON_VERSION} 1

# Copy Python site-packages and built vLLM from the builder
COPY --from=builder /usr/local/lib/python${PYTHON_VERSION} /usr/local/lib/python${PYTHON_VERSION}
COPY --from=builder /usr/local/bin /usr/local/bin
COPY --from=builder /workspace/vllm /workspace/vllm

# Also copy CUDA shared libraries needed at runtime (cublas, cusparse, etc.)
COPY --from=builder /usr/local/cuda/lib64/libcublas*.so* /usr/local/cuda/lib64/
COPY --from=builder /usr/local/cuda/lib64/libcusparse*.so* /usr/local/cuda/lib64/
COPY --from=builder /usr/local/cuda/lib64/libcurand*.so* /usr/local/cuda/lib64/
COPY --from=builder /usr/local/cuda/lib64/libcufft*.so* /usr/local/cuda/lib64/

ENV LD_LIBRARY_PATH=/usr/local/cuda/lib64:${LD_LIBRARY_PATH}

WORKDIR /workspace/vllm

EXPOSE 8000

# Default entrypoint: serve the OpenAI-compatible API
# Pass your model via --model when running the container
ENTRYPOINT ["python", "-m", "vllm.entrypoints.openai.api_server"]
CMD ["--host", "0.0.0.0", "--port", "8000"]