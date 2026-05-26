from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class LoginRequest(BaseModel):
    email: str
    password: str

class TokenResponse(BaseModel):
    token: str
    role: str
    name: str
    id: str

class UserOut(BaseModel):
    id: str
    email: str
    name: str
    role: str
    created_at: Optional[datetime] = None
    class Config:
        from_attributes = True

class CreateUserRequest(BaseModel):
    email: str
    name: str
    password: str

class TaskOut(BaseModel):
    id: str
    title: str
    description: Optional[str] = ""
    employee_id: str
    classifications: str
    zip_file_path: Optional[str] = None
    completed_zip_path: Optional[str] = None
    status: str
    created_at: Optional[datetime] = None
    class Config:
        from_attributes = True

class SendUpdateRequest(BaseModel):
    files_completed: int
    files_remaining: int
    comments: str = ""
    classification_data: Optional[Dict[str, int]] = None

class UpdateStatusRequest(BaseModel):
    status: str
