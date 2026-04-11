"""
Course API Routes
Handles course CRUD operations, generation, and retrieval.
"""

from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks, Security
from fastapi.security import HTTPAuthorizationCredentials
from fastapi.responses import StreamingResponse
from typing import List, Optional
from bson import ObjectId
from datetime import datetime
import asyncio
import json
import re

from models.course import Course, Module, Lesson, LessonContentBlock
from models.user import User
from middlewares.auth import (
    get_optional_user,
    get_user_or_anonymous,
    security,
)

router = APIRouter(prefix="/api", tags=["courses"])

# ============= Input Validation Constants =============
MAX_TOPIC_LENGTH = 500  # Maximum topic length to prevent DoS
MIN_TOPIC_LENGTH = 3  # Minimum topic length for meaningful input
MAX_TITLE_LENGTH = 200  # Maximum course title length

# Valid proficiency levels
VALID_LEVELS = ["Beginner", "Intermediate", "Advanced"]


def sanitize_input(text: str) -> str:
    """
    Sanitize user input to prevent XSS and injection attacks.
    - Removes potentially dangerous HTML/script tags
    - Trims whitespace
    - Normalizes unicode
    """
    if not text:
        return ""

    # Trim whitespace
    text = text.strip()

    # Remove potential script tags and HTML
    text = re.sub(r"<[^>]*>", "", text)

    # Normalize unicode
    text = text.encode("utf-8", "ignore").decode("utf-8")

    return text


def validate_topic(topic: str) -> str:
    """
    Validate and sanitize topic input.
    Raises HTTPException if validation fails.
    """
    if not topic or not topic.strip():
        raise HTTPException(status_code=400, detail="Topic cannot be empty")

    sanitized = sanitize_input(topic)

    if len(sanitized) < MIN_TOPIC_LENGTH:
        raise HTTPException(
            status_code=400,
            detail=f"Topic must be at least {MIN_TOPIC_LENGTH} characters long",
        )

    if len(sanitized) > MAX_TOPIC_LENGTH:
        raise HTTPException(
            status_code=400,
            detail=f"Topic must be less than {MAX_TOPIC_LENGTH} characters (got {len(sanitized)})",
        )

    return sanitized


# ============= User Management =============


@router.post("/auth/user")
async def get_or_create_user(user: dict = Depends(get_user_or_anonymous)):
    """
    Get or create user in database from Auth0 token.
    Call this after login to ensure user exists in DB.
    For anonymous users, returns the anonymous user info without DB persistence.
    """
    print(f"[AUTH] get_or_create_user called with user: {user}")

    # Check if user is anonymous
    if user.get("is_anonymous"):
        # Don't persist anonymous users to DB, just return their info
        return {
            "user": {
                "sub": user["sub"],
                "email": user.get("email"),
                "name": user.get("name", "Anonymous User"),
                "picture": user.get("picture"),
                "is_anonymous": True,
            },
            "created": False,
        }

    # Check required fields
    if not user.get("sub"):
        raise HTTPException(status_code=400, detail="Missing sub (Auth0 user ID)")
    if not user.get("email"):
        print(f"[AUTH] WARNING: No email in user object: {user}")

    try:
        # Try to find existing user
        existing_user = await User.find_one(User.auth0_sub == user["sub"])
        print(f"[AUTH] Existing user found: {existing_user}")

        if existing_user:
            # Update user info if changed
            existing_user.name = user.get("name", existing_user.name)
            existing_user.picture = user.get("picture", existing_user.picture)
            existing_user.email_verified = user.get(
                "email_verified", existing_user.email_verified
            )
            existing_user.updated_at = datetime.utcnow()
            await existing_user.save()
            return {"user": existing_user.dict(), "created": False}

        # Create new user
        new_user = User(
            auth0_sub=user["sub"],
            email=user["email"],
            name=user.get("name"),
            picture=user.get("picture"),
            email_verified=user.get("email_verified", False),
        )
        await new_user.insert()

        return {"user": new_user.dict(), "created": True}

    except Exception as e:
        import traceback

        print(f"[AUTH] ERROR: {str(e)}")
        print(f"[AUTH] Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=500, detail=f"Failed to get/create user: {str(e)}"
        )


