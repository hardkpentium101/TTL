# Text-to-Learn API

Backend API for the Text-to-Learn AI Course Generator.

## Setup

### 1. Install Dependencies
```bash
cd server
source venv/bin/activate  # or create new venv
pip install -r requirements.txt
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` and update:

```env
# MongoDB (required)
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/text-to-learn

# Auth0 (optional - mock auth used if not configured)
AUTH0_DOMAIN=your-auth0-domain.auth0.com
AUTH0_AUDIENCE=https://text-to-learn-api

# API Keys
GEMINI_API_KEY=your_gemini_key
OPENROUTER_API_KEY=your_openrouter_key
YOUTUBE_API_KEY=your_youtube_key
```

### 3. Run Server
```bash
python -m uvicorn main:app --host 0.0.0.0 --port 5001 --reload
```

## API Endpoints

### Authentication
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/user` | Required | Get/create user from Auth0 token |

### Courses
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/user/courses` | Required | Get user's courses list |
| GET | `/api/user/courses/:id` | Required | Get user's course (full content) |
| DELETE | `/api/user/courses/:id` | Required | Delete user's course |
| GET | `/api/courses/:id` | Optional | Get any course (public read) |
| POST | `/api/generate-course` | Required | Generate & save course |
| POST | `/api/generate-course-async` | Required | Async course generation |
| GET | `/api/course-status/:job_id` | Optional | Get async job status |
| GET | `/api/course-result/:job_id` | Optional | Get async job result |

### YouTube
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/youtube/search?q=query` | Optional | Search YouTube videos |
| GET | `/api/youtube/embed/:video_id` | Optional | Get YouTube embed URL |

### Other
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/health` | None | Health check |
| GET | `/` | None | API info |

## Mock Auth Mode

If `AUTH0_DOMAIN` is not set or is `your-auth0-domain.auth0.com`, the API runs in **mock auth mode**:
- Any Bearer token is accepted
- Returns mock user: `dev|user123`
- Useful for local development without Auth0

## Database Schema

### Course Document
```javascript
{
  _id: ObjectId,
  title: "Python Basics",
  description: "Learn Python...",
  creator: "auth0|user123",  // Auth0 sub
  modules: [                 // Embedded
    {
      id: "...",
      title: "Module 1",
      description: "...",
      lessons: [             // Embedded
        {
          id: "...",
          title: "Lesson 1",
          objectives: [...],
          key_topics: [...],
          content: [         // Content blocks
            { type: "heading", text: "..." },
            { type: "paragraph", text: "..." },
            { type: "code", language: "python", text: "..." },
            { type: "video", query: "..." },
            { type: "mcq", question: "...", options: [...], answer: 1 }
          ],
          resources: [...]
        }
      ]
    }
  ],
  tags: ["python"],
  is_published: true,
  created_at: ISODate,
  updated_at: ISODate
}
```

## Testing

### Test Auth Endpoint
```bash
curl -X POST http://localhost:5001/api/auth/user \
  -H "Authorization: Bearer any-token"
```

### Test Course Generation
```bash
curl -X POST http://localhost:5001/api/generate-course \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer token" \
  -d '{"topic": "React Hooks"}'
```

### Test Get Course by ID
```bash
curl http://localhost:5001/api/courses/:id
```

### Test User Courses
```bash
curl http://localhost:5001/api/user/courses \
  -H "Authorization: Bearer token"
```
