from typing import List, Literal, Optional

from pydantic import BaseModel, Field


class ChatTurn(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=1000)
    # The widget owns conversation state (no stable identity to key a
    # server-side session on for an anonymous visitor) and sends back
    # whatever history it's holding with each request.
    history: Optional[List[ChatTurn]] = None


class ChatResponse(BaseModel):
    reply: str