@router.get("/user/courses")
async def get_user_courses(
    credentials: HTTPAuthorizationCredentials = Security(security),
    user: dict = Depends(get_user_or_anonymous),
):
    """
    Get all courses created by the authenticated user.
    For anonymous users, returns courses created in their session.
    Returns list with basic info (no full content).
    """
    try:
        # Validate user has sub
        if not user or "sub" not in user:
            raise HTTPException(status_code=400, detail="Invalid user: missing sub")

        courses = (
            await Course.find(Course.creator == user["sub"])
            .sort(-Course.created_at)
            .to_list()
        )

        # Return simplified course list
        course_list = []
        for course in courses:
            course_list.append(
                {
                    "id": str(course.id),
                    "title": course.title,
                    "description": course.description,
                    "modules_count": len(course.modules),
                    "lessons_count": sum(len(m.lessons) for m in course.modules),
                    "created_at": course.created_at.isoformat()
                    if course.created_at
                    else None,
                    "tags": course.tags,
                }
            )

        return {"courses": course_list}

    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] Failed to fetch courses: {str(e)}")
        import traceback

        traceback.print_exc()
        raise HTTPException(
            status_code=500, detail=f"Failed to fetch courses: {str(e)}"
        )


@router.get("/user/courses/{course_id}")
async def get_user_course(course_id: str, user: dict = Depends(get_user_or_anonymous)):
    """
    Get a specific course with full content by ID.
    Only returns courses owned by the authenticated user.
    """
    try:
        # Validate ObjectId
        if not ObjectId.is_valid(course_id):
            raise HTTPException(status_code=400, detail="Invalid course ID")

        course = await Course.find_one(
            (Course.id == ObjectId(course_id)) & (Course.creator == user["sub"])
        )

        if not course:
            raise HTTPException(status_code=404, detail="Course not found")

        return {"course": course.dict(), "id": str(course.id)}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch course: {str(e)}")


@router.delete("/user/courses/{course_id}")
async def delete_user_course(
    course_id: str, user: dict = Depends(get_user_or_anonymous)
):
    """
    Delete a course owned by the authenticated user.
    """
    try:
        # Validate ObjectId
        if not ObjectId.is_valid(course_id):
            raise HTTPException(status_code=400, detail="Invalid course ID")

        course = await Course.find_one(
            (Course.id == ObjectId(course_id)) & (Course.creator == user["sub"])
        )

        if not course:
            raise HTTPException(status_code=404, detail="Course not found")

        await course.delete()

        return {"message": "Course deleted successfully", "id": course_id}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to delete course: {str(e)}"
        )


# ============= Public Course Access =============


@router.get("/courses/{course_id}")
async def get_course_by_id(
    course_id: str, user: Optional[dict] = Depends(get_optional_user)
):
    """
    Get any course by ID (public read access).
    If user is authenticated and owns the course, full access is granted.
    Otherwise, returns course in read-only mode.
    """
    try:
        # Validate ObjectId
        if not ObjectId.is_valid(course_id):
            raise HTTPException(status_code=400, detail="Invalid course ID")

        course = await Course.find_one(Course.id == ObjectId(course_id))

        if not course:
            raise HTTPException(status_code=404, detail="Course not found")

        # Check if user owns this course
        is_owner = user and user.get("sub") == course.creator

        return {"course": course.dict(), "id": str(course.id), "is_owner": is_owner}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch course: {str(e)}")


# ============= Course Generation =============


@router.post("/generate-course")
async def generate_and_save_course(
    request: dict,
    background_tasks: BackgroundTasks,
    user: dict = Depends(get_user_or_anonymous),
):
    """
    Generate a course from topic and save to database.
    Combines AI generation with database persistence.
    Works for both authenticated and anonymous users.
    """
    topic = request.get("topic", "")

    # Validate and sanitize topic
    topic = validate_topic(topic)

    try:
        # Import LLM for generation
        from llm_manager import LLMManager

        llm = LLMManager()

        # Generate course content
        course_data = llm.generate_course(topic, level="Beginner")

        if not course_data or "course" not in course_data:
            raise HTTPException(
                status_code=500, detail="Failed to generate course content"
            )

        # Extract course info
        generated_course = course_data["course"]

        # Validate and sanitize course title
        title = sanitize_input(generated_course.get("title", f"Course: {topic}"))
        if len(title) > MAX_TITLE_LENGTH:
            title = title[: MAX_TITLE_LENGTH - 3] + "..."

        # Convert modules to proper format
        modules = []
        for module_data in generated_course.get("modules", []):
            lessons = []
            for lesson_data in module_data.get("lessons", []):
                # Convert content blocks
                content_blocks = []
                for block in lesson_data.get("content", []):
                    content_blocks.append(LessonContentBlock(**block))

                lesson = Lesson(
                    id=lesson_data.get("id", str(datetime.utcnow().timestamp())),
                    title=lesson_data["title"],
                    objectives=lesson_data.get("objectives", []),
                    key_topics=lesson_data.get("key_topics", []),
                    content=content_blocks,
                    resources=lesson_data.get("resources", []),
                    is_enriched=lesson_data.get("is_enriched", False),
                )
                lessons.append(lesson)

            module = Module(
                id=module_data.get("id", str(datetime.utcnow().timestamp())),
                title=module_data["title"],
                description=module_data.get("description"),
                lessons=lessons,
            )
            modules.append(module)

        # Create and save course
        course = Course(
            title=title,
            description=sanitize_input(generated_course.get("description", "")),
            creator=user["sub"],
            modules=modules,
            tags=generated_course.get("tags", [topic.lower().replace(" ", "-")]),
        )
        await course.insert()

        # Return course with MongoDB ID
        return {
            "course": generated_course,
            "id": str(course.id),
            "provider": course_data.get("_provider", "unknown"),
            "saved": True,
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to generate course: {str(e)}"
        )


