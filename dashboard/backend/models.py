from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from enum import Enum

class AgentStatus(str, Enum):
    STOPPED = "stopped"
    RUNNING = "running"
    FAILED = "failed"

class AuthConfig(BaseModel):
    enabled: bool = False
    provider: str = "auth0"
    domain: Optional[str] = None
    audience: Optional[str] = None
    client_id: Optional[str] = None

class PaymentConfig(BaseModel):
    enabled: bool = False
    amount: str = "0.01"
    token: str = "USDC"
    network: str = "base-sepolia"
    pay_to_address: Optional[str] = None

class CrawlerConfig(BaseModel):
    name: str
    description: str
    target_url: str
    instructions: str
    port: int
    auth: AuthConfig = Field(default_factory=AuthConfig)
    payment: PaymentConfig = Field(default_factory=PaymentConfig)
    observability_enabled: bool = True
    skills: List[str] = ["skills/web-browsing"]

class AgentInfo(BaseModel):
    id: str
    config: CrawlerConfig
    status: AgentStatus
    pid: Optional[int] = None

class ChatRequest(BaseModel):
    query: str
    context_id: Optional[str] = None
