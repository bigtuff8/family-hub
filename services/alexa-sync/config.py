"""
Configuration for Alexa shopping list sync service.
Location: services/alexa-sync/config.py
"""

import os

# Family Hub backend API
FAMILYHUB_API_URL = os.getenv("FAMILYHUB_API_URL", "http://backend:8000")
FAMILYHUB_API_KEY = os.getenv("FAMILYHUB_API_KEY", "")

# Amazon settings
AMAZON_DOMAIN = os.getenv("AMAZON_DOMAIN", "www.amazon.co.uk")
AMAZON_COOKIES_FILE = os.getenv("AMAZON_COOKIES_FILE", "/data/amazon_cookies.json")

# Sync settings
POLL_INTERVAL_MINUTES = int(os.getenv("POLL_INTERVAL_MINUTES", "5"))
SYNC_DIRECTION = os.getenv("SYNC_DIRECTION", "bidirectional")  # bidirectional, import_only, export_only

# Logging
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
