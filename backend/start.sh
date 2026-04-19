#!/bin/bash

# Create the virtual environment
python -m venv .venv

# Activate it (Note: the path is .venv/bin/activate)
source .venv/bin/activate

# Install uv and sync
pip install uv
uv sync