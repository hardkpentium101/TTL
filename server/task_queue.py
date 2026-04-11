"""
Async Task Queue for LLM Course Generation
Uses asyncio for non-blocking LLM calls with job status tracking,
timeout handling, and automatic cleanup.
"""
import asyncio
import uuid
import logging
import sys
from typing import Dict, Optional, Any
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

# Task timeout settings
TASK_TIMEOUT_SECONDS = 600  # 10 minutes max for course generation
TASK_CLEANUP_INTERVAL = 300  # Clean up every 5 minutes
MAX_RESULT_SIZE_BYTES = 10 * 1024 * 1024  # 10MB max result size


class TaskQueue:
    """In-memory task queue for tracking async LLM jobs."""

    def __init__(self):
        self.tasks: Dict[str, dict] = {}
        self.results: Dict[str, Any] = {}
        self.errors: Dict[str, str] = {}
        self._cleanup_task: Optional[asyncio.Task] = None
        # SSE watchers: job_id -> list of queues
        self._watchers: Dict[str, list] = {}

    def start_cleanup_task(self):
        """Start background cleanup task."""
        if self._cleanup_task is None:
            self._cleanup_task = asyncio.create_task(self._cleanup_loop())

    def stop_cleanup_task(self):
        """Stop background cleanup task."""
        if self._cleanup_task:
            self._cleanup_task.cancel()
            self._cleanup_task = None

    async def _cleanup_loop(self):
        """Periodically clean up old tasks."""
        try:
            while True:
                await asyncio.sleep(TASK_CLEANUP_INTERVAL)
                self.cleanup_old_tasks(hours=1)
                self.cleanup_stuck_tasks()
        except asyncio.CancelledError:
            pass
        except Exception as e:
            logger.error(f"Error in cleanup loop: {e}")

    def create_task(self, topic: str, level: str = "Beginner") -> str:
        """Create a new task and return job ID."""
        job_id = str(uuid.uuid4())
        self.tasks[job_id] = {
            "id": job_id,
            "topic": topic,
            "level": level,
            "status": "pending",
            "created_at": datetime.utcnow().isoformat(),
            "started_at": None,
            "completed_at": None,
            "progress": 0,
            "message": "Task queued",
            "timeout_at": None  # Will be set when task starts
        }
        return job_id

    def update_task(self, job_id: str, status: str, progress: int = None, message: str = None):
        """Update task status and broadcast to watchers."""
        if job_id not in self.tasks:
            return

        task = self.tasks[job_id]
        task["status"] = status

        if status == "running" and not task["started_at"]:
            task["started_at"] = datetime.utcnow().isoformat()
            # Set timeout deadline
            task["timeout_at"] = (
                datetime.utcnow() + timedelta(seconds=TASK_TIMEOUT_SECONDS)
            ).isoformat()

        if progress is not None:
            task["progress"] = progress

        if message:
            task["message"] = message

        # Broadcast to SSE watchers
        self._broadcast(job_id, task)

    def complete_task(self, job_id: str, result: Any):
        """Mark task as completed with result."""
        if job_id not in self.tasks:
            return

        # Check result size
        result_size = sys.getsizeof(str(result))
        if result_size > MAX_RESULT_SIZE_BYTES:
            logger.warning(f"Result for task {job_id} exceeds size limit ({result_size} bytes)")
            self.fail_task(job_id, "Result too large")
            return

        task = self.tasks[job_id]
        task["status"] = "completed"
        task["completed_at"] = datetime.utcnow().isoformat()
        task["progress"] = 100
        task["message"] = "Course generated successfully"
        self.results[job_id] = result

        # Broadcast final update
        self._broadcast(job_id, task)
        # Clean up watchers
        self._remove_watchers(job_id)

        logger.info(f"Task {job_id} completed successfully")

    def fail_task(self, job_id: str, error: str):
        """Mark task as failed."""
        if job_id not in self.tasks:
            return

        task = self.tasks[job_id]
        task["status"] = "failed"
        task["completed_at"] = datetime.utcnow().isoformat()
        task["message"] = f"Failed: {error}"
        self.errors[job_id] = error

        # Broadcast failure
        self._broadcast(job_id, task)
        # Clean up watchers
        self._remove_watchers(job_id)

        logger.error(f"Task {job_id} failed: {error}")

    def _broadcast(self, job_id: str, task: dict):
        """Push task update to all SSE watchers."""
        if job_id not in self._watchers:
            return
        dead_queues = []
        for queue in self._watchers.get(job_id, []):
            try:
                queue.put_nowait(task)
            except asyncio.QueueFull:
                pass  # Queue full, skip (client is slow)
            except Exception:
                dead_queues.append(queue)
        # Remove broken queues
        for q in dead_queues:
            try:
                self._watchers[job_id].remove(q)
            except (ValueError, KeyError):
                pass

    def _remove_watchers(self, job_id: str):
        """Remove all watchers for a finished task."""
        self._watchers.pop(job_id, None)

    async def watch_task(self, job_id: str) -> asyncio.Queue:
        """Create a queue that receives live updates for a task."""
        queue: asyncio.Queue = asyncio.Queue(maxsize=50)
        if job_id not in self._watchers:
            self._watchers[job_id] = []
        self._watchers[job_id].append(queue)

        # Send current state immediately
        task = self.tasks.get(job_id)
        if task:
            await queue.put(task)

        return queue

    def get_task(self, job_id: str) -> Optional[dict]:
        """Get task status."""
        return self.tasks.get(job_id)

    def get_result(self, job_id: str) -> Optional[Any]:
        """Get task result if completed."""
        return self.results.get(job_id)

    def cleanup_old_tasks(self, hours: int = 24):
        """Remove tasks older than specified hours."""
        cutoff = datetime.utcnow() - timedelta(hours=hours)
        old_jobs = [
            job_id for job_id, task in self.tasks.items()
            if datetime.fromisoformat(task["created_at"]) < cutoff
        ]
        for job_id in old_jobs:
            self.tasks.pop(job_id, None)
            self.results.pop(job_id, None)
            self.errors.pop(job_id, None)
        if old_jobs:
            logger.info(f"Cleaned up {len(old_jobs)} old tasks")

    def cleanup_stuck_tasks(self):
        """Find and fail tasks that have been running too long."""
        now = datetime.utcnow()
        stuck_jobs = []
        
        for job_id, task in self.tasks.items():
            if task["status"] == "running" and task.get("timeout_at"):
                timeout_at = datetime.fromisoformat(task["timeout_at"])
                if now > timeout_at:
                    stuck_jobs.append(job_id)
        
        for job_id in stuck_jobs:
            logger.warning(f"Task {job_id} timed out after {TASK_TIMEOUT_SECONDS}s")
            self.fail_task(job_id, f"Task timed out after {TASK_TIMEOUT_SECONDS} seconds")


