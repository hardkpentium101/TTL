import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import Home from '../pages/Home'
import CoursePage from '../pages/CoursePage'
import Sidebar from '../components/Sidebar'

vi.mock('@auth0/auth0-react', () => ({
  useAuth0: () => ({
    isAuthenticated: false,
    isLoading: false,
    user: null,
    loginWithRedirect: vi.fn(),
    logout: vi.fn(),
    getAccessTokenSilently: vi.fn().mockResolvedValue('mock-token'),
    getAccessTokenWithPopup: vi.fn().mockResolvedValue('mock-token'),
  }),
  Auth0Provider: ({ children }) => children,
}))

const mockNavigate = vi.fn()
let mockLocationState = null

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ state: mockLocationState }),
  }
})

const mockGenerateCourseAsync = vi.fn()
const mockWaitForCourse = vi.fn()
const mockGetCourseById = vi.fn()
const mockGetUserCourses = vi.fn().mockResolvedValue({ courses: [] })
const mockGetCourseStatus = vi.fn()
const mockGetCourseResult = vi.fn()

vi.mock('../utils/api', () => ({
  generateCourseAsync: (...args) => mockGenerateCourseAsync(...args),
  waitForCourse: (...args) => mockWaitForCourse(...args),
  getCourseById: (...args) => mockGetCourseById(...args),
  getUserCourses: (...args) => mockGetUserCourses(...args),
  getOrCreateUser: vi.fn().mockResolvedValue({ user: { id: '1', name: 'Test User' } }),
  getCourseStatus: (...args) => mockGetCourseStatus(...args),
  getCourseResult: (...args) => mockGetCourseResult(...args),
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

vi.mock('../events', () => ({
  refreshCoursesEvent: {
    dispatchEvent: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  },
}))

const mockCourseData = {
  title: 'Test Course',
  description: 'A test course description',
  metadata: {
    level: 'Beginner',
    estimated_duration: '2 hours',
    prerequisites: ['Basic knowledge'],
  },
  modules: [
    {
      id: 'module-1',
      title: 'Intro Module',
      description: 'Getting started',
      lessons: [
        {
          id: 'lesson-1',
          title: 'First Lesson',
          objectives: ['Learn basics'],
          key_topics: ['Topic One', 'Topic Two'],
          content: [
            { type: 'heading', text: 'Welcome' },
            { type: 'paragraph', text: 'This is a test paragraph.' },
            { type: 'list', items: ['Item 1', 'Item 2'] },
          ],
          resources: [{ title: 'Resource', url: 'https://example.com' }],
        },
      ],
    },
    {
      id: 'module-2',
      title: 'Advanced Module',
      description: 'Going deeper',
      lessons: [
        {
          id: 'lesson-2',
          title: 'Second Lesson',
          objectives: ['Go advanced'],
          key_topics: ['Advanced Topic'],
          content: [
            { type: 'heading', text: 'Advanced Content' },
            { type: 'paragraph', text: 'Advanced paragraph.' },
          ],
          resources: [],
        },
      ],
    },
  ],
}

const wrapper = ({ children }) => (
  <BrowserRouter>
    {children}
  </BrowserRouter>
)

describe('Home Page - Course Generation Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockNavigate.mockReset()
    mockLocationState = null
    // Clear localStorage to prevent state leakage between tests
    localStorage.removeItem('ttl_generation_state')
  })

  it('should render the home page with topic input', () => {
    render(<Home />, { wrapper })
    
    expect(screen.getByPlaceholderText(/what do you want to learn/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /generate course/i })).toBeInTheDocument()
  })

  it('should show example topics', () => {
    render(<Home />, { wrapper })
    
    expect(screen.getByText('Machine Learning')).toBeInTheDocument()
    expect(screen.getByText('Quantum Computing')).toBeInTheDocument()
  })

  it('should update topic state when user types', async () => {
    const user = userEvent.setup()
    render(<Home />, { wrapper })
    
    const textarea = screen.getByPlaceholderText(/what do you want to learn/i)
    await user.type(textarea, 'Python Programming')
    
    expect(textarea).toHaveValue('Python Programming')
  })

  it('should fill topic when clicking example suggestion', async () => {
    const user = userEvent.setup()
    render(<Home />, { wrapper })
    
    await user.click(screen.getByText('Machine Learning'))
    
    const textarea = screen.getByPlaceholderText(/what do you want to learn/i)
    expect(textarea).toHaveValue('Machine Learning')
  })

  it('should disable submit button when topic is empty', () => {
    render(<Home />, { wrapper })
    
    const submitButton = screen.getByRole('button', { name: /generate course/i })
    expect(submitButton).toBeDisabled()
  })

  it('should enable submit button when topic has content', async () => {
    const user = userEvent.setup()
    render(<Home />, { wrapper })
    
    const textarea = screen.getByPlaceholderText(/what do you want to learn/i)
    await user.type(textarea, 'Testing')
    
    const submitButton = screen.getByRole('button', { name: /generate course/i })
    expect(submitButton).not.toBeDisabled()
  })

  it('should start course generation when form is submitted', async () => {
    const user = userEvent.setup()
    render(<Home />, { wrapper })
    
    mockGenerateCourseAsync.mockResolvedValue({ job_id: 'test-job-123' })
    mockWaitForCourse.mockResolvedValue({ course: mockCourseData })
    
    const textarea = screen.getByPlaceholderText(/what do you want to learn/i)
    await user.type(textarea, 'Testing')
    
    await user.click(screen.getByRole('button', { name: /generate course/i }))
    
    await waitFor(() => {
      expect(mockGenerateCourseAsync).toHaveBeenCalledWith('Testing')
    })
  })

  it('should show progress during course generation', async () => {
    const user = userEvent.setup()
    render(<Home />, { wrapper })

    mockGenerateCourseAsync.mockResolvedValue({ job_id: 'test-job-123' })
    mockGetCourseStatus.mockResolvedValue({ status: 'running', progress: 50, message: 'Generating...' })

    const textarea = screen.getByPlaceholderText(/what do you want to learn/i)
    await user.type(textarea, 'Testing')
    await user.click(screen.getByRole('button', { name: /generate course/i }))

    await waitFor(() => {
      expect(screen.getByText(/course generation/i)).toBeInTheDocument()
    })
  })

  it('should show error message on generation failure', async () => {
    const user = userEvent.setup()
    render(<Home />, { wrapper })
    
    mockGenerateCourseAsync.mockRejectedValue(new Error('Server error'))
    
    const textarea = screen.getByPlaceholderText(/what do you want to learn/i)
    await user.type(textarea, 'Testing')
    await user.click(screen.getByRole('button', { name: /generate course/i }))
    
    await waitFor(() => {
      expect(screen.getByText(/server error/i)).toBeInTheDocument()
    })
  })
})

