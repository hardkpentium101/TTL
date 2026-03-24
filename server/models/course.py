"""
Course Model with embedded Modules and Lessons
Uses embedded documents for simpler queries and better performance.
"""
from datetime import datetime, timezone
from typing import Optional, List, Any
from beanie import Document, Indexed
from pydantic import BaseModel, Field


# ============= Embedded Lesson Document =============
class LessonContentBlock(BaseModel):
    """Flexible content block for lesson content"""
    type: str  # "heading", "paragraph", "code", "video", "mcq", "list"
    text: Optional[str] = None
    language: Optional[str] = None  # For code blocks
    query: Optional[str] = None  # For video blocks
    video_id: Optional[str] = None
    level: Optional[int] = None  # For heading blocks
    items: Optional[List[str]] = None  # For list blocks
    ordered: Optional[bool] = None  # For list blocks
    question: Optional[str] = None  # For MCQ blocks
    options: Optional[List[str]] = None  # For MCQ blocks
    answer: Optional[int] = None  # For MCQ blocks
    explanation: Optional[str] = None  # For MCQ blocks


class Lesson(BaseModel):
    """Embedded lesson document"""
    id: str = Field(default_factory=lambda: str(datetime.now(timezone.utc).timestamp()))
    title: str
    objectives: List[str] = []
    key_topics: List[str] = []
    content: List[LessonContentBlock] = []
    resources: List[dict] = []
    is_enriched: bool = False
    order: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# ============= Embedded Module Document =============
class Module(BaseModel):
    """Embedded module document containing multiple lessons"""
    id: str = Field(default_factory=lambda: str(datetime.now(timezone.utc).timestamp()))
    title: str
    description: Optional[str] = None
    lessons: List[Lesson] = []
    order: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# ============= Main Course Document =============
class Course(Document):
    """
    Course document schema with embedded modules and lessons.

    Structure: Course → Modules (embedded) → Lessons (embedded)

    Relationships:
    - One-to-many with User (creator can have multiple courses)
    - Modules and Lessons are embedded for better query performance
    """
    title: str
    description: Optional[str] = None
    creator: Indexed(str)  # Auth0 sub (user ID)
    modules: List[Module] = []
    tags: List[str] = []
    is_published: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "courses"
        indexes = [
            "creator",
            "tags",
            ("creator", "created_at"),
        ]

    def __repr__(self):
        return f"<Course {self.title}>"


# ============= Pydantic Schemas for API =============
class CourseCreate(BaseModel):
    """Schema for creating a new course"""
    title: str
    description: Optional[str] = None
    tags: List[str] = []
    modules: List[Module] = []


class CourseUpdate(BaseModel):
    """Schema for updating a course"""
    title: Optional[str] = None
    description: Optional[str] = None
    tags: Optional[List[str]] = None
    modules: Optional[List[Module]] = None
    is_published: Optional[bool] = None


class LessonCreate(BaseModel):
    """Schema for creating a lesson"""
    title: str
    objectives: List[str] = []
    key_topics: List[str] = []
    content: List[LessonContentBlock] = []
    resources: List[dict] = []
    is_enriched: bool = False


class ModuleCreate(BaseModel):
    """Schema for creating a module"""
    title: str
    description: Optional[str] = None
    lessons: List[LessonCreate] = []
