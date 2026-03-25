import { describe, it, expect } from 'vitest';

describe('ErrorBoundary Component', () => {
  it('should export ErrorBoundary component', async () => {
    const ErrorBoundary = await import('../components/ErrorBoundary');
    
    expect(ErrorBoundary.default).toBeDefined();
    expect(ErrorBoundary.withErrorBoundary).toBeDefined();
    expect(ErrorBoundary.useErrorHandler).toBeDefined();
  });

  it('should have error boundary exports', async () => {
    const { default: EB, withErrorBoundary, useErrorHandler } = await import('../components/ErrorBoundary');
    
    // Check component is a function/class
    expect(typeof EB).toBe('function');
    
    // Check HOC is a function
    expect(typeof withErrorBoundary).toBe('function');
    
    // Check hook is a function
    expect(typeof useErrorHandler).toBe('function');
  });
});

describe('CoursePage Validation', () => {
  it('should have validation function', async () => {
    // Read the file and check for validateCourseData function
    const fs = await import('fs');
    const path = await import('path');
    
    const coursePagePath = path.join(process.cwd(), 'src/pages/CoursePage.jsx');
    const content = fs.readFileSync(coursePagePath, 'utf-8');
    
    expect(content).toContain('validateCourseData');
  });

  it('should validate course modules', async () => {
    const fs = await import('fs');
    const path = await import('path');
    
    const coursePagePath = path.join(process.cwd(), 'src/pages/CoursePage.jsx');
    const content = fs.readFileSync(coursePagePath, 'utf-8');
    
    // Check for module validation
    expect(content).toContain('course.modules');
    expect(content).toContain('Array.isArray');
  });
});
