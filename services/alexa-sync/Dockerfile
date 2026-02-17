FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Create data directory for cookies
RUN mkdir -p /data

CMD ["python", "main.py"]
