# Family Hub - Project Initialization Guide

## Overview

This guide walks you through setting up the Family Hub project from scratch on your development machine. By the end, you'll have:

- Complete project structure created
- Docker environment running locally
- Database initialized with schema
- Backend API serving endpoints
- Frontend React app connected to backend
- Ready to start building features

**Time Required:** 1-2 hours (first time setup)

**Prerequisites:**

- Computer with Windows, macOS, or Linux
- Internet connection
- Basic command line familiarity (we'll guide you)

-----

## Step 1: Install Required Software

### 1.1 Install Git

**Purpose:** Version control for your code

**Windows:**

- Download from https://git-scm.com/download/win
- Run installer, use default options
- Verify: Open Command Prompt, type `git --version`

**macOS:**

- Open Terminal, type `git --version`
- If not installed, macOS will prompt you to install Xcode Command Line Tools
- Or install via Homebrew: `brew install git`

**Linux:**

```bash
sudo apt update
sudo apt install git
```

### 1.2 Install Docker Desktop

**Purpose:** Run your app in containers (consistent environments)

**Download:**

- Windows/Mac: https://www.docker.com/products/docker-desktop
- Linux: https://docs.docker.com/engine/install/

**After Installation:**

- Start Docker Desktop
- Verify: Open terminal, type `docker --version` and `docker-compose --version`

### 1.3 Install VS Code (Recommended)

**Purpose:** Code editor with excellent Python/JavaScript support

**Download:** https://code.visualstudio.com/

**Recommended Extensions:**

- Python
- Pylance
- ESLint
- Prettier
- Docker
- GitLens

### 1.4 Install Node.js

**Purpose:** Required for frontend development (React)

**Download:** https://nodejs.org/ (LTS version - currently 20.x)

**Verify:**

```bash
node --version
npm --version
```

### 1.5 Install Python

**Purpose:** Backend language

**Download:** https://www.python.org/downloads/ (Python 3.11 or 3.12)

**Important (Windows):** Check "Add Python to PATH" during installation

**Verify:**

```bash
python --version
pip --version
```

-----

## Step 2: Create Project Structure

### 2.1 Create Project Directory

```bash
# Create main project folder
mkdir family-hub
cd family-hub

# Initialize Git repository
git init
```

### 2.2 Create Folder Structure

```bash
# Create all directories at once
mkdir -p backend/{services/{calendar,tasks,meals,shopping,users,photos},shared,tests}
mkdir -p frontend/{src/{components/{common,layout,forms},features/{calendar,tasks,meals,shopping},services,hooks,stores,utils,types},public}
mkdir -p docs
mkdir -p scripts

# The structure will look like this:
# family-hub/
# ├── backend/
# │   ├── services/
# │   │   ├── calendar/
# │   │   ├── tasks/
# │   │   ├── meals/
# │   │   ├── shopping/
# │   │   ├── users/
# │   │   └── photos/
# │   ├── shared/
# │   └── tests/
# ├── frontend/
# │   ├── src/
# │   │   ├── components/
# │   │   ├── features/
# │   │   ├── services/
# │   │   ├── hooks/
# │   │   ├── stores/
# │   │   ├── utils/
# │   │   └── types/
# │   └── public/
# ├── docs/
# └── scripts/
```

-----

## Step 3: Backend Setup

### 3.1 Create Backend Files

Navigate to backend directory:

```bash
cd backend
```

**Create `requirements.txt`:**

```txt
# Core Framework
fastapi==0.104.1
uvicorn[standard]==0.24.0
python-multipart==0.0.6

# Database
sqlalchemy==2.0.23
alembic==1.12.1
asyncpg==0.29.0
psycopg2-binary==2.9.9

# Authentication
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
pydantic[email]==2.5.0

# Utilities
python-dotenv==1.0.0
httpx==0.25.2

# Calendar Integration
caldav==1.3.9

# Testing
pytest==7.4.3
pytest-asyncio==0.21.1
```

**Create `.env` file:**

```bash
# Database
DATABASE_URL=postgresql://familyhub:familyhub_password@db:5432/familyhub

# JWT Secret (generate a random string)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Supabase (optional - for authentication)
SUPABASE_URL=
SUPABASE_KEY=

# API Configuration
API_V1_PREFIX=/api/v1
BACKEND_CORS_ORIGINS=["http://localhost:3000"]

# Environment
ENVIRONMENT=development
```

**Create `main.py`:**

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os
from dotenv import load_dotenv

load_dotenv()

# Import routers (we'll create these)
# from services.calendar.routes import router as calendar_router
# from services.tasks.routes import router as tasks_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events"""
    print("🚀 Application starting up...")
    yield
    print("🛑 Application shutting down...")

app = FastAPI(
    title="Family Hub API",
    description="API for family organization system",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "message": "Family Hub API",
        "status": "running",
        "version": "1.0.0"
    }

@app.get("/api/v1/health")
async def health_check():
    """API health check"""
    return {
        "status": "healthy",
        "environment": os.getenv("ENVIRONMENT", "development")
    }

# Mount routers
# app.include_router(calendar_router, prefix="/api/v1/calendar", tags=["calendar"])
# app.include_router(tasks_router, prefix="/api/v1/tasks", tags=["tasks"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
```

**Create `shared/database.py`:**

```python
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

# Create async engine
engine = create_async_engine(
    DATABASE_URL,
    echo=True,  # Log SQL queries (disable in production)
    future=True
)

# Create session factory
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False
)

