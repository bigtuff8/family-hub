FROM python:3.11-slim

WORKDIR /app

# Install Chromium browser dependencies needed by Playwright
# (manually instead of --with-deps to avoid unavailable font packages)
RUN apt-get update && apt-get install -y --no-install-recommends \
    # Core Chromium dependencies
    libnss3 libnspr4 libdbus-1-3 libatk1.0-0 libatk-bridge2.0-0 \
    libcups2 libdrm2 libxkbcommon0 libxcomposite1 libxdamage1 \
    libxfixes3 libxrandr2 libgbm1 libpango-1.0-0 libcairo2 \
    libasound2 libatspi2.0-0 libxshmfence1 \
    # Additional libs Chromium may need
    libx11-6 libx11-xcb1 libxcb1 libxext6 libxi6 libxtst6 \
    libglib2.0-0 libexpat1 \
    # Fonts (using available alternatives)
    fonts-liberation fonts-dejavu-core \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install Playwright Chromium (without --with-deps since we handled deps above)
RUN playwright install chromium

COPY . .

# Create data directory for cookies and browser state
RUN mkdir -p /data

CMD ["python", "main.py"]
