"""
Course Data Validation Utilities
Validates course structure and content integrity.
"""

import logging
from typing import Dict, List, Any, Optional

logger = logging.getLogger(__name__)

# Validation constants
MAX_MODULES = 20
MAX_LESSONS_PER_MODULE = 15
MAX_CONTENT_BLOCKS_PER_LESSON = 30
MAX_TITLE_LENGTH = 200
MAX_DESCRIPTION_LENGTH = 2000
MAX_TEXT_LENGTH = 10000


def validate_course_structure(course_data: Dict[str, Any]) -> tuple[bool, List[str]]:
    """
    Validate course data structure and content.
    
    Returns:
        Tuple of (is_valid, list_of_errors)
    """
    errors = []
    
    if not course_data:
        return False, ["Course data is empty"]
    
    # Validate title
    title = course_data.get("title", "")
    if not title or not isinstance(title, str):
        errors.append("Course title is missing or invalid")
    elif len(title) > MAX_TITLE_LENGTH:
        errors.append(f"Course title exceeds maximum length ({len(title)}/{MAX_TITLE_LENGTH})")
    
    # Validate description
    description = course_data.get("description", "")
    if description and len(description) > MAX_DESCRIPTION_LENGTH:
        errors.append(f"Course description exceeds maximum length ({len(description)}/{MAX_DESCRIPTION_LENGTH})")
    
    # Validate modules
    modules = course_data.get("modules", [])
    if not modules or not isinstance(modules, list):
        errors.append("Course modules are missing or invalid")
        return False, errors
    
    if len(modules) > MAX_MODULES:
        errors.append(f"Too many modules ({len(modules)}/{MAX_MODULES})")
    
    for module_idx, module in enumerate(modules):
        module_errors = validate_module(module, module_idx)
        errors.extend(module_errors)
    
    return len(errors) == 0, errors


def validate_module(module: Dict[str, Any], module_idx: int) -> List[str]:
    """Validate a single module."""
    errors = []
    
    if not module or not isinstance(module, dict):
        errors.append(f"Module {module_idx + 1}: Invalid module structure")
        return errors
    
    # Validate module title
    title = module.get("title", "")
    if not title or not isinstance(title, str):
        errors.append(f"Module {module_idx + 1}: Title is missing or invalid")
    elif len(title) > MAX_TITLE_LENGTH:
        errors.append(f"Module {module_idx + 1}: Title too long ({len(title)}/{MAX_TITLE_LENGTH})")
    
    # Validate lessons
    lessons = module.get("lessons", [])
    if not lessons or not isinstance(lessons, list):
        errors.append(f"Module {module_idx + 1}: Lessons are missing or invalid")
        return errors
    
    if len(lessons) > MAX_LESSONS_PER_MODULE:
        errors.append(f"Module {module_idx + 1}: Too many lessons ({len(lessons)}/{MAX_LESSONS_PER_MODULE})")
    
    for lesson_idx, lesson in enumerate(lessons):
        lesson_errors = validate_lesson(lesson, module_idx, lesson_idx)
        errors.extend(lesson_errors)
    
    return errors


def validate_lesson(lesson: Dict[str, Any], module_idx: int, lesson_idx: int) -> List[str]:
    """Validate a single lesson."""
    errors = []
    
    if not lesson or not isinstance(lesson, dict):
        errors.append(f"Module {module_idx + 1}, Lesson {lesson_idx + 1}: Invalid lesson structure")
        return errors
    
    # Validate lesson title
    title = lesson.get("title", "")
    if not title or not isinstance(title, str):
        errors.append(f"Module {module_idx + 1}, Lesson {lesson_idx + 1}: Title is missing")
    elif len(title) > MAX_TITLE_LENGTH:
        errors.append(f"Module {module_idx + 1}, Lesson {lesson_idx + 1}: Title too long")
    
    # Validate content blocks
    content = lesson.get("content", [])
    if content and isinstance(content, list):
        if len(content) > MAX_CONTENT_BLOCKS_PER_LESSON:
            errors.append(f"Module {module_idx + 1}, Lesson {lesson_idx + 1}: Too many content blocks ({len(content)}/{MAX_CONTENT_BLOCKS_PER_LESSON})")
        
        for block_idx, block in enumerate(content):
            block_errors = validate_content_block(block, module_idx, lesson_idx, block_idx)
            errors.extend(block_errors)
    
    return errors


def validate_content_block(block: Dict[str, Any], module_idx: int, lesson_idx: int, block_idx: int) -> List[str]:
    """Validate a single content block."""
    errors = []
    
    if not block or not isinstance(block, dict):
        errors.append(f"Module {module_idx + 1}, Lesson {lesson_idx + 1}, Block {block_idx + 1}: Invalid block structure")
        return errors
    
    block_type = block.get("type", "")
    valid_types = ["heading", "paragraph", "code", "list", "video", "image", "mcq", "link"]
    
    if block_type not in valid_types:
        errors.append(f"Module {module_idx + 1}, Lesson {lesson_idx + 1}, Block {block_idx + 1}: Invalid block type '{block_type}'")
    
    # Validate text content for text-based blocks
    if block_type in ["heading", "paragraph"]:
        text = block.get("text", "")
        if not text or not isinstance(text, str):
            errors.append(f"Module {module_idx + 1}, Lesson {lesson_idx + 1}, Block {block_idx + 1}: Missing text content")
        elif len(text) > MAX_TEXT_LENGTH:
            errors.append(f"Module {module_idx + 1}, Lesson {lesson_idx + 1}, Block {block_idx + 1}: Text too long ({len(text)}/{MAX_TEXT_LENGTH})")
    
    # Validate code blocks
    if block_type == "code":
        code = block.get("code", "")
        language = block.get("language", "text")
        if not isinstance(code, str):
            errors.append(f"Module {module_idx + 1}, Lesson {lesson_idx + 1}, Block {block_idx + 1}: Invalid code content")
        elif len(code) > MAX_TEXT_LENGTH * 2:  # Allow longer content for code
            errors.append(f"Module {module_idx + 1}, Lesson {lesson_idx + 1}, Block {block_idx + 1}: Code too long")
    
    # Validate MCQ blocks
    if block_type == "mcq":
        mcq_errors = validate_mcq_block(block, module_idx, lesson_idx, block_idx)
        errors.extend(mcq_errors)
    
    return errors