# ============= Async Course Generation =============


@router.post("/generate-course-async")
async def generate_course_async_endpoint(
    request: dict,
    background_tasks: BackgroundTasks,
    user: dict = Depends(get_user_or_anonymous),
):
    """
    Generate course asynchronously (non-blocking).
    Returns job_id immediately, poll /api/course-status/{job_id} for results.
    Works for both authenticated and anonymous users.
    """
    from task_queue import task_queue, generate_course_async
    from llm_manager import LLMManager

    topic = request.get("topic", "")
    level = request.get("level", "Beginner")

    # Validate and sanitize topic
    topic = validate_topic(topic)

    # Validate level
    valid_levels = ["Beginner", "Intermediate", "Advanced"]
    if level not in valid_levels:
        level = "Beginner"

    # Create task
    job_id = task_queue.create_task(topic, level)

    # Start background task with user info
    background_tasks.add_task(
        generate_course_async,
        LLMManager(),
        topic,
        level,
        job_id,
        user["sub"],  # Pass user ID for saving
    )

    return {
        "job_id": job_id,
        "status": "pending",
        "message": "Course generation started",
        "status_url": f"/api/course-status/{job_id}",
        "result_url": f"/api/course-result/{job_id}",
    }


@router.get("/course-status/{job_id}")
async def get_course_status(job_id: str):
    """Get task status without result."""
    from task_queue import task_queue

    task = task_queue.get_task(job_id)

    if not task:
        raise HTTPException(status_code=404, detail="Job not found")

    return task


@router.get("/course-result/{job_id}")
async def get_course_result(job_id: str):
    """Get course result if task is completed."""
    from task_queue import task_queue

    task = task_queue.get_task(job_id)

    if not task:
        raise HTTPException(status_code=404, detail="Job not found")

    if task["status"] == "pending":
        return {"status": "pending", "message": "Task is queued"}

    if task["status"] == "running":
        return {
            "status": "running",
            "progress": task.get("progress", 0),
            "message": task.get("message", "Generating course..."),
        }

    if task["status"] == "completed":
        result = task_queue.get_result(job_id)
        return {"status": "completed", "data": result}

    if task["status"] == "failed":
        raise HTTPException(status_code=500, detail=task.get("message", "Task failed"))

    raise HTTPException(status_code=404, detail="Unknown status")


@router.get("/course-status-stream/{job_id}")
async def stream_course_status(job_id: str):
    """
    SSE endpoint that streams real-time course generation progress.
    Clients connect and receive updates as events instead of polling.
    """
    from task_queue import task_queue

    task = task_queue.get_task(job_id)
    if not task:
        raise HTTPException(status_code=404, detail="Job not found")

    async def event_generator():
        """Yield SSE events as they arrive."""
        queue = await task_queue.watch_task(job_id)

        try:
            while True:
                task_data = await queue.get()
                if task_data is None:
                    break

                yield f"data: {json.dumps(task_data)}\n\n"

                # Stop streaming on terminal states
                if task_data["status"] in ("completed", "failed"):
                    yield "event: done\n"
                    yield f"data: {json.dumps({'status': task_data['status']})}\n\n"
                    break
        except asyncio.CancelledError:
            pass
        finally:
            # Remove watcher from task queue
            task_queue._remove_watchers(job_id)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # Disable nginx buffering
        }
    )


# ============= Adaptive Quiz Assessment =============


