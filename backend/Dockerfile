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

# COPY EVERYTHING FIRST
COPY . .

# Now it can build correctly
RUN uv sync --no-dev

RUN chmod +x /face/entrypoint.sh

EXPOSE 8000

ENTRYPOINT ["/bin/sh", "/face/entrypoint.sh"]
CMD ["uv", "run", "app/main.py"]