def validate_mcq_block(block: Dict[str, Any], module_idx: int, lesson_idx: int, block_idx: int) -> List[str]:
    """Validate an MCQ content block."""
    errors = []
    
    question = block.get("question", "")
    if not question or not isinstance(question, str):
        errors.append(f"Module {module_idx + 1}, Lesson {lesson_idx + 1}, Block {block_idx + 1}: MCQ question is missing")
    
    options = block.get("options", [])
    if not options or not isinstance(options, list) or len(options) < 2:
        errors.append(f"Module {module_idx + 1}, Lesson {lesson_idx + 1}, Block {block_idx + 1}: MCQ must have at least 2 options")
    
    correct_answer = block.get("correct_answer")
    if correct_answer is None:
        errors.append(f"Module {module_idx + 1}, Lesson {lesson_idx + 1}, Block {block_idx + 1}: MCQ correct answer is missing")
    
    explanation = block.get("explanation", "")
    if explanation and len(explanation) > MAX_TEXT_LENGTH:
        errors.append(f"Module {module_idx + 1}, Lesson {lesson_idx + 1}, Block {block_idx + 1}: MCQ explanation too long")
    
    return errors


def sanitize_course_data(course_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Sanitize course data by truncating long strings and removing invalid content.
    Returns a sanitized copy of the course data.
    """
    if not course_data:
        return {}
    
    sanitized = {}
    
    # Sanitize top-level fields
    sanitized["title"] = str(course_data.get("title", ""))[:MAX_TITLE_LENGTH]
    sanitized["description"] = str(course_data.get("description", ""))[:MAX_DESCRIPTION_LENGTH]
    sanitized["metadata"] = course_data.get("metadata", {})
    sanitized["tags"] = course_data.get("tags", [])
    
    # Sanitize modules
    modules = course_data.get("modules", [])
    sanitized["modules"] = []
    
    for module in modules[:MAX_MODULES]:
        sanitized_module = {
            "id": module.get("id", ""),
            "title": str(module.get("title", ""))[:MAX_TITLE_LENGTH],
            "description": str(module.get("description", ""))[:MAX_DESCRIPTION_LENGTH],
            "lessons": []
        }
        
        lessons = module.get("lessons", [])
        for lesson in lessons[:MAX_LESSONS_PER_MODULE]:
            sanitized_lesson = {
                "id": lesson.get("id", ""),
                "title": str(lesson.get("title", ""))[:MAX_TITLE_LENGTH],
                "objectives": lesson.get("objectives", [])[:10],  # Limit objectives
                "key_topics": lesson.get("key_topics", [])[:20],  # Limit topics
                "content": [],
                "resources": lesson.get("resources", [])[:10]  # Limit resources
            }
            
            # Sanitize content blocks
            content_blocks = lesson.get("content", [])
            for block in content_blocks[:MAX_CONTENT_BLOCKS_PER_LESSON]:
                sanitized_block = sanitize_content_block(block)
                sanitized_lesson["content"].append(sanitized_block)
            
            sanitized_module["lessons"].append(sanitized_lesson)
        
        sanitized["modules"].append(sanitized_module)
    
    return sanitized


def sanitize_content_block(block: Dict[str, Any]) -> Dict[str, Any]:
    """Sanitize a single content block."""
    if not block:
        return {"type": "paragraph", "text": ""}
    
    block_type = block.get("type", "paragraph")
    sanitized = {"type": block_type}
    
    if block_type in ["heading", "paragraph"]:
        sanitized["text"] = str(block.get("text", ""))[:MAX_TEXT_LENGTH]
    elif block_type == "code":
        sanitized["code"] = str(block.get("code", ""))[:MAX_TEXT_LENGTH * 2]
        sanitized["language"] = str(block.get("language", "text"))[:20]
    elif block_type == "video":
        sanitized["url"] = str(block.get("url", ""))[:500]
        sanitized["title"] = str(block.get("title", ""))[:MAX_TITLE_LENGTH]
    elif block_type == "mcq":
        sanitized["question"] = str(block.get("question", ""))[:MAX_TEXT_LENGTH]
        sanitized["options"] = [str(opt)[:MAX_TEXT_LENGTH] for opt in block.get("options", [])[:5]]
        sanitized["correct_answer"] = block.get("correct_answer", 0)
        sanitized["explanation"] = str(block.get("explanation", ""))[:MAX_TEXT_LENGTH]
    else:
        # For other block types, copy as-is but limit size
        for key, value in block.items():
            if isinstance(value, str):
                sanitized[key] = value[:MAX_TEXT_LENGTH]
            else:
                sanitized[key] = value
    
    return sanitized
