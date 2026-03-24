"""
Course API Routes
Handles course CRUD operations, generation, and retrieval.
"""

from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from typing import List, Optional
from bson import ObjectId
from datetime import datetime

from models.course import Course, Module, Lesson, LessonContentBlock, CourseCreate
from models.user import User
from middlewares.auth import Auth0JWTBearer, get_optional_user
from config.database import get_database

router = APIRouter(prefix="/api", tags=["courses"])


# ============= User Management =============


@router.post("/auth/user")
async def get_or_create_user(user: dict = Depends(Auth0JWTBearer)):
    """
    Get or create user in database from Auth0 token.
    Call this after login to ensure user exists in DB.
    """
    print(f"[AUTH] get_or_create_user called with user: {user}")

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
async def get_user_courses(user: dict = Depends(Auth0JWTBearer)):
    """
    Get all courses created by the authenticated user.
    Returns list with basic info (no full content).
    """
    try:
        print(f"[DEBUG] get_user_courses called with user: {user}")
        
        # Validate user has sub
        if not user or "sub" not in user:
            raise HTTPException(status_code=400, detail="Invalid user: missing sub")
        
        courses = (
            await Course.find(Course.creator == user["sub"])
            .sort(-Course.created_at)
            .to_list()
        )

        print(f"[DEBUG] Found {len(courses)} courses for user {user['sub']}")

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
                    "created_at": course.created_at.isoformat() if course.created_at else None,
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
async def get_user_course(course_id: str, user: dict = Depends(Auth0JWTBearer)):
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
async def delete_user_course(course_id: str, user: dict = Depends(Auth0JWTBearer)):
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
    user: dict = Depends(Auth0JWTBearer),
):
    """
    Generate a course from topic and save to database.
    Combines AI generation with database persistence.
    """
    topic = request.get("topic", "").strip()

    if not topic:
        raise HTTPException(status_code=400, detail="Topic cannot be empty")

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
            title=generated_course.get("title", f"Course: {topic}"),
            description=generated_course.get("description", ""),
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
    user: dict = Depends(Auth0JWTBearer),
):
    """
    Generate course asynchronously (non-blocking).
    Returns job_id immediately, poll /api/course-status/{job_id} for results.
    """
    from task_queue import task_queue, generate_course_async
    from llm_manager import LLMManager

    topic = request.get("topic", "").strip()
    level = request.get("level", "Beginner")

    if not topic:
        raise HTTPException(status_code=400, detail="Topic cannot be empty")

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