# Base class for models
Base = declarative_base()

async def get_db():
    """Dependency for getting database session"""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()

async def init_db():
    """Initialize database (create tables)"""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
```

**Create `shared/models.py`:**

```python
from sqlalchemy import Column, String, DateTime, Boolean, Integer, Text, ForeignKey, Date, Time, ARRAY
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
from shared.database import Base
import uuid

class Tenant(Base):
    """Family/household tenant"""
    __tablename__ = "tenants"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    slug = Column(String(100), unique=True, nullable=False)
    subscription_tier = Column(String(50), default='free')
    settings = Column(JSONB, default={})
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class User(Base):
    """Family member"""
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey('tenants.id', ondelete='CASCADE'), nullable=False)
    email = Column(String(255), unique=True)
    name = Column(String(255), nullable=False)
    hashed_password = Column(String(255))
    avatar_url = Column(Text)
    role = Column(String(50), nullable=False)  # admin, parent, child
    date_of_birth = Column(Date)
    settings = Column(JSONB, default={})
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class CalendarEvent(Base):
    """Calendar event"""
    __tablename__ = "calendar_events"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey('tenants.id', ondelete='CASCADE'), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete='SET NULL'))
    title = Column(Text, nullable=False)
    description = Column(Text)
    location = Column(Text)
    start_time = Column(DateTime(timezone=True), nullable=False)
    end_time = Column(DateTime(timezone=True))
    all_day = Column(Boolean, default=False)
    recurrence_rule = Column(Text)
    external_calendar_id = Column(Text)
    external_event_id = Column(Text)
    color = Column(String(7))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class Task(Base):
    """Task/chore"""
    __tablename__ = "tasks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey('tenants.id', ondelete='CASCADE'), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete='SET NULL'))
    title = Column(Text, nullable=False)
    description = Column(Text)
    due_date = Column(Date)
    due_time = Column(Time)
    recurrence_rule = Column(Text)
    status = Column(String(50), nullable=False)  # pending, in_progress, complete, cancelled
    priority = Column(String(50), default='normal')  # low, normal, high, urgent
    points = Column(Integer, default=0)
    category = Column(String(100))
    completed_at = Column(DateTime(timezone=True))
    completed_by = Column(UUID(as_uuid=True), ForeignKey('users.id'))
    created_by = Column(UUID(as_uuid=True), ForeignKey('users.id'))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

# Add other models (Recipe, MealPlan, ShoppingList, etc.) following same pattern
```

**Create `Dockerfile`:**

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose port
EXPOSE 8000

# Run application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
```

-----

## Step 4: Frontend Setup

### 4.1 Create React App with Vite

Navigate back to project root and create frontend:

```bash
cd ..
cd frontend

# Create Vite React TypeScript project
npm create vite@latest . -- --template react-ts

# Install dependencies
npm install

# Install Ant Design and other dependencies
npm install antd @ant-design/icons
npm install axios
npm install @tanstack/react-query
npm install react-router-dom
npm install zustand
npm install dayjs
```

