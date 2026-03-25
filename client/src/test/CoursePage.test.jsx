import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

const coursePagePath = path.join(process.cwd(), 'src/pages/CoursePage.jsx')
const coursePageContent = fs.readFileSync(coursePagePath, 'utf-8')

describe('CoursePage Responsive Layout', () => {
  describe('Layout Structure', () => {
    it('should have sidebar with responsive visibility', () => {
      expect(coursePageContent).toContain('hidden lg:block')
    })

    it('should have fixed sidebar width on desktop', () => {
      expect(coursePageContent).toContain('w-80')
    })

    it('should have main content with flex layout', () => {
      expect(coursePageContent).toContain('flex gap-8')
    })

    it('should have flexible main content area', () => {
      expect(coursePageContent).toContain('flex-1')
    })
  })

  describe('Module Navigation', () => {
    it('should have sticky sidebar on desktop', () => {
      expect(coursePageContent).toContain('sticky top-8')
    })

    it('should have module selection buttons', () => {
      expect(coursePageContent).toContain('selectedModule')
    })

    it('should have lesson selection state', () => {
      expect(coursePageContent).toContain('selectedLesson')
    })
  })

  describe('Content Sections', () => {
    it('should have lesson content rendering', () => {
      expect(coursePageContent).toContain('LessonRenderer')
    })

    it('should have PDF export capability', () => {
      expect(coursePageContent).toContain('LessonPDFExporter')
    })

    it('should have audio player', () => {
      expect(coursePageContent).toContain('LessonAudioPlayer')
    })
  })

  describe('Hero Header', () => {
    it('should have gradient background', () => {
      expect(coursePageContent).toContain('bg-gradient-warm')
    })

    it('should have breadcrumb navigation', () => {
      expect(coursePageContent).toContain('Back to Home')
    })

    it('should display course title', () => {
      expect(coursePageContent).toContain('course.title')
    })
  })
})
