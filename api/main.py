#!/usr/bin/env python3
"""
MFA Relay API - Multi-tenant backend service
Handles email monitoring and SMS forwarding for multiple users via Supabase
"""

import asyncio
import logging
import os
from typing import List, Dict, Any
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import uvicorn

# Supabase configuration
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://grglttyirzxfdpbyuxut.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_ANON_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdyZ2x0dHlpcnp4ZmRwYnl1eHV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4MzUzNDgsImV4cCI6MjA2NzQxMTM0OH0.-ZU38fETcom_K3-tTBHjGVLcmG98_Fmt0XsBBRS38dM")

# Setup basic logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Security
security = HTTPBearer()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifecycle manager"""
    logger.info("Starting MFA Relay API")
    yield
    logger.info("MFA Relay API stopped")

# Initialize FastAPI app
app = FastAPI(
    title="MFA Relay API",
    description="Multi-tenant MFA code forwarding service",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://*.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Routes
@app.get("/")
async def root():
    """Root endpoint"""
    return {"message": "MFA Relay API", "status": "running"}

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "supabase_url": SUPABASE_URL,
        "environment": os.getenv("ENVIRONMENT", "development")
    }

@app.get("/api/status")
async def api_status():
    """API status endpoint"""
    return {
        "api": "MFA Relay",
        "version": "1.0.0",
        "environment": os.getenv("ENVIRONMENT", "development"),
        "database": "connected" if SUPABASE_URL else "not configured"
    }

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=True,
        log_level="info"
    )