**Update `vite.config.ts`:**

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      }
    }
  }
})
```

**Create `src/services/api.ts`:**

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized (redirect to login)
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

**Update `src/App.tsx`:**

```typescript
import { useEffect, useState } from 'react';
import { ConfigProvider, Layout, Typography } from 'antd';
import './App.css';
import api from './services/api';

const { Header, Content } = Layout;
const { Title } = Typography;

function App() {
  const [healthStatus, setHealthStatus] = useState<string>('checking...');

  useEffect(() => {
    // Test API connection
    api.get('/api/v1/health')
      .then(response => {
        setHealthStatus(`✅ API Connected: ${response.data.status}`);
      })
      .catch(error => {
        setHealthStatus(`❌ API Error: ${error.message}`);
      });
  }, []);

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#1890ff',
        },
      }}
    >
      <Layout style={{ minHeight: '100vh' }}>
        <Header style={{ background: '#001529', padding: '0 50px' }}>
          <Title level={3} style={{ color: 'white', margin: '16px 0' }}>
            Family Hub
          </Title>
        </Header>
        <Content style={{ padding: '50px' }}>
          <div style={{ background: '#fff', padding: 24, minHeight: 360 }}>
            <Title level={2}>Welcome to Family Hub!</Title>
            <p>API Status: {healthStatus}</p>
            <p>Your family organization system is ready to build.</p>
          </div>
        </Content>
      </Layout>
    </ConfigProvider>
  );
}

export default App;
```

**Create `.env` file in frontend:**

```bash
VITE_API_URL=http://localhost:8000
```

-----

## Step 5: Docker Setup

### 5.1 Create Docker Compose File

In project root, create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  # PostgreSQL Database
  db:
    image: postgres:15-alpine
    container_name: familyhub-db
    environment:
      POSTGRES_USER: familyhub
      POSTGRES_PASSWORD: familyhub_password
      POSTGRES_DB: familyhub
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./scripts/init.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U familyhub"]
      interval: 5s
      timeout: 5s
      retries: 5

  # Backend API
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: familyhub-backend
    environment:
      DATABASE_URL: postgresql+asyncpg://familyhub:familyhub_password@db:5432/familyhub
      JWT_SECRET: ${JWT_SECRET:-dev-secret-key-change-in-production}
      ENVIRONMENT: development
    volumes:
      - ./backend:/app
      - ./uploads:/app/uploads
    ports:
      - "8000:8000"
    depends_on:
      db:
        condition: service_healthy
    command: uvicorn main:app --host 0.0.0.0 --port 8000 --reload

  # Frontend React App
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.dev
    container_name: familyhub-frontend
    environment:
      VITE_API_URL: http://localhost:8000
    volumes:
      - ./frontend:/app
      - /app/node_modules
    ports:
      - "3000:3000"
    depends_on:
      - backend
    command: npm run dev -- --host

volumes:
  postgres_data:
```

**Create `frontend/Dockerfile.dev`:**

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev", "--", "--host"]
```

**Create `scripts/init.sql`:**

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable Row Level Security helper
CREATE OR REPLACE FUNCTION set_current_tenant_id(tenant_id UUID)
RETURNS void AS $
BEGIN
  PERFORM set_config('app.current_tenant_id', tenant_id::text, false);
END;
$ LANGUAGE plpgsql;
```

-----

## Step 6: Initialize and Run

### 6.1 Create .gitignore

In project root:

```bash
# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
env/
venv/
.venv
*.egg-info/

# Node
node_modules/
dist/
.env.local
.env.production

# IDE
.vscode/
.idea/
*.swp
*.swo

# Environment
.env
*.log

# Docker
postgres_data/
uploads/

# OS
.DS_Store
Thumbs.db
```

### 6.2 Start the Application

```bash
# From project root directory

# Start all services
docker-compose up -d

# Watch logs
docker-compose logs -f

# You should see:
# - PostgreSQL database starting
# - Backend API starting on port 8000
# - Frontend dev server starting on port 3000
```

### 6.3 Verify Everything Works

**Check Database:**

```bash
# Connect to PostgreSQL
docker-compose exec db psql -U familyhub -d familyhub

# Inside psql:
\dt  # List tables (should be empty for now)
\q   # Quit
```

**Check Backend:**

