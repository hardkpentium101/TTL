import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

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
