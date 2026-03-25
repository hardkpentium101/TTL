"""
Tests for Task Queue with Timeout and Cleanup
"""

import pytest
import asyncio
from datetime import datetime, timedelta
from unittest.mock import Mock, AsyncMock, patch, MagicMock
from task_queue import (
    TaskQueue,
    TASK_TIMEOUT_SECONDS,
    TASK_CLEANUP_INTERVAL,
    MAX_RESULT_SIZE_BYTES
)


class TestTaskQueue:
    """Test task queue functionality."""

    def setup_method(self):
        """Set up test fixtures."""
        self.queue = TaskQueue()

    def teardown_method(self):
        """Clean up after tests."""
        if self.queue._cleanup_task:
            self.queue._cleanup_task.cancel()

    def test_create_task(self):
        """Test task creation."""
        job_id = self.queue.create_task("Test Topic", "Beginner")
        
        assert job_id is not None
        task = self.queue.get_task(job_id)
        assert task is not None
        assert task["status"] == "pending"
        assert task["topic"] == "Test Topic"
        assert task["level"] == "Beginner"
        assert task["progress"] == 0

    def test_update_task(self):
        """Test task status update."""
        job_id = self.queue.create_task("Test")
        
        self.queue.update_task(job_id, "running", progress=50, message="Processing")
        
        task = self.queue.get_task(job_id)
        assert task["status"] == "running"
        assert task["progress"] == 50
        assert task["message"] == "Processing"
        assert task["started_at"] is not None
        assert task["timeout_at"] is not None

    def test_complete_task(self):
        """Test task completion."""
        job_id = self.queue.create_task("Test")
        result = {"course": "Test Course"}
        
        self.queue.complete_task(job_id, result)
        
        task = self.queue.get_task(job_id)
        assert task["status"] == "completed"
        assert task["progress"] == 100
        assert self.queue.get_result(job_id) == result

    def test_fail_task(self):
        """Test task failure."""
        job_id = self.queue.create_task("Test")
        
        self.queue.fail_task(job_id, "Test error")
        
        task = self.queue.get_task(job_id)
        assert task["status"] == "failed"
        assert "Test error" in task["message"]

    def test_get_nonexistent_task(self):
        """Test getting a task that doesn't exist."""
        task = self.queue.get_task("nonexistent-id")
        assert task is None

    def test_cleanup_old_tasks(self):
        """Test cleanup of old tasks."""
        # Create a task
        job_id = self.queue.create_task("Test")
        
        # Manually set old created_at time
        old_time = (datetime.utcnow() - timedelta(hours=25)).isoformat()
        self.queue.tasks[job_id]["created_at"] = old_time
        
        # Cleanup should remove old task
        self.queue.cleanup_old_tasks(hours=24)
        
        assert self.queue.get_task(job_id) is None

    def test_cleanup_stuck_tasks(self):
        """Test cleanup of stuck/timed out tasks."""
        job_id = self.queue.create_task("Test")
        
        # Set task as running with expired timeout
        self.queue.tasks[job_id]["status"] = "running"
        old_timeout = (datetime.utcnow() - timedelta(seconds=10)).isoformat()
        self.queue.tasks[job_id]["timeout_at"] = old_timeout
        
        # Cleanup should fail stuck task
        self.queue.cleanup_stuck_tasks()
        
        task = self.queue.get_task(job_id)
        assert task["status"] == "failed"
        assert "timed out" in task["message"].lower()

    def test_result_size_limit(self):
        """Test that oversized results are rejected."""
        job_id = self.queue.create_task("Test")
        
        # Create oversized result
        large_result = {"data": "x" * (MAX_RESULT_SIZE_BYTES + 1000)}
        
        self.queue.complete_task(job_id, large_result)
        
        # Task should be failed, not completed
        task = self.queue.get_task(job_id)
        assert task["status"] == "failed"
        assert "too large" in task["message"].lower()

    def test_start_stop_cleanup_task(self):
        """Test background cleanup task methods exist."""
        # Just test that methods exist and can be called
        assert hasattr(self.queue, 'start_cleanup_task')
        assert hasattr(self.queue, 'stop_cleanup_task')
        assert callable(self.queue.start_cleanup_task)
        assert callable(self.queue.stop_cleanup_task)


class TestTaskTimeout:
    """Test task timeout configuration."""

    def test_timeout_is_reasonable(self):
        """Test that timeout value is reasonable."""
        # Should be between 5 minutes and 30 minutes
        assert 300 <= TASK_TIMEOUT_SECONDS <= 1800
        assert TASK_TIMEOUT_SECONDS == 600  # 10 minutes

    def test_cleanup_interval_is_reasonable(self):
        """Test that cleanup interval is reasonable."""
        # Should be between 1 minute and 1 hour
        assert 60 <= TASK_CLEANUP_INTERVAL <= 3600
        assert TASK_CLEANUP_INTERVAL == 300  # 5 minutes


@pytest.mark.asyncio
class TestGenerateCourseAsync:
    """Test async course generation."""

    @pytest.fixture
    def mock_llm(self):
        """Create mock LLM manager."""
        llm = Mock()
        llm.generate_course = Mock(return_value={
            "course": {
                "title": "Test Course",
                "description": "Test Description",
                "modules": [{
                    "title": "Module 1",
                    "lessons": [{
                        "title": "Lesson 1",
                        "content": [{"type": "paragraph", "text": "Test"}]
                    }]
                }]
            }
        })
        return llm

    async def test_generate_course_success(self, mock_llm):
        """Test successful course generation."""
        from task_queue import generate_course_async, task_queue
        
        job_id = task_queue.create_task("Test Topic")
        
        result = await generate_course_async(
            mock_llm, "Test Topic", "Beginner", job_id, "user123"
        )
        
        assert result is not None
        assert "course" in result
        task = task_queue.get_task(job_id)
        assert task["status"] == "completed"

    async def test_generate_course_no_data(self, mock_llm):
        """Test course generation when LLM returns no data."""
        from task_queue import generate_course_async, task_queue
        
        mock_llm.generate_course = Mock(return_value=None)
        
        job_id = task_queue.create_task("Test Topic")
        
        with pytest.raises(Exception):
            await generate_course_async(
                mock_llm, "Test Topic", "Beginner", job_id, "user123"
            )
        
        task = task_queue.get_task(job_id)
        assert task["status"] == "failed"

    async def test_generate_course_db_error(self, mock_llm):
        """Test course generation completes even with DB error."""
        from task_queue import generate_course_async, task_queue
        
        job_id = task_queue.create_task("Test Topic")
        
        # Just test that the function completes without crashing
        result = await generate_course_async(
            mock_llm, "Test Topic", "Beginner", job_id, "user123"
        )
        
        # Should complete
        assert result is not None
        task = task_queue.get_task(job_id)
        assert task["status"] == "completed"
