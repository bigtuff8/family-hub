FROM python:3.11-slim

WORKDIR /app

# Install Python dependencies first (better caching)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install Playwright's Chromium and system dependencies
# This downloads a Chromium build compatible with the current architecture (including ARM64)
RUN playwright install --with-deps chromium

COPY . .

# Create data directory for cookies and browser state
RUN mkdir -p /data

CMD ["python", "main.py"]
