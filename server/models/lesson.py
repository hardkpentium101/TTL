"""
Lesson Model
Represents a single lesson unit with rich structured content.
"""
from datetime import datetime
from typing import Optional, List, Any, Union
from beanie import Document, Link
from pydantic import BaseModel
from bson import ObjectId


# Content block types for flexible lesson content
class HeadingBlock(BaseModel):
    type: str = "heading"
    text: str
    level: Optional[int] = 2  # h1, h2, h3, etc.


class ParagraphBlock(BaseModel):
    type: str = "paragraph"
    text: str


class CodeBlock(BaseModel):
    type: str = "code"
    language: str
    text: str


class VideoBlock(BaseModel):
    type: str = "video"
    query: str  # Search query for YouTube API
    video_id: Optional[str] = None  # Filled after YouTube API lookup


class MCQBlock(BaseModel):
    type: str = "mcq"
    question: str
    options: List[str]
    answer: int  # Index of correct answer
    explanation: str


class ListBlock(BaseModel):
    type: str = "list"
    items: List[str]
    ordered: bool = False


# Union type for content blocks
ContentBlock = Union[
    HeadingBlock,
    ParagraphBlock,
    CodeBlock,
    VideoBlock,
    MCQBlock,
    ListBlock
]


class Lesson(Document):
    """
    Lesson document schema.
    
    Relationships:
    - Belongs to one Module (many-to-one)
    - Contains structured content blocks
    """
    title: str
    module: "ObjectId"  # Reference to parent module
    content: List[Any] = []  # Flexible content blocks (stored as dict)
    objectives: List[str] = []  # Lesson objectives
    key_topics: List[str] = []  # Key topics covered
    resources: List[dict] = []  # External resources/links
    is_enriched: bool = False  # Track if AI-enhanced
    order: int = 0  # Order within module
    created_at: datetime = datetime.utcnow
    updated_at: datetime = datetime.utcnow
    
    class Settings:
        name = "lessons"
        indexes = [
            "module",
            ("module", "order"),
        ]
    
    def __repr__(self):
        return f"<Lesson {self.title}>"


class LessonCreate(BaseModel):
    """Schema for creating a new lesson"""
    title: str
    content: List[Any] = []
    objectives: List[str] = []
    key_topics: List[str] = []
    resources: List[dict] = []
    is_enriched: bool = False
    order: int = 0


class LessonUpdate(BaseModel):
    """Schema for updating a lesson"""
    title: Optional[str] = None
    content: Optional[List[Any]] = None
    objectives: Optional[List[str]] = None
    key_topics: Optional[List[str]] = None
    resources: Optional[List[dict]] = None
    is_enriched: Optional[bool] = None
    order: Optional[int] = None