# Global task queue instance
task_queue = TaskQueue()


async def generate_course_async(
    llm_manager,
    topic: str,
    level: str,
    job_id: str,
    creator_sub: Optional[str] = None
) -> Any:
    """
    Async wrapper for LLM course generation.
    Runs in background without blocking the request.
    Includes timeout handling and progress tracking.

    Args:
        llm_manager: LLMManager instance
        topic: Course topic
        level: Difficulty level
        job_id: Task job ID
        creator_sub: Auth0 user ID (optional, for saving to DB)
    """
    try:
        task_queue.update_task(job_id, "running", progress=10, message="Initializing LLM...")
        await asyncio.sleep(0.1)  # Yield control

        task_queue.update_task(job_id, "running", progress=30, message="Contacting LLM provider...")

        # Run LLM generation in executor to avoid blocking
        loop = asyncio.get_event_loop()
        course_data = await loop.run_in_executor(
            None,
            lambda: llm_manager.generate_course(topic, level)
        )

        if course_data:
            task_queue.update_task(job_id, "running", progress=90, message="Finalizing course...")
            await asyncio.sleep(0.1)

            # Save to database if creator_sub is provided
            if creator_sub:
                try:
                    from models.course import Course, Module, Lesson, LessonContentBlock

                    generated_course = course_data.get("course", course_data)

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
                                is_enriched=lesson_data.get("is_enriched", False)
                            )
                            lessons.append(lesson)

                        module = Module(
                            id=module_data.get("id", str(datetime.utcnow().timestamp())),
                            title=module_data["title"],
                            description=module_data.get("description"),
                            lessons=lessons
                        )
                        modules.append(module)

                    # Create and save course
                    course = Course(
                        title=generated_course.get("title", f"Course: {topic}"),
                        description=generated_course.get("description", ""),
                        creator=creator_sub,
                        modules=modules,
                        tags=generated_course.get("tags", [topic.lower().replace(" ", "-")])
                    )
                    await course.insert()

                    # Add course ID to result
                    course_data["course_id"] = str(course.id)
                    course_data["saved"] = True

                except Exception as db_error:
                    logger.error(f"Failed to save course to DB: {db_error}")
                    course_data["saved"] = False
                    course_data["db_error"] = str(db_error)

            task_queue.complete_task(job_id, course_data)
            return course_data
        else:
            raise Exception("LLM returned no course data")

    except asyncio.CancelledError:
        task_queue.fail_task(job_id, "Task was cancelled")
        raise
    except Exception as e:
        logger.error(f"Error generating course: {e}")
        task_queue.fail_task(job_id, str(e))
        raise


# Background task cleaner
async def cleanup_background():
    """Periodically clean up old tasks."""
    while True:
        await asyncio.sleep(3600)  # Run every hour
        task_queue.cleanup_old_tasks()