def get_quiz_level(user_level: str) -> str:
    """
    Get the quiz level (one level below user's stated level).
    Beginner -> tests Beginner concepts
    Intermediate -> tests Beginner->Intermediate concepts
    Advanced -> tests Intermediate->Advanced concepts
    """
    level_map = {
        "Beginner": "Beginner",
        "Intermediate": "Beginner",
        "Advanced": "Intermediate",
    }
    return level_map.get(user_level, "Beginner")


@router.post("/generate-quiz")
async def generate_quiz_endpoint(
    request: dict,
    user: dict = Depends(get_user_or_anonymous),
):
    """
    Generate a 5-question adaptive MCQ quiz.
    Expects: { "topic": "string", "level": "Beginner|Intermediate|Advanced" }
    Returns quiz questions one level below the user's stated level.
    """
    from llm_manager import LLMManager

    topic = request.get("topic", "")
    level = request.get("level", "Beginner")

    # Validate topic
    topic = validate_topic(topic)

    # Validate level
    if level not in VALID_LEVELS:
        level = "Beginner"

    # Determine quiz level (one level below)
    quiz_level = get_quiz_level(level)

    try:
        llm = LLMManager()

        # Generate quiz
        quiz_data = llm.generate_quiz(topic, quiz_level)

        if not quiz_data or "questions" not in quiz_data:
            raise HTTPException(
                status_code=500, detail="Failed to generate quiz questions"
            )

        # Validate quiz structure
        questions = quiz_data.get("questions", [])
        if len(questions) != 5:
            raise HTTPException(
                status_code=500,
                detail=f"Expected 5 questions, got {len(questions)}",
            )

        # Validate each question has required fields
        for i, q in enumerate(questions):
            if not all(k in q for k in ["question", "options", "answer", "explanation"]):
                raise HTTPException(
                    status_code=500,
                    detail=f"Question {i+1} missing required fields",
                )
            if not isinstance(q.get("options"), list) or len(q.get("options", [])) != 4:
                raise HTTPException(
                    status_code=500,
                    detail=f"Question {i+1} must have exactly 4 options",
                )
            if not isinstance(q.get("answer"), int) or not (0 <= q["answer"] <= 3):
                raise HTTPException(
                    status_code=500,
                    detail=f"Question {i+1} answer must be 0-3",
                )

        return {
            "topic": topic,
            "user_level": level,
            "quiz_level": quiz_level,
            "questions": questions,
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to generate quiz: {str(e)}"
        )


@router.post("/evaluate-quiz")
async def evaluate_quiz_endpoint(
    request: dict,
    user: dict = Depends(get_user_or_anonymous),
):
    """
    Evaluate quiz answers and return score + assessed level.
    Expects: {
        "questions": [...],  # Original questions with answers
        "user_answers": [0, 1, 2, ...],  # User's answers (indices)
        "user_level": "Beginner|Intermediate|Advanced",
    }
    Returns: { "score": 80, "correct": 4, "total": 5, "assessed_level": "Intermediate" }
    """
    questions = request.get("questions", [])
    user_answers = request.get("user_answers", [])
    user_level = request.get("level", "Beginner")

    if not questions or not user_answers:
        raise HTTPException(status_code=400, detail="Missing questions or answers")

    if len(user_answers) != len(questions):
        raise HTTPException(
            status_code=400,
            detail=f"Expected {len(questions)} answers, got {len(user_answers)}",
        )

    try:
        # Calculate score
        correct = 0
        total = len(questions)

        for i, (question, user_answer) in enumerate(zip(questions, user_answers)):
            if user_answer == question.get("answer"):
                correct += 1

        score = round((correct / total) * 100) if total > 0 else 0

        # Derive assessed level based on score
        assessed_level = derive_assessed_level(score, user_level)

        return {
            "score": score,
            "correct": correct,
            "total": total,
            "assessed_level": assessed_level,
            "user_level": user_level,
        }

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to evaluate quiz: {str(e)}"
        )


def derive_assessed_level(score: int, user_level: str) -> str:
    """
    Derive assessed level based on quiz score.

    Scoring logic:
    - 0-40%: One level below user's stated level (or Beginner)
    - 41-70: User's stated level
    - 71-100%: One level above user's stated level (or Advanced)
    """
    levels = ["Beginner", "Intermediate", "Advanced"]

    try:
        user_level_idx = levels.index(user_level)
    except ValueError:
        user_level_idx = 0

    if score <= 40:
        # Below expectations
        assessed_idx = max(0, user_level_idx - 1)
    elif score <= 70:
        # At expectations
        assessed_idx = user_level_idx
    else:
        # Above expectations
        assessed_idx = min(len(levels) - 1, user_level_idx + 1)

    return levels[assessed_idx]
