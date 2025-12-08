# Bindu Dashboard

## Overview
This dashboard allows you to:
1. Configure and spawn Crawling Agents.
2. Chat with an Orchestrator that delegates tasks to these agents.

## Setup

### Backend
1. Navigate to `dashboard/backend`.
2. Install dependencies: `pip install -r requirements.txt`.
3. Run the server:
   ```bash
   uvicorn main:app --reload
   ```
   The backend runs on http://localhost:8000.

### Frontend
1. Navigate to `dashboard/frontend`.
2. Install dependencies: `npm install`.
3. Run the dev server: `npm run dev`.
   The frontend runs on http://localhost:3000.

## Usage
1. Open the frontend.
2. Go to "Agent Setup" to create a new crawler.
3. Once created, start the agent.
4. Go to "Chat" to query the system.
