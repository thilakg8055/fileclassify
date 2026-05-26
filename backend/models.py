from sqlalchemy import Column, String, DateTime, Boolean, Integer, ForeignKey, Text
from database import Base
from datetime import datetime

class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True)
    email = Column(String, unique=True, index=True)
    name = Column(String)
    hashed_password = Column(String)
    role = Column(String, default="employee")
    files_completed = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

class Task(Base):
    __tablename__ = "tasks"
    id = Column(String, primary_key=True)
    title = Column(String)
    description = Column(Text, default="")
    employee_id = Column(String, ForeignKey("users.id"))
    classifications = Column(Text)  # JSON string of classification options
    zip_file_path = Column(String)
    completed_zip_path = Column(String, nullable=True)
    status = Column(String, default="assigned")  # assigned, in_progress, completed
    created_at = Column(DateTime, default=datetime.utcnow)

class TaskUpdate(Base):
    __tablename__ = "task_updates"
    id = Column(String, primary_key=True)
    task_id = Column(String, ForeignKey("tasks.id"))
    files_completed = Column(Integer, default=0)
    files_remaining = Column(Integer, default=0)
    comments = Column(Text, default="")
    classification_data = Column(Text, nullable=True)  # JSON
    created_at = Column(DateTime, default=datetime.utcnow)

class Notification(Base):
    __tablename__ = "notifications"
    id = Column(String, primary_key=True)
    task_id = Column(String, ForeignKey("tasks.id"))
    user_id = Column(String, ForeignKey("users.id"))
    type = Column(String)
    message = Column(Text)
    read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
