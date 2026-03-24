"""
Async Task Queue for LLM Course Generation
Uses asyncio for non-blocking LLM calls with job status tracking
"""
import asyncio
import uuid
from typing import Dict, Optional, Any
from datetime import datetime, timedelta


class TaskQueue:
    """In-memory task queue for tracking async LLM jobs."""
    
    def __init__(self):
        self.tasks: Dict[str, dict] = {}
        self.results: Dict[str, Any] = {}
        self.errors: Dict[str, str] = {}
    
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
            "message": "Task queued"
        }
        return job_id
    
    def update_task(self, job_id: str, status: str, progress: int = None, message: str = None):
        """Update task status."""
        if job_id not in self.tasks:
            return
        
        task = self.tasks[job_id]
        task["status"] = status
        
        if status == "running" and not task["started_at"]:
            task["started_at"] = datetime.utcnow().isoformat()
        
        if progress is not None:
            task["progress"] = progress
        
        if message:
            task["message"] = message
    
    def complete_task(self, job_id: str, result: Any):
        """Mark task as completed with result."""
        if job_id not in self.tasks:
            return
        
        task = self.tasks[job_id]
        task["status"] = "completed"
        task["completed_at"] = datetime.utcnow().isoformat()
        task["progress"] = 100
        task["message"] = "Course generated successfully"
        self.results[job_id] = result
    
    def fail_task(self, job_id: str, error: str):
        """Mark task as failed."""
        if job_id not in self.tasks:
            return
        
        task = self.tasks[job_id]
        task["status"] = "failed"
        task["completed_at"] = datetime.utcnow().isoformat()
        task["message"] = f"Failed: {error}"
        self.errors[job_id] = error
    
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


# Global task queue instance
task_queue = TaskQueue()


async def generate_course_async(llm_manager, topic: str, level: str, job_id: str) -> Any:
    """
    Async wrapper for LLM course generation.
    Runs in background without blocking the request.
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
            task_queue.complete_task(job_id, course_data)
            return course_data
        else:
            raise Exception("LLM returned no course data")
            
    except Exception as e:
        task_queue.fail_task(job_id, str(e))
        raise


# Background task cleaner
async def cleanup_background():
    """Periodically clean up old tasks."""
    while True:
        await asyncio.sleep(3600)  # Run every hour
        task_queue.cleanup_old_tasks()
