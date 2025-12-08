from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict


from .models import CrawlerConfig, AgentInfo, AgentStatus, ChatRequest
from .agent_manager import AgentManager

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

@app.post("/chat")
async def chat(request: ChatRequest):
    """
    Route the query to the appropriate agent.
    For now, this is a simple round-robin or keyword matching.
    In a real scenario, this would use an Orchestrator Agent.
    """
    import httpx
    import uuid
    
    # Check for running agents
    running_agents = [a for a in agent_manager.list_agents() if a.status == AgentStatus.RUNNING]
    
    if not running_agents:
         raise HTTPException(status_code=503, detail="No agents are currently running. Please start an agent first.")
    
    # Simple delegation strategy: Pick the first available agent
    # In the future, use 'request.context_id' or query analysis to route
    target_agent = running_agents[0]
    agent_url = f"http://localhost:{target_agent.config.port}"
    
    # Construct JSON-RPC 2.0 Request
    # Method: message/send
    json_rpc_payload = {
        "jsonrpc": "2.0",
        "method": "message/send",
        "params": {
            "message": {
                "role": "user",
                "content": request.query
            }
        },
        "id": str(uuid.uuid4())
    }
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(agent_url, json=json_rpc_payload)
            response.raise_for_status()
            
            rpc_response = response.json()
            
            if "error" in rpc_response:
                return {
                    "response": f"Agent Error: {rpc_response['error']['message']}",
                    "agent": target_agent.config.name
                }
            
            # Agents return structured task updates. 
            # We need to extract the actual content or status.
            # Usually result is the full Task object or a state transition.
            result = rpc_response.get("result", {})
            
            # Simple heuristic to extract text from the result
            # Bindu agents might return different structures depending on the state
            # For now, let's dump the result or look for specific fields if known.
            # Assuming 'message' or 'response' field in result, or we just return the stringified result.
            
            # If the result is a dictionary, try to find content
            if isinstance(result, dict):
                 # Check for common patterns in Agno/Bindu responses
                content = result.get("response") or result.get("content") or result.get("output") or str(result)
            else:
                content = str(result)

            return {
                "response": content,
                "agent": target_agent.config.name
            }
            
    except httpx.RequestError as e:
        raise HTTPException(status_code=502, detail=f"Failed to communicate with agent {target_agent.config.name}: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal Orchestrator Error: {str(e)}")
