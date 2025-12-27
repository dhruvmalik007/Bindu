from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Union, Literal
from enum import Enum
import uuid
from datetime import datetime

# --- Agent Configuration & Management Models ---

class AgentStatus(str, Enum):
    STOPPED = "stopped"
    RUNNING = "running"
    FAILED = "failed"

class AgentType(str, Enum):
    CRAWLER = "crawler" # Default/Legacy
    FIRECRAWL = "firecrawl"
    BROWSER_USE = "browser-use"
    ORCHESTRATOR = "orchestrator"

class HostingType(str, Enum):
    MANAGED = "managed"
    SELF_HOSTED = "self-hosted"

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

class StorageType(str, Enum):
    MEMORY = "memory"
    POSTGRES = "postgres"

class StorageConfig(BaseModel):
    type: StorageType = StorageType.MEMORY
    connection_string: Optional[str] = None

class ObservabilityConfig(BaseModel):
    enabled: bool = True
    otlp_endpoint: Optional[str] = None
    service_name: Optional[str] = None
    service_version: Optional[str] = None
    deployment_environment: Optional[str] = None
    resource_attributes: Optional[str] = None
    use_batch_processor: bool = True
    bsp_schedule_delay: Optional[int] = None
    bsp_max_export_batch_size: Optional[int] = None

class CrawlerConfig(BaseModel):
    name: str
    description: str
    type: AgentType = AgentType.CRAWLER
    hosting: HostingType = HostingType.MANAGED
    external_url: Optional[str] = None # For self-hosted agents
    target_url: Optional[str] = None # Optional for Orchestrator
    instructions: str
    port: int
    auth: AuthConfig = Field(default_factory=AuthConfig)
    payment: PaymentConfig = Field(default_factory=PaymentConfig)
    storage: StorageConfig = Field(default_factory=StorageConfig)
    observability: ObservabilityConfig = Field(default_factory=ObservabilityConfig)
    skills: List[str] = ["skills/web-browsing"]
    
    # Tool specific configs
    firecrawl_api_key: Optional[str] = None
    perplexity_api_key: Optional[str] = None # For Orchestrator
    openai_api_key: Optional[str] = None # For Browser-use/Orchestrator

class AgentInfo(BaseModel):
    id: str
    config: CrawlerConfig
    status: AgentStatus
    pid: Optional[int] = None

# --- Bindu Protocol Types (A2A) ---

class TaskState(str, Enum):
    SUBMITTED = "submitted"
    WORKING = "working"
    INPUT_REQUIRED = "input-required"
    AUTH_REQUIRED = "auth-required"
    PAYMENT_REQUIRED = "payment-required"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELED = "canceled"
    REJECTED = "rejected"

class TextPart(BaseModel):
    kind: Literal["text"] = "text"
    text: str

class FilePart(BaseModel):
    kind: Literal["file"] = "file"
    file: Dict[str, Any] # name, mimeType, uri

class DataPart(BaseModel):
    kind: Literal["data"] = "data"
    data: Dict[str, Any]

MessagePart = Union[TextPart, FilePart, DataPart]

class Message(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    kind: Literal["message"] = "message"
    role: Literal["user", "agent", "system"]
    parts: List[MessagePart]
    context_id: Optional[str] = None
    task_id: Optional[str] = None
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat() + "Z")
    metadata: Dict[str, Any] = Field(default_factory=dict)

class Artifact(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    parts: List[MessagePart]
    metadata: Dict[str, Any] = Field(default_factory=dict)

class TaskStatus(BaseModel):
    state: TaskState
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat() + "Z")
    message: Optional[Message] = None

class Task(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    context_id: str
    kind: Literal["task"] = "task"
    status: TaskStatus
    artifacts: List[Artifact] = Field(default_factory=list)
    history: List[Message] = Field(default_factory=list)
    metadata: Dict[str, Any] = Field(default_factory=dict)

class ContextStatus(str, Enum):
    ACTIVE = "active"
    PAUSED = "paused"
    COMPLETED = "completed"
    ARCHIVED = "archived"

class Context(BaseModel):
    context_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    kind: Literal["context"] = "context"
    tasks: List[str] = Field(default_factory=list)
    name: Optional[str] = None
    description: Optional[str] = None
    role: str = "assistant"
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat() + "Z")
    updated_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat() + "Z")
    status: ContextStatus = ContextStatus.ACTIVE
    tags: List[str] = Field(default_factory=list)
    metadata: Dict[str, Any] = Field(default_factory=dict)

class ChatRequest(BaseModel):
    query: str
    context_id: Optional[str] = None


