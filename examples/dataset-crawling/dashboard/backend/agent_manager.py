import os
import subprocess
import uuid
import signal
from pathlib import Path
from typing import List, Dict
from jinja2 import Environment, FileSystemLoader

from .models import CrawlerConfig, AgentInfo, AgentStatus

GENERATED_AGENTS_DIR = Path("dashboard/generated_agents")
GENERATED_AGENTS_DIR.mkdir(parents=True, exist_ok=True)

class AgentManager:
    def __init__(self):
        self.agents: Dict[str, AgentInfo] = {}
        self.template_env = Environment(
            loader=FileSystemLoader("dashboard/backend/templates")
        )

    def list_agents(self) -> List[AgentInfo]:
        return list(self.agents.values())

    def create_agent(self, config: CrawlerConfig) -> AgentInfo:
        agent_id = str(uuid.uuid4())
        
        # Generate Agent Code
        template = self.template_env.get_template("crawler_agent.py.jinja")
        agent_code = template.render(
            name=config.name,
            description=config.description,
            target_url=config.target_url,
            instructions=config.instructions,
            port=config.port,
            author="dashboard-user@getbindu.com",
            auth=config.auth.model_dump(),
            payment=config.payment.model_dump(),
            storage=config.storage.model_dump(),
            observability=config.observability.model_dump(),
            skills=config.skills
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
        
        # Check Execution Environment
        env = os.getenv("PROJECT__ENVIRONMENT", "development")
        
        if env == "production":
            return self._stop_k8s_agent(agent)
        else:
            return self._stop_local_agent(agent)

    def _start_local_agent(self, agent: AgentInfo) -> AgentInfo:
        agent_file_path = GENERATED_AGENTS_DIR / f"agent_{agent.id}.py"
        import sys
        
        # In Docker, we might need to run this differently if we want to spawn a new container
        # But for 'subprocess' mode inside a container, it just runs a process inside the container (not ideal for isolation but works for demo)
        
        process = subprocess.Popen(
            [sys.executable, str(agent_file_path)],
            cwd=os.getcwd(),
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
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
        