- Open browser: http://localhost:8000
- Should see: `{"message": "Family Hub API", "status": "running", "version": "1.0.0"}`
- API docs: http://localhost:8000/docs

**Check Frontend:**

- Open browser: http://localhost:3000
- Should see Family Hub welcome page
- Should show "API Connected: healthy"

-----

## Step 7: Database Migrations

### 7.1 Set Up Alembic

```bash
# Enter backend container
docker-compose exec backend bash

# Initialize Alembic
alembic init alembic

# Exit container
exit
```

**Edit `backend/alembic.ini`:**

```ini
# Change this line:
sqlalchemy.url = driver://user:pass@localhost/dbname

# To this (or remove it, we'll set in env.py):
# sqlalchemy.url =
```

**Edit `backend/alembic/env.py`:**

```python
from logging.config import fileConfig
from sqlalchemy import engine_from_config, pool
from alembic import context
import os
import sys
from dotenv import load_dotenv

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

# Load environment variables
load_dotenv()

# Import your models
from shared.database import Base
from shared.models import Tenant, User, CalendarEvent, Task  # Import all models

# this is the Alembic Config object
config = context.config

# Set database URL from environment
config.set_main_option('sqlalchemy.url', os.getenv('DATABASE_URL'))

# Interpret the config file for Python logging
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Set target metadata
target_metadata = Base.metadata

# ... rest of the file stays the same
```

### 7.2 Create Initial Migration

```bash
# Enter backend container
docker-compose exec backend bash

# Create migration
alembic revision --autogenerate -m "Initial schema"

# Apply migration
alembic upgrade head

# Verify tables created
docker-compose exec db psql -U familyhub -d familyhub -c "\dt"

# Exit
exit
```

-----

## Step 8: Create Your First Feature

### 8.1 Create a Simple Task Endpoint

**Create `backend/services/tasks/routes.py`:**

```python
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from shared.database import get_db
from typing import List

router = APIRouter()

@router.get("/")
async def get_tasks(db: AsyncSession = Depends(get_db)):
    """Get all tasks"""
    return {
        "message": "Tasks endpoint",
        "tasks": []
    }

@router.post("/")
async def create_task(db: AsyncSession = Depends(get_db)):
    """Create a new task"""
    return {
        "message": "Task created",
        "task": {}
    }
```

**Update `backend/main.py`:**

```python
# Add at top:
from services.tasks.routes import router as tasks_router

# Add after app creation:
app.include_router(tasks_router, prefix="/api/v1/tasks", tags=["tasks"])
```

**Create `frontend/src/features/tasks/TaskList.tsx`:**

```typescript
import { useEffect, useState } from 'react';
import { List, Card } from 'antd';
import api from '../../services/api';

export default function TaskList() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/v1/tasks')
      .then(response => {
        setTasks(response.data.tasks);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching tasks:', error);
        setLoading(false);
      });
  }, []);

  return (
    <Card title="Tasks">
      <List
        loading={loading}
        dataSource={tasks}
        renderItem={(task: any) => (
          <List.Item>{task.title}</List.Item>
        )}
        locale={{ emptyText: 'No tasks yet. Create your first task!' }}
      />
    </Card>
  );
}
```

### 8.2 Test Your Feature

```bash
# Restart backend to load new routes
docker-compose restart backend

# Test API endpoint
curl http://localhost:8000/api/v1/tasks

# Should return: {"message": "Tasks endpoint", "tasks": []}
```

-----

## Step 9: Development Workflow

### 9.1 Daily Development Commands

```bash
# Start everything
docker-compose up -d

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Restart a service
docker-compose restart backend

# Stop everything
docker-compose down

# Stop and remove volumes (fresh start)
docker-compose down -v
```

### 9.2 Database Commands

```bash
# Connect to database
docker-compose exec db psql -U familyhub -d familyhub

# Backup database
docker-compose exec db pg_dump -U familyhub familyhub > backup.sql

# Restore database
docker-compose exec -T db psql -U familyhub familyhub < backup.sql

# Run migration
docker-compose exec backend alembic upgrade head

# Create new migration
docker-compose exec backend alembic revision --autogenerate -m "Description"
```

### 9.3 Code Quality Commands

