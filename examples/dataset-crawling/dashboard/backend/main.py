from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict, Any

from models import (
    CrawlerConfig, AgentInfo, AgentStatus, 
    Context, Task, Message, Artifact
)
from agent_manager import AgentManager
from skills import SkillsRegistry

app = FastAPI(title="Bindu Dashboard API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

agent_manager = AgentManager()
skills_registry = SkillsRegistry()


@app.on_event("startup")
async def _startup():
    # background task workers for queue-based task execution
    await agent_manager.start_background_workers(concurrency=1)

# --- Agent Management ---

@app.get("/agents", response_model=List[AgentInfo])
async def list_agents():
    return agent_manager.list_agents()

@app.post("/agents", response_model=AgentInfo)
async def create_agent(config: CrawlerConfig):
    try:
        return agent_manager.create_agent(config)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/agents/{agent_id}/start", response_model=AgentInfo)
async def start_agent(agent_id: str):
    try:
        return agent_manager.start_agent(agent_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/agents/{agent_id}/stop", response_model=AgentInfo)
async def stop_agent(agent_id: str):
    try:
        return agent_manager.stop_agent(agent_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- Skills Management ---

@app.get("/skills")
async def list_skills():
    return skills_registry.list_skills()

# --- A2A Protocol: Context & Task Management ---

@app.post("/contexts", response_model=Context)
async def create_context(name: str = "New Context", description: str = None):
    """Create a new conversation context."""
    return agent_manager.create_context(name, description)

@app.get("/contexts/{context_id}", response_model=Context)
async def get_context(context_id: str):
    context = agent_manager.get_context(context_id)
    if not context:
        raise HTTPException(status_code=404, detail="Context not found")
    return context

@app.post("/contexts/{context_id}/tasks", response_model=Task)
async def create_task(context_id: str, agent_id: str, content: str):
    """Create a new task within a context and assign it to an agent."""
    try:
        return await agent_manager.create_task(context_id, agent_id, content)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/tasks/{task_id}", response_model=Task)
async def get_task(task_id: str):
    task = agent_manager.get_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


@app.post("/tasks/{task_id}/pay", response_model=Task)
async def pay_task(task_id: str):
    """Minimal payment hook: marks payment as complete and enqueues the task."""
    try:
        return await agent_manager.pay_for_task(task_id, receipt={"status": "paid"})
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
