import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

// Read the CoursePage file and check for layout classes
const coursePagePath = path.join(process.cwd(), 'src/pages/CoursePage.jsx')
const coursePageContent = fs.readFileSync(coursePagePath, 'utf-8')

describe('CoursePage Responsive Layout', () => {
  describe('Mobile Layout (stacked vertically)', () => {
    it('should use block layout on mobile (not flex-row)', () => {
      // Mobile should use block (vertical stack), not flex-row
      expect(coursePageContent).toContain('block md:flex')
    })

    it('should have modules full width on mobile', () => {
      // Modules should be w-full on mobile (stacked)
      expect(coursePageContent).toContain('w-full')
    })

    it('should have no inline-block layout on mobile', () => {
      // Should not have inline or flex-row for mobile-first
      expect(coursePageContent).not.toContain('flex-row')
    })
  })

  describe('Desktop Layout Classes', () => {
    it('should have md:flex class for desktop side-by-side', () => {
      expect(coursePageContent).toContain('md:flex')
    })

    it('should have scrollable container with max-h', () => {
      expect(coursePageContent).toContain('md:max-h-[calc(100vh-200px)]')
    })

    it('should have w-1/4 for modules on desktop', () => {
      expect(coursePageContent).toContain('md:w-1/4')
    })

    it('should have w-3/4 for lesson content on desktop', () => {
      expect(coursePageContent).toContain('md:w-3/4')
    })
  })

  describe('Header Spacing', () => {
    it('should have reduced spacer height (h-36)', () => {
      expect(coursePageContent).toContain('h-36')
    })
  })

  describe('Mobile vs Desktop Alignment', () => {
    it('should have block (vertical) on mobile, flex (horizontal) on desktop', () => {
      // This ensures stacked on mobile, side-by-side on desktop
      expect(coursePageContent).toMatch(/block\s+md:flex/)
    })
  })
})