```bash
# Backend tests
docker-compose exec backend pytest

# Frontend tests
docker-compose exec frontend npm test

# Type checking
docker-compose exec frontend npm run type-check

# Linting
docker-compose exec backend flake8
docker-compose exec frontend npm run lint
```

-----

## Step 10: Next Steps

### 10.1 What You Have Now

✅ Full development environment running
✅ Backend API with FastAPI
✅ Frontend with React + Ant Design
✅ PostgreSQL database with migrations
✅ Docker containerization
✅ API connected to frontend

### 10.2 What to Build Next

**Immediate (Phase 1):**

1. Authentication system (user registration/login)
1. User profile management
1. Calendar events CRUD operations
1. Task management system
1. Meal planning features
1. Shopping list functionality

**Follow the Requirements Document for feature priorities!**

### 10.3 Learning Resources

**FastAPI:**

- Official Tutorial: https://fastapi.tiangolo.com/tutorial/
- SQL Databases: https://fastapi.tiangolo.com/tutorial/sql-databases/

**React + TypeScript:**

- React Docs: https://react.dev/learn
- TypeScript Handbook: https://www.typescriptlang.org/docs/handbook/

**Ant Design:**

- Components: https://ant.design/components/overview/
- Examples: https://ant.design/components/overview/#components-overview

**PostgreSQL:**

- Tutorial: https://www.postgresqltutorial.com/
- SQLAlchemy: https://docs.sqlalchemy.org/en/20/

-----

## Troubleshooting

### Common Issues

**Problem: Docker containers won't start**

```bash
# Check Docker is running
docker ps

# Check logs for errors
docker-compose logs

# Try rebuilding
docker-compose down
docker-compose up --build
```

**Problem: Database connection errors**

```bash
# Ensure database is healthy
docker-compose ps

# Check database logs
docker-compose logs db

# Restart database
docker-compose restart db
```

**Problem: Port already in use**

```bash
# Find process using port 8000
lsof -i :8000  # macOS/Linux
netstat -ano | findstr :8000  # Windows

# Kill process or change port in docker-compose.yml
```

**Problem: Frontend can't connect to backend**

- Check VITE_API_URL in frontend/.env
- Check CORS settings in backend/main.py
- Verify backend is running: http://localhost:8000

**Problem: Migration errors**

```bash
# Check current migration state
docker-compose exec backend alembic current

# Reset migrations (WARNING: deletes data)
docker-compose exec backend alembic downgrade base
docker-compose exec backend alembic upgrade head
```

-----

## Appendix: File Checklist

Use this checklist to ensure you've created all necessary files:

```
✅ Project Root
  ✅ docker-compose.yml
  ✅ .gitignore
  ✅ README.md (optional)

✅ Backend
  ✅ requirements.txt
  ✅ Dockerfile
  ✅ .env
  ✅ main.py
  ✅ shared/database.py
  ✅ shared/models.py
  ✅ services/tasks/routes.py
  ✅ alembic.ini
  ✅ alembic/env.py

✅ Frontend
  ✅ package.json
  ✅ Dockerfile.dev
  ✅ .env
  ✅ vite.config.ts
  ✅ src/App.tsx
  ✅ src/services/api.ts
  ✅ src/features/tasks/TaskList.tsx

✅ Scripts
  ✅ init.sql

✅ Docs
  ✅ requirements.md (Requirements Document)
  ✅ technical-design.md (Technical Design)
  ✅ initialization.md (This guide)
```

-----

## Quick Reference Commands

```bash
# Start development environment
docker-compose up -d

# View all logs
docker-compose logs -f

# Restart backend
docker-compose restart backend

# Run backend shell
docker-compose exec backend bash

# Run frontend shell
docker-compose exec frontend sh

# Database console
docker-compose exec db psql -U familyhub -d familyhub

# Stop everything
docker-compose down

# Fresh start (deletes data!)
docker-compose down -v && docker-compose up -d

# Create migration
docker-compose exec backend alembic revision --autogenerate -m "Description"

# Apply migrations
docker-compose exec backend alembic upgrade head

# Run tests
docker-compose exec backend pytest
docker-compose exec frontend npm test
```

-----

**Document Version:** 1.0
**Last Updated:** October 6, 2025
**Tested On:** macOS, Windows 11, Ubuntu 22.04
**Support:** Reference Technical Design Document for architecture details

**You're ready to start building!**
