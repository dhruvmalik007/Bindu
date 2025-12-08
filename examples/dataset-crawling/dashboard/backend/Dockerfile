# Use an official Python runtime as a parent image
FROM python:3.12-slim

# Set the working directory in the container
WORKDIR /app

# Install system dependencies
# gcc and python3-dev might be needed for some python packages
# curl is useful for healthchecks
RUN apt-get update && apt-get install -y \
    gcc \
    python3-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install uv for fast package management
COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/uv

# Copy requirements first to leverage cache
COPY requirements.txt .

# Install dependencies
# Using pip through uv for compatibility
RUN uv pip install --system -r requirements.txt
RUN uv pip install --system "uvicorn[standard]"

# Copy the rest of the application code
COPY . .

# Expose the port the app runs on
EXPOSE 8000

# Define environment variable for production
ENV PROJECT__ENVIRONMENT=production

# Command to run the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
