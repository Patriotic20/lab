FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/face

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    cmake \
    libgl1 \
    libglib2.0-0 \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /face

RUN pip install --no-cache-dir uv

# Copy everything first (uv needs pyproject.toml + uv.lock)
COPY . .

# Install dependencies into .venv (no dev extras)
RUN uv sync --no-dev

# Add .venv binaries to PATH so uvicorn is found directly
ENV PATH="/face/.venv/bin:$PATH"

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
