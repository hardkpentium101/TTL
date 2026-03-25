import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Maximum retry attempts for failed requests
const MAX_RETRIES = 3;
// Retry delay in milliseconds
const RETRY_DELAY = 1000;

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout
});

// Add auth token interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth0_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    console.log('[API] No token found in localStorage for request:', config.url);
  }
  return config;
});

// Retry logic for failed requests
const shouldRetry = (error) => {
  // Don't retry on client errors (4xx) except 408 (timeout)
  if (error.response?.status && error.response.status >= 400 && error.response.status < 500) {
    return error.response.status === 408;
  }
  // Retry on network errors or server errors (5xx)
  return true;
};

// Handle response errors with retry logic
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;

    // Check if we should retry
    if (shouldRetry(error) && !config.__retryCount && config.__retryCount !== MAX_RETRIES) {
      config.__retryCount = (config.__retryCount || 0) + 1;

      if (config.__retryCount <= MAX_RETRIES) {
        console.log(`[API] Retry attempt ${config.__retryCount}/${MAX_RETRIES} for ${config.url}`);

        // Wait before retrying (exponential backoff)
        const delay = RETRY_DELAY * Math.pow(2, config.__retryCount - 1);
        await new Promise(resolve => setTimeout(resolve, delay));

        return api(config);
      }
    }

    // Handle 401 errors (token expired)
    if (error.response?.status === 401) {
      // Token expired, clear it
      localStorage.removeItem('auth0_token');
      console.warn('[API] Authentication failed - token cleared');
    }

    // Enhance error message for network issues
    if (!error.response && error.code === 'ECONNREFUSED') {
      error.message = 'Server is offline. Please check your connection.';
    } else if (!error.response && error.code === 'NETWORK_ERROR') {
      error.message = 'Network error. Please check your internet connection.';
    } else if (error.code === 'ECONNABORTED') {
      error.message = 'Request timeout. The server took too long to respond.';
    }

    return Promise.reject(error);
  }
);

// ============= Auth Endpoints =============

export const getOrCreateUser = async () => {
  console.log('API: Calling /api/auth/user');
  const response = await api.post('/api/auth/user');
  console.log('API: Response from /api/auth/user:', response.data);
  return response.data;
};

// ============= Course Endpoints =============

// Get user's courses list
export const getUserCourses = async () => {
  const response = await api.get('/api/user/courses');
  return response.data;
};

// Get specific course by ID (with full content)
export const getUserCourse = async (courseId) => {
  const response = await api.get(`/api/user/courses/${courseId}`);
  return response.data;
};

// Get any course by ID (public access)
export const getCourseById = async (courseId) => {
  const response = await api.get(`/api/courses/${courseId}`);
  return response.data;
};

// Delete user's course
export const deleteCourse = async (courseId) => {
  const response = await api.delete(`/api/user/courses/${courseId}`);
  return response.data;
};

// Synchronous course generation (blocks until complete)
export const generateCourse = async (topic) => {
  const response = await api.post('/api/generate-course', { topic });
  return response.data;
};

// Async course generation (non-blocking, returns job_id)
export const generateCourseAsync = async (topic, level = 'Beginner') => {
  const response = await api.post('/api/generate-course-async', { topic, level });
  return response.data;
};

// Get task status
export const getCourseStatus = async (jobId) => {
  const response = await api.get(`/api/course-status/${jobId}`);
  return response.data;
};

// Get course result when completed
export const getCourseResult = async (jobId) => {
  const response = await api.get(`/api/course-result/${jobId}`);
  return response.data;
};

// Poll for completion
export const waitForCourse = async (jobId, onProgress = null, interval = 2000) => {
  return new Promise((resolve, reject) => {
    const poll = async () => {
      try {
        const status = await getCourseStatus(jobId);

        if (onProgress) {
          onProgress(status);
        }

        if (status.status === 'completed') {
          const result = await getCourseResult(jobId);
          resolve(result.data);
        } else if (status.status === 'failed') {
          reject(new Error(status.message || 'Course generation failed'));
        } else {
          // Still running, poll again
          setTimeout(poll, interval);
        }
      } catch (error) {
        reject(error);
      }
    };

    poll();
  });
};

export const checkHealth = async () => {
  const response = await api.get('/api/health');
  return response.data;
};
