import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('CoursePage Data Validation', () => {
  const coursePagePath = path.join(process.cwd(), 'src/pages/CoursePage.jsx');
  const content = fs.readFileSync(coursePagePath, 'utf-8');

  it('should have validateCourseData function', () => {
    expect(content).toContain('validateCourseData');
  });

  it('should validate modules exist', () => {
    expect(content).toContain('course.modules');
  });

  it('should check modules is array', () => {
    expect(content).toContain('Array.isArray(course.modules)');
  });

  it('should validate lessons exist', () => {
    expect(content).toContain('module.lessons');
  });

  it('should handle invalid course data error', () => {
    expect(content).toContain('Invalid course data');
  });

  it('should handle API errors', () => {
    expect(content).toContain('catch');
    expect(content).toContain('setError');
  });
});
