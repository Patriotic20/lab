# NUSMT Test Project

A high-performance FastAPI application integrating PostgreSQL, Redis, and an Admin panel.

## Features

- **FastAPI**: Modern, fast (high-performance) web framework for building APIs with Python 3.12+.
- **PostgreSQL**: Robust open-source relational database using `asyncpg` for async support.
- **Redis**: In-memory data structure store for caching and rate limiting.
- **SQLAdmin**: Admin interface for managing database models.
- **Logfire**: Observability and logging integration.
- **Docker Compose**: Containerized environment for easy deployment.
- **Alembic**: Database handling and migrations.

## Technlogies

- Python 3.12
- FastAPI
- SQLAlchemy (Async)
- SQLAdmin
- Redis
- Docker & Docker Compose
- UV (Package Manager)

## Getting Started

### Prerequisites

- **Docker** and **Docker Compose**
- **Python 3.12+** (for local development without Docker)

### Installation & Running (Docker)

1.  **Clone the repository**:
    ```bash
    git clone <repository-url>
    cd nusmt_test
    ```

2.  **Environment Setup**:
    Ensure you have a `.env` file in the root directory. You can create one based on the configuration required in `docker-compose.yml`.

3.  **Build and Run**:
    ```bash
    docker compose up -d --build
    ```

    The application will be available at:
    -   API: `http://localhost:8000`
    -   Docs: `http://localhost:8000/docs`
    -   Admin: `http://localhost:8000/admin`

### Installation & Running (Local)

1.  **Install dependencies**:
    It is recommended to use `uv` for faster installation, or standard `pip`.
    
    ```bash
    # Using pip
    pip install .
    
    # OR using uv
    uv pip install -r pyproject.toml
    ```

2.  **Setup Database**:
    Ensure PostgreSQL and Redis are running locally or update the `.env` file to point to your instances.

3.  **Run Migrations** (if applicable):
    ```bash
    alembic upgrade head
    ```

4.  **Start the Application**:
    ```bash
    python app/main.py
    ```

## API Documentation

FastAPI provides automatic interactive API documentation:

-   **Swagger UI**: `http://localhost:8000/docs`
-   **ReDoc**: `http://localhost:8000/redoc`

## Project Structure

-   `app/`: Main application source code.
    -   `main.py`: Application entry point.
    -   `models/`: Database models.
    -   `modules/`: API routes and business logic.
    -   `core/`: Core configuration and utilities.
-   `migrations/`: Alembic migration scripts.
-   `docker-compose.yml`: Docker services configuration.