describe('Course Page - Lesson Navigation Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockNavigate.mockReset()
    mockLocationState = { course: mockCourseData }
  })

  it('should render course page with course data from state', () => {
    render(<CoursePage />, { wrapper })
    
    expect(screen.getAllByText('Test Course').length).toBeGreaterThan(0)
    expect(screen.getAllByText('First Lesson').length).toBeGreaterThan(0)
  })

  it('should display course metadata', () => {
    render(<CoursePage />, { wrapper })
    
    expect(screen.getByText('Beginner')).toBeInTheDocument()
    expect(screen.getByText('2 hours')).toBeInTheDocument()
  })

  it('should display lesson content', () => {
    render(<CoursePage />, { wrapper })
    
    expect(screen.getAllByText('Welcome').length).toBeGreaterThan(0)
    expect(screen.getAllByText('This is a test paragraph.').length).toBeGreaterThan(0)
  })

  it('should display learning objectives', () => {
    render(<CoursePage />, { wrapper })
    
    expect(screen.getAllByText('Learning Objectives').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Learn basics').length).toBeGreaterThan(0)
  })

  it('should display key topics', () => {
    render(<CoursePage />, { wrapper })
    
    expect(screen.getByText('Key Topics')).toBeInTheDocument()
    expect(screen.getByText('Topic One')).toBeInTheDocument()
  })

  it('should navigate to next lesson', async () => {
    render(<CoursePage />, { wrapper })
    
    const nextButtons = screen.getAllByRole('button', { name: /next lesson/i })
    await act(async () => {
      fireEvent.click(nextButtons[0])
    })
    
    await waitFor(() => {
      expect(screen.getAllByText('Second Lesson').length).toBeGreaterThan(0)
    })
  })

  it('should show back to home button', () => {
    render(<CoursePage />, { wrapper })
    
    expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument()
  })

  it('should navigate back home when back button clicked', async () => {
    render(<CoursePage />, { wrapper })
    
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /back/i }))
    })
    
    expect(mockNavigate).toHaveBeenCalledWith('/')
  })

  it('should display module navigation', () => {
    render(<CoursePage />, { wrapper })
    
    expect(screen.getByText('Intro Module')).toBeInTheDocument()
    expect(screen.getByText('Advanced Module')).toBeInTheDocument()
  })
})

describe('Sidebar Navigation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render sidebar with navigation items', () => {
    render(<Sidebar />, { wrapper })

    // Nav items exist as links with hrefs
    const homeLink = document.querySelector('aside nav a[href="/"]')
    const coursesLink = document.querySelector('aside nav a[href="/my-courses"]')
    expect(homeLink).toBeInTheDocument()
    expect(coursesLink).toBeInTheDocument()
  })

  it('should display app icon', () => {
    render(<Sidebar />, { wrapper })

    expect(document.querySelector('[data-app-icon="true"]')).toBeInTheDocument()
  })

  it('should show sign in button when sidebar is visible', () => {
    render(<Sidebar />, { wrapper })

    // Sign in icon should be visible in collapsed state
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })
})

describe('Error States', () => {
  it('should handle empty course data', () => {
    mockLocationState = { course: null }
    
    render(<CoursePage />, { wrapper })
    
    expect(screen.getByText(/course not found/i)).toBeInTheDocument()
  })

  it('should handle malformed course data', () => {
    mockLocationState = { course: { title: 'Bad Course' } }
    
    render(<CoursePage />, { wrapper })
    
    expect(screen.getByText(/invalid/i)).toBeInTheDocument()
  })
})

describe('Responsive Layout', () => {
  it('should have proper container structure', () => {
    render(<Home />, { wrapper })
    
    const container = document.querySelector('.min-h-screen')
    expect(container).toBeInTheDocument()
  })
})
