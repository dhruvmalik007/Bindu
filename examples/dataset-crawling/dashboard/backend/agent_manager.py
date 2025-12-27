import os
import subprocess
import uuid
import signal
import httpx
import asyncio
from pathlib import Path
from typing import List, Dict, Optional
from jinja2 import Environment, FileSystemLoader
from datetime import datetime

from models import (
    CrawlerConfig, AgentInfo, AgentStatus, AgentType, HostingType,
    Context, Task, TaskState, Message, TaskStatus, Artifact
)

# Get the absolute path of the directory containing this file (dashboard/backend)
BASE_DIR = Path(__file__).resolve().parent
# Set generated agents directory to dashboard/generated_agents
GENERATED_AGENTS_DIR = BASE_DIR.parent / "generated_agents"
GENERATED_AGENTS_DIR.mkdir(parents=True, exist_ok=True)

class AgentManager:
    def __init__(self):
        self.agents: Dict[str, AgentInfo] = {}
        self.contexts: Dict[str, Context] = {}
        self.tasks: Dict[str, Task] = {}
        self._task_queue: asyncio.Queue[str] = asyncio.Queue()
        self._worker_tasks: List[asyncio.Task] = []
        self.template_env = Environment(
            loader=FileSystemLoader(str(BASE_DIR / "templates"))
        )

    async def start_background_workers(self, concurrency: int = 1) -> None:
        if self._worker_tasks:
            return
        for idx in range(max(1, concurrency)):
            self._worker_tasks.append(asyncio.create_task(self._task_worker(idx)))

    async def _task_worker(self, worker_id: int) -> None:
        while True:
            task_id = await self._task_queue.get()
            try:
                task = self.tasks.get(task_id)
                if not task:
                    continue

                agent_id = task.metadata.get("agent_id")
                if not agent_id or agent_id not in self.agents:
                    task.status.state = TaskState.FAILED
                    task.status.message = Message(
                        role="system",
                        parts=[{"kind": "text", "text": "Error: Agent not found for task"}],
                        context_id=task.context_id,
                        task_id=task.id,
                    )
                    continue

                agent = self.agents[agent_id]
                await self._send_task_to_agent(agent, task)
            finally:
                self._task_queue.task_done()

    # --- Agent Lifecycle Management ---

    def list_agents(self) -> List[AgentInfo]:
        return list(self.agents.values())

    def create_agent(self, config: CrawlerConfig) -> AgentInfo:
        agent_id = str(uuid.uuid4())
        
        # Only generate code for MANAGED agents
        if config.hosting == HostingType.MANAGED:
            # Select Template based on Agent Type
            if config.type == AgentType.FIRECRAWL:
                template_name = "firecrawl_agent.py.jinja"
            elif config.type == AgentType.BROWSER_USE:
                template_name = "browser_use_agent.py.jinja"
            elif config.type == AgentType.ORCHESTRATOR:
                template_name = "orchestrator_agent.py.jinja"
            else:
                template_name = "crawler_agent.py.jinja"

            # Generate Agent Code
            template = self.template_env.get_template(template_name)
            agent_code = template.render(
                name=config.name,
                description=config.description,
                target_url=config.target_url or "",
                instructions=config.instructions,
                port=config.port,
                author="dashboard-user@getbindu.com",
                auth=config.auth.model_dump(mode='json'),
                payment=config.payment.model_dump(mode='json'),
                storage=config.storage.model_dump(mode='json'),
                observability=config.observability.model_dump(mode='json'),
                skills=config.skills,
                # Pass keys if present
                firecrawl_api_key=config.firecrawl_api_key or "",
                perplexity_api_key=config.perplexity_api_key or "",
                openai_api_key=config.openai_api_key or ""
            )
            
            agent_file_path = GENERATED_AGENTS_DIR / f"agent_{agent_id}.py"
            with open(agent_file_path, "w") as f:
                f.write(agent_code)
            
        agent_info = AgentInfo(
            id=agent_id,
            config=config,
            status=AgentStatus.STOPPED
        )
        self.agents[agent_id] = agent_info
        return agent_info

    def start_agent(self, agent_id: str) -> AgentInfo:
        if agent_id not in self.agents:
            raise ValueError("Agent not found")
        
        agent = self.agents[agent_id]
        if agent.status == AgentStatus.RUNNING:
            return agent

        # Handle Self-Hosted Agents
        if agent.config.hosting == HostingType.SELF_HOSTED:
            # TODO: Add health check or validation logic here if needed
            agent.status = AgentStatus.RUNNING
            return agent

        # Check Execution Environment
        env = os.getenv("PROJECT__ENVIRONMENT", "development")
        
        if env == "production":
            return self._start_k8s_agent(agent)
        else:
            return self._start_local_agent(agent)

    def stop_agent(self, agent_id: str) -> AgentInfo:
        if agent_id not in self.agents:
            raise ValueError("Agent not found")

        agent = self.agents[agent_id]
        
        # Handle Self-Hosted Agents
        if agent.config.hosting == HostingType.SELF_HOSTED:
            agent.status = AgentStatus.STOPPED
            return agent
        
        # Check Execution Environment
        env = os.getenv("PROJECT__ENVIRONMENT", "development")
        
        if env == "production":
            return self._stop_k8s_agent(agent)
        else:
            return self._stop_local_agent(agent)

    def _start_local_agent(self, agent: AgentInfo) -> AgentInfo:
        agent_file_path = GENERATED_AGENTS_DIR / f"agent_{agent.id}.py"
        import sys
        
        # Log sys.executable for debugging
        print(f"DEBUG: Starting agent with executable: {sys.executable}")
        
        # Copy current environment to ensure VIRTUAL_ENV and PATH are preserved
        env = os.environ.copy()
        
        # Ensure PYTHONPATH includes the site-packages of the current environment
        # This helps if sys.executable is somehow isolated or if we need to be explicit
        if "PYTHONPATH" not in env:
             env["PYTHONPATH"] = ""
        
        # Add current working directory to PYTHONPATH to allow importing local modules if needed
        env["PYTHONPATH"] += f":{os.getcwd()}"

        log_file = GENERATED_AGENTS_DIR / f"agent_{agent.id}.log"
        log_f = open(log_file, "w")

        process = subprocess.Popen(
            [sys.executable, str(agent_file_path)],
            cwd=os.getcwd(),
            stdout=log_f,
            stderr=subprocess.STDOUT,
            env=env # Pass the environment
        )
        
        agent.pid = process.pid
        agent.status = AgentStatus.RUNNING
        return agent

    def _stop_local_agent(self, agent: AgentInfo) -> AgentInfo:
        if agent.status != AgentStatus.RUNNING or not agent.pid:
            agent.status = AgentStatus.STOPPED
            return agent

        try:
            os.kill(agent.pid, signal.SIGTERM)
        except ProcessLookupError:
            pass # Already dead
            
        agent.pid = None
        agent.status = AgentStatus.STOPPED
        return agent

    def _start_k8s_agent(self, agent: AgentInfo) -> AgentInfo:
        """
        Start the agent as a Kubernetes Deployment.
        Requires 'kubernetes' python package and in-cluster config or kubeconfig.
        """
        try:
            from kubernetes import client, config
            try:
                try:
                    config.load_incluster_config()
                except:
                    config.load_kube_config()
                    
                apps_v1 = client.AppsV1Api()
                core_v1 = client.CoreV1Api()
                
                # Simple Deployment Generation (Placeholder)
                print(f"K8S: Creating Deployment for agent_{agent.id}")
                agent.status = AgentStatus.RUNNING
                agent.pid = 0 
                
            except Exception as e:
                print(f"K8S: Failed to load configuration or create resources: {e}")
                # Fallback or just mark failed? For now, mark failed to indicate K8s issue
                agent.status = AgentStatus.FAILED
                
            return agent
            
        except ImportError:
            print("K8S: kubernetes package not installed")
            agent.status = AgentStatus.FAILED
            return agent
            
    def _stop_k8s_agent(self, agent: AgentInfo) -> AgentInfo:
        try:
            from kubernetes import client, config
            try:
                config.load_incluster_config()
            except:
                config.load_kube_config()
            
            print(f"K8S: Deleting Deployment for agent_{agent.id}")
            
            agent.status = AgentStatus.STOPPED
            agent.pid = None
            return agent
        except ImportError:
             pass
        
        agent.status = AgentStatus.STOPPED
        return agent

    # --- A2A Protocol / Task Management ---

    def create_context(self, name: Optional[str] = None, description: Optional[str] = None) -> Context:
        context = Context(
            name=name or "New Context",
            description=description,
            role="user"
        )
        self.contexts[context.context_id] = context
        return context

    def get_context(self, context_id: str) -> Optional[Context]:
        return self.contexts.get(context_id)

    async def create_task(self, context_id: str, agent_id: str, content: str) -> Task:
        if context_id not in self.contexts:
            raise ValueError("Context not found")
        if agent_id not in self.agents:
            raise ValueError("Agent not found")

        agent = self.agents[agent_id]
        if agent.status != AgentStatus.RUNNING:
             raise ValueError(f"Agent {agent.config.name} is not running")

        # Create Task
        task = Task(
            context_id=context_id,
            status=TaskStatus(state=TaskState.SUBMITTED)
        )
        task.metadata["agent_id"] = agent_id
        task.metadata["created_at"] = datetime.utcnow().isoformat() + "Z"
        self.tasks[task.id] = task
        self.contexts[context_id].tasks.append(task.id)

        # Construct Initial Message
        message = Message(
            role="user",
            parts=[{"kind": "text", "text": content}],
            context_id=context_id,
            task_id=task.id,
        )
        task.history.append(message)

        # Payment gating (Task-First pattern: payment-required is an intermediate state)
        if getattr(agent.config, "payment", None) and agent.config.payment.enabled:
            task.status.state = TaskState.PAYMENT_REQUIRED
            task.status.message = Message(
                role="agent",
                parts=[{
                    "kind": "text",
                    "text": "Payment required to proceed. Call /tasks/{task_id}/pay to continue.",
                }],
                context_id=task.context_id,
                task_id=task.id,
            )
            return task

        # Enqueue for background processing
        await self._task_queue.put(task.id)

        return task

    async def pay_for_task(self, task_id: str, receipt: Optional[dict] = None) -> Task:
        task = self.tasks.get(task_id)
        if not task:
            raise ValueError("Task not found")
        if task.status.state != TaskState.PAYMENT_REQUIRED:
            raise ValueError("Task is not awaiting payment")

        task.metadata["payment_receipt"] = receipt or {"status": "paid"}
        task.status.state = TaskState.SUBMITTED
        task.status.message = None
        await self._task_queue.put(task.id)
        return task

    async def _send_task_to_agent(self, agent: AgentInfo, task: Task) -> None:
        agent_url = agent.config.external_url or f"http://localhost:{agent.config.port}"

        # Use the last user message as input
        user_msg = next((m for m in reversed(task.history) if m.role == "user"), None)
        if not user_msg:
            task.status.state = TaskState.FAILED
            task.status.message = Message(
                role="system",
                parts=[{"kind": "text", "text": "Error: Task has no user message"}],
                context_id=task.context_id,
                task_id=task.id,
            )
            return

        # A2A Protocol: message/send
        payload = {
            "jsonrpc": "2.0",
            "method": "message/send",
            "params": {
                "message": user_msg.model_dump(mode="json"),
                "task_id": task.id,
                "context_id": task.context_id,
            },
            "id": str(uuid.uuid4()),
        }

        try:
            task.status.state = TaskState.WORKING
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(agent_url, json=payload)
                response.raise_for_status()
                rpc = response.json()

                if isinstance(rpc, dict) and rpc.get("error"):
                    raise RuntimeError(rpc["error"].get("message", "Agent error"))

                result = rpc.get("result") if isinstance(rpc, dict) else rpc
                response_text = None
                if isinstance(result, dict):
                    response_text = result.get("response") or result.get("content") or result.get("output")
                if response_text is None:
                    response_text = str(result)

                agent_msg = Message(
                    role="agent",
                    parts=[{"kind": "text", "text": str(response_text)}],
                    context_id=task.context_id,
                    task_id=task.id,
                )
                task.history.append(agent_msg)

                # Task-First: completed => message + artifact (deliverable)
                task.artifacts.append(
                    Artifact(
                        name="result",
                        description="Agent output",
                        parts=[{"kind": "text", "text": str(response_text)}],
                        metadata={},
                    )
                )
                task.status.state = TaskState.COMPLETED
                task.status.message = agent_msg

        except Exception as e:
            print(f"Error communicating with agent {agent.id}: {e}")
            task.status.state = TaskState.FAILED
            task.status.message = Message(
                role="system",
                parts=[{"kind": "text", "text": f"Error: {str(e)}"}],
                context_id=task.context_id,
                task_id=task.id,
            )

    def get_task(self, task_id: str) -> Optional[Task]:
        return self.tasks.get(task_id)

        
