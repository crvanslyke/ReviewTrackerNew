from typing import Optional
from datetime import date, datetime
from sqlmodel import Field, SQLModel
from enum import Enum

class Role(str, Enum):
    REVIEWER = "Reviewer"
    ASSOCIATE_EDITOR = "Associate Editor"
    SESSION_CHAIR = "Session Chair"
    AUTHOR = "Author"

class Status(str, Enum):
    INVITED = "Invited"
    ACTIVE = "Active"
    IN_REVIEW = "In Review"
    PENDING_DECISION = "Pending Decision"
    COMPLETED = "Completed"
    ACCEPTED = "Accepted"
    REJECTED = "Rejected"

class WorkItem(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str
    manuscript_id: Optional[str] = None
    venue: Optional[str] = None
    role: Role
    status: Status
    due_date: Optional[date] = None
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
