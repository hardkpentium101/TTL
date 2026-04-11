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
    Two-phase async course generation:
    Phase 1: Generate lightweight outline (modules + lesson titles)
    Phase 2: Generate each lesson's content in parallel
    """
    try:
        loop = asyncio.get_event_loop()

        # ============ PHASE 1: Outline ============
        task_queue.update_task(job_id, "running", progress=5, message="Generating course outline...")
        await asyncio.sleep(0.1)

        outline = await loop.run_in_executor(
            None,
            lambda: llm_manager.generate_course_outline(topic, level)
        )

        if not outline or ("title" not in outline and "modules" not in outline):
            raise Exception("Failed to generate course outline")

        course_title = outline.get("title", f"Course: {topic}")
        modules = outline.get("modules", [])
        total_lessons = sum(len(m.get("lessons", [])) for m in modules)

        task_queue.update_task(job_id, "running", progress=15,
                               message=f"Outline ready: {len(modules)} modules, {total_lessons} lessons")

        # ============ PHASE 2: Parallel lesson generation ============
        is_technical = any(kw in topic.lower() for kw in
                          ["python", "javascript", "sql", "code", "programming", "api", "react", "node"])

        lesson_tasks = []
        for mod in modules:
            mod_title = mod.get("title", "")
            for lesson in mod.get("lessons", []):
                lesson_tasks.append({
                    "module": mod,
                    "lesson": lesson,
                    "module_title": mod_title,
                    "lesson_title": lesson.get("title", ""),
                    "lesson_id": lesson.get("id", ""),
                })

        total = len(lesson_tasks)
        completed = 0
        results = [None] * total  # Preserve order

        # Generate lessons in parallel (batch of 3 to avoid rate limits)
        BATCH_SIZE = 3
        for batch_start in range(0, total, BATCH_SIZE):
            batch_end = min(batch_start + BATCH_SIZE, total)
            batch = lesson_tasks[batch_start:batch_end]

            async def gen_lesson(idx: int, task_info: dict):
                content = await loop.run_in_executor(
                    None,
                    lambda t=task_info: llm_manager.generate_lesson_content(
                        course_title,
                        t["module_title"],
                        t["lesson_title"],
                        t["lesson_id"],
                        level,
                        is_technical,
                    )
                )
                return idx, content

            batch_coros = [gen_lesson(batch_start + i, t) for i, t in enumerate(batch)]
            batch_results = await asyncio.gather(*batch_coros, return_exceptions=True)

            for res in batch_results:
                if isinstance(res, Exception):
                    logger.error(f"Lesson generation failed: {res}")
                else:
                    idx, content = res
                    if content:
                        results[idx] = content
                completed += 1
                progress = 15 + int((completed / total) * 75)
                task_queue.update_task(job_id, "running", progress=progress,
                                       message=f"Generating lessons: {completed}/{total}")

        # ============ PHASE 3: Assemble ============
        task_queue.update_task(job_id, "running", progress=90, message="Assembling course...")

        # Merge generated content back into modules
        content_idx = 0
        for mod in modules:
            for lesson in mod.get("lessons", []):
                lesson_content = results[content_idx] if content_idx < len(results) and results[content_idx] else None
                if lesson_content:
                    # Override outline lesson with generated content
                    lesson.update(lesson_content)
                content_idx += 1

        # Build final course structure
        course_data = {
            "course": {
                "title": course_title,
                "description": outline.get("description", ""),
                "metadata": {
                    "level": level,
                    "estimated_duration": outline.get("estimated_duration", ""),
                    "prerequisites": outline.get("prerequisites", []),
                    "learning_outcomes": outline.get("learning_outcomes", []),
                    "skills_gained": outline.get("skills_gained", []),
                },
                "modules": modules,
            },
            "_provider": llm_manager.provider_name,
            "_ai_generated": True,
            "_two_phase": True,
        }

        # Save to database
        if creator_sub:
            try:
                from models.course import Course, Module, Lesson, LessonContentBlock

                generated_course = course_data.get("course", course_data)

                db_modules = []
                for module_data in generated_course.get("modules", []):
                    lessons = []
                    for lesson_data in module_data.get("lessons", []):
                        content_blocks = []
                        for block in lesson_data.get("content", []):
                            content_blocks.append(LessonContentBlock(**block))

                        lesson = Lesson(
                            id=lesson_data.get("id", str(datetime.utcnow().timestamp())),
                            title=lesson_data.get("title", ""),
                            objectives=lesson_data.get("objectives", []),
                            key_topics=lesson_data.get("key_topics", []),
                            content=content_blocks,
                            resources=lesson_data.get("resources", []),
                            is_enriched=lesson_data.get("is_enriched", False),
                        )
                        lessons.append(lesson)

                    module = Module(
                        id=module_data.get("id", str(datetime.utcnow().timestamp())),
                        title=module_data.get("title", ""),
                        description=module_data.get("description"),
                        lessons=lessons,
                    )
                    db_modules.append(module)

                course = Course(
                    title=generated_course.get("title", f"Course: {topic}"),
                    description=generated_course.get("description", ""),
                    creator=creator_sub,
                    modules=db_modules,
                    tags=[topic.lower().replace(" ", "-")],
                )
                await course.insert()
                course_data["course_id"] = str(course.id)
                course_data["saved"] = True

            except Exception as db_error:
                logger.error(f"Failed to save course to DB: {db_error}")
                course_data["saved"] = False
                course_data["db_error"] = str(db_error)

        task_queue.complete_task(job_id, course_data)
        return course_data

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
