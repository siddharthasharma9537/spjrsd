from pydantic import BaseModel, EmailStr
from typing import Optional

class ContactMessageCreate(BaseModel):
    name: str
    email: EmailStr
    message: str
    subject: Optional[str] = None
    mobile: Optional[str] = None
