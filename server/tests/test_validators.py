"""
Tests for Input Validation Utilities
"""

import pytest
from utils.validators import (
    validate_course_structure,
    validate_module,
    validate_lesson,
    validate_content_block,
    sanitize_course_data,
    sanitize_input,
    MAX_TOPIC_LENGTH,
    MAX_TITLE_LENGTH,
    MAX_MODULES,
    MAX_LESSONS_PER_MODULE
)


class TestValidateCourseStructure:
    """Test course structure validation."""

    def test_valid_course(self):
        """Test validation of a valid course structure."""
        course = {
            "title": "Test Course",
            "description": "A test course",
            "modules": [
                {
                    "title": "Module 1",
                    "lessons": [
                        {
                            "title": "Lesson 1",
                            "content": [
                                {"type": "heading", "text": "Introduction"}
                            ]
                        }
                    ]
                }
            ]
        }
        is_valid, errors = validate_course_structure(course)
        assert is_valid is True
        assert len(errors) == 0

    def test_empty_course(self):
        """Test validation of empty course data."""
        is_valid, errors = validate_course_structure({})
        assert is_valid is False
        assert len(errors) > 0

    def test_missing_modules(self):
        """Test validation when modules are missing."""
        course = {"title": "Test", "description": "Test"}
        is_valid, errors = validate_course_structure(course)
        assert is_valid is False
        assert any("modules" in error.lower() for error in errors)

    def test_too_many_modules(self):
        """Test validation when too many modules."""
        course = {
            "title": "Test Course",
            "modules": [
                {"title": f"Module {i}", "lessons": [{"title": "Lesson", "content": []}]}
                for i in range(MAX_MODULES + 1)
            ]
        }
        is_valid, errors = validate_course_structure(course)
        assert is_valid is False
        assert any("too many modules" in error.lower() for error in errors)

    def test_title_too_long(self):
        """Test validation when title exceeds max length."""
        course = {
            "title": "A" * (MAX_TITLE_LENGTH + 1),
            "modules": [{"title": "Module", "lessons": [{"title": "Lesson", "content": []}]}]
        }
        is_valid, errors = validate_course_structure(course)
        assert is_valid is False
        assert any("title" in error.lower() and "length" in error.lower() for error in errors)


class TestValidateModule:
    """Test module validation."""

    def test_valid_module(self):
        """Test validation of a valid module."""
        module = {
            "title": "Test Module",
            "lessons": [
                {"title": "Lesson 1", "content": []},
                {"title": "Lesson 2", "content": []}
            ]
        }
        errors = validate_module(module, 0)
        assert len(errors) == 0

    def test_too_many_lessons(self):
        """Test validation when too many lessons."""
        module = {
            "title": "Test Module",
            "lessons": [
                {"title": f"Lesson {i}", "content": []}
                for i in range(MAX_LESSONS_PER_MODULE + 1)
            ]
        }
        errors = validate_module(module, 0)
        assert len(errors) > 0
        assert any("too many lessons" in error.lower() for error in errors)

    def test_invalid_module_structure(self):
        """Test validation of invalid module structure."""
        errors = validate_module(None, 0)
        assert len(errors) > 0
        assert any("invalid" in error.lower() for error in errors)


class TestValidateContentBlock:
    """Test content block validation."""

    def test_valid_heading_block(self):
        """Test validation of a valid heading block."""
        block = {"type": "heading", "text": "Test Heading"}
        errors = validate_content_block(block, 0, 0, 0)
        assert len(errors) == 0

    def test_valid_paragraph_block(self):
        """Test validation of a valid paragraph block."""
        block = {"type": "paragraph", "text": "Test paragraph content"}
        errors = validate_content_block(block, 0, 0, 0)
        assert len(errors) == 0

    def test_invalid_block_type(self):
        """Test validation of invalid block type."""
        block = {"type": "invalid_type", "text": "Test"}
        errors = validate_content_block(block, 0, 0, 0)
        assert len(errors) > 0
        assert any("invalid block type" in error.lower() for error in errors)

    def test_missing_text_content(self):
        """Test validation when text content is missing."""
        block = {"type": "paragraph", "text": ""}
        errors = validate_content_block(block, 0, 0, 0)
        assert len(errors) > 0

    def test_valid_mcq_block(self):
        """Test validation of a valid MCQ block."""
        block = {
            "type": "mcq",
            "question": "What is 2+2?",
            "options": ["3", "4", "5"],
            "correct_answer": 1,
            "explanation": "2+2 equals 4"
        }
        errors = validate_content_block(block, 0, 0, 0)
        assert len(errors) == 0

    def test_mcq_missing_options(self):
        """Test MCQ validation when options are missing."""
        block = {
            "type": "mcq",
            "question": "What is 2+2?",
            "correct_answer": 1
        }
        errors = validate_content_block(block, 0, 0, 0)
        assert len(errors) > 0
        assert any("options" in error.lower() for error in errors)


class TestSanitizeCourseData:
    """Test course data sanitization."""

    def test_sanitize_long_title(self):
        """Test sanitization of overly long title."""
        course = {
            "title": "A" * 1000,
            "modules": [{"title": "Module", "lessons": [{"title": "Lesson", "content": []}]}]
        }
        sanitized = sanitize_course_data(course)
        assert len(sanitized["title"]) <= MAX_TITLE_LENGTH

    def test_sanitize_preserves_structure(self):
        """Test that sanitization preserves course structure."""
        course = {
            "title": "Test Course",
            "modules": [
                {
                    "title": "Module 1",
                    "lessons": [
                        {"title": "Lesson 1", "content": [{"type": "paragraph", "text": "Test"}]}
                    ]
                }
            ]
        }
        sanitized = sanitize_course_data(course)
        assert len(sanitized["modules"]) == 1
        assert len(sanitized["modules"][0]["lessons"]) == 1

    def test_sanitize_empty_course(self):
        """Test sanitization of empty course."""
        sanitized = sanitize_course_data({})
        assert isinstance(sanitized, dict)


class TestSanitizeInput:
    """Test input sanitization for XSS prevention."""

    def test_remove_script_tags(self):
        """Test removal of script tags."""
        input_text = "<script>alert('XSS')</script>Normal text"
        sanitized = sanitize_input(input_text)
        assert "<script>" not in sanitized
        assert "Normal text" in sanitized

    def test_remove_html_tags(self):
        """Test removal of HTML tags."""
        input_text = "<div><p>Test</p></div>"
        sanitized = sanitize_input(input_text)
        assert "<" not in sanitized

    def test_trim_whitespace(self):
        """Test whitespace trimming."""
        input_text = "   Test content   "
        sanitized = sanitize_input(input_text)
        assert sanitized == "Test content"

    def test_empty_input(self):
        """Test handling of empty input."""
        sanitized = sanitize_input("")
        assert sanitized == ""

    def test_none_input(self):
        """Test handling of None input."""
        sanitized = sanitize_input(None)
        assert sanitized == ""
