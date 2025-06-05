FROM python:3.11-slim

WORKDIR /app

# Install system dependencies including pinned iputils-ping
# Using --no-install-recommends to keep the image slim
RUN apt-get update \
    && apt-get install -y --no-install-recommends iputils-ping=3:20221126-1+deb12u1 \
    && rm -rf /var/lib/apt/lists/*

# Copy application files needed for runtime
# test_ping_wrapper.py is not copied to keep the production image lean.
COPY ping_wrapper.py repeat_every_second.sh ./

# Create log directory. This is useful if not mounting a volume,
# and ensures the directory exists for ping_wrapper.py.
# ping_wrapper.py uses LOG_BASE_PATH (default: /app/logs).
RUN mkdir -p logs

# Set the entrypoint to run the ping wrapper script periodically
# The scripts and python executable are now directly in /app/ (the WORKDIR)
ENTRYPOINT ["bash", "repeat_every_second.sh", "python", "ping_wrapper.py"]

# Default arguments for ping_wrapper.py (target_ip, hostname)
# These can be overridden when running the container via docker run or docker-compose.
CMD ["8.8.8.8", "default_host"]
