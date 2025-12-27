# Dataset Crawling Application Design

## Overview
This application is a multi-agent orchestration system designed to create datasets by crawling the web. It leverages **Bindu** and **Sapthame** frameworks for agent orchestration and A2A (Agent-to-Agent) communication. The system takes a user query, researches it using **Perplexity**, and then intelligently delegates crawling tasks to specialized agents powered by **Firecrawl** or **Browser-use**.

## Architecture

### 1. Agents
The system consists of the following agents, orchestrated using the **Sapthame** "Three-Body Pattern" (Research, Plan, Implement) where applicable, or a simpler hub-and-spoke model.

*   **Orchestrator Agent (The "Brain")**
    *   **Role:** Entry point for user queries.
    *   **Capabilities:**
        *   Receives natural language queries (e.g., "Get me pricing data for all AI startups founded in 2024").
        *   Uses **Perplexity** (via MCP/API) to research the query, identify relevant URLs, and understand the data structure.
        *   Decides on the crawling strategy.
    *   **Output:** A plan containing target URLs and the preferred crawling method for each.

*   **Firecrawl Agent (The "Spider")**
    *   **Role:** High-speed crawling and scraping of websites.
    *   **Tools:** Firecrawl API (Crawl, Scrape, Map).
    *   **Best for:** Static sites, documentation, blogs, structured data extraction where direct HTTP/sitemap access is sufficient.
    *   **Bindu Integration:** Exposes capabilities as a Bindu skill.

*   **Browser-use Agent (The "Navigator")**
    *   **Role:** Headless browser automation for complex interactions.
    *   **Tools:** `browser-use` library (Playwright based).
    *   **Best for:** SPAs, sites requiring login/auth, complex UI interactions, dynamic content.
    *   **Bindu Integration:** Exposes capabilities as a Bindu skill.

### 2. Workflow
1.  **User Input:** User submits a request via the Dashboard or API.
2.  **Research Phase:** Orchestrator queries Perplexity to gather context and candidate URLs.
3.  **Planning Phase:** Orchestrator analyzes the targets:
    *   If targets are simple/numerous -> Route to Firecrawl Agent.
    *   If targets need interaction/deep nav -> Route to Browser-use Agent.
4.  **Execution Phase:** Selected agents execute the tasks and return data.
5.  **Aggregation:** Data is collected and formatted (JSON/Markdown) for the user.

### 3. Tech Stack
*   **Framework:** Bindu / Sapthame (Python)
*   **Orchestration:** Bindu Agent API (A2A Protocol)
*   **Research:** Perplexity API
*   **Crawling:** Firecrawl, Browser-use
*   **Backend:** FastAPI (Dashboard API)
*   **Frontend:** Next.js (Dashboard UI)

## Implementation Plan

### Step 1: Fix & Setup
*   [x] Fix ImportError in backend.
*   [ ] Verify backend runs correctly.

### Step 2: Agent Implementation
*   **Orchestrator:** Implement `OrchestratorAgent` that uses Perplexity.
*   **Firecrawl Agent:** Create a Bindu-compliant agent wrapping Firecrawl SDK.
*   **Browser-use Agent:** Create a Bindu-compliant agent wrapping `browser-use`.

### Step 3: Integration
*   Update `agent_manager.py` to support these new agent types.
*   Update `models.py` to include configuration for these tools (API keys, etc.).

### Step 4: Frontend Update
*   Update the dashboard to allow selecting the "Auto-Pilot" mode (Orchestrator) vs Manual Agent creation.
