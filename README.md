# Text-to-Learn: AI-Powered Course Generator

A simple fullstack application that transforms any topic into a structured, multi-module online course.

## 🚀 Quick Start

### Backend (FastAPI)

```bash
cd server

# Create virtual environment (optional but recommended)
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the server
python main.py
# or
uvicorn main:app --reload --host 0.0.0.0 --port 5000
```

Backend will run on: `http://localhost:5000`

### Frontend (React + Vite)

```bash
cd client

# Install dependencies
npm install

# Run development server
npm run dev
```

Frontend will run on: `http://localhost:5173`

## 📁 Project Structure

```
hackathon/
├── server/                 # FastAPI Backend
│   ├── main.py            # Main application & API routes
│   ├── requirements.txt   # Python dependencies
│   └── .env.example       # Environment variables template
├── client/                # React Frontend
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   │   ├── blocks/    # Lesson content block components
│   │   │   └── LessonRenderer.jsx
│   │   ├── pages/         # Page components
│   │   │   ├── Home.jsx
│   │   │   └── CoursePage.jsx
│   │   ├── utils/         # API utilities
│   │   ├── App.jsx        # Main app with routing
│   │   └── main.jsx       # Entry point
│   └── package.json
└── README.md
```

## 🎯 Features (MVP)

- **Prompt to Course**: Enter any topic and get a structured course
- **Rich Lesson Content**: 
  - Headings & Paragraphs
  - Code blocks with syntax highlighting
  - Video placeholders (YouTube API integration ready)
  - Interactive MCQs with explanations
  - Lists & External Links
- **Module Navigation**: Browse through modules and lessons
- **Responsive UI**: Works on desktop and mobile
- **PDF Export**: Download any lesson as a formatted PDF document

## 🔧 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Health check |
| GET | `/api/health` | API health status |
| POST | `/api/generate-course` | Generate course from topic |

### Example Request

```bash
curl -X POST http://localhost:5000/api/generate-course \
  -H "Content-Type: application/json" \
  -d '{"topic": "React Hooks"}'
```

## 🚧 Future Enhancements (from Roadmap)

- [ ] AI Integration (Gemini/OpenAI) for real course generation
- [ ] Auth0 Authentication
- [ ] MongoDB Database for persistence
- [ ] YouTube API for video embedding
- [ ] Multilingual Support (Hinglish TTS)
- [ ] Deployment (Render + Vercel)

## ✅ Completed Features

- [x] FastAPI Backend with course generation API
- [x] React + Vite Frontend with Tailwind CSS
- [x] Lesson Renderer with multiple content block types
- [x] Interactive MCQs with feedback
- [x] Course/module/lesson navigation
- [x] **PDF Export** - Download lessons as formatted PDFs

## 🛠 Tech Stack

**Frontend:**
- React 18 with Vite
- React Router DOM
- Tailwind CSS
- Axios

**Backend:**
- FastAPI
- Uvicorn
- Pydantic

## 📝 Notes

This is a **simplified MVP** to test the core functionality:
- Currently uses **mock data** for course generation
- Replace `generate_mock_course()` in `server/main.py` with actual AI API calls
- Add your API keys in `.env` file (see `.env.example`)
