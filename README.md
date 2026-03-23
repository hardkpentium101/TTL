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
  - **YouTube Video Integration** - Fetches relevant educational videos
  - Interactive MCQs with explanations
  - Lists & External Links
- **Module Navigation**: Browse through modules and lessons
- **Responsive UI**: Works on desktop and mobile
- **PDF Export**: Download any lesson as a formatted PDF document
- **🔊 Audio Narration**: Text-to-speech in multiple languages (English, Hinglish, Hindi)

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
- [ ] Deployment (Render + Vercel)

## ✅ Completed Features

- [x] FastAPI Backend with course generation API
- [x] React + Vite Frontend with Tailwind CSS
- [x] Lesson renderer with multiple content block types
- [x] Interactive MCQs with feedback
- [x] Course/module/lesson navigation
- [x] PDF Export - Download lessons as formatted PDFs
- [x] YouTube Integration - Search and embed educational videos
- [x] **Multilingual TTS** - Audio narration in English, Hinglish, and Hindi

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

## 🔑 API Key Setup

### YouTube Data API (for video integration)
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable **YouTube Data API v3**
4. Go to **Credentials** → **Create Credentials** → **API Key**
5. Copy the API key to `server/.env`:
   ```
   YOUTUBE_API_KEY=your_api_key_here
   ```
6. (Optional) Restrict the API key to YouTube Data API only

**Note:** Without an API key, the app shows demo/placeholder videos.

### Google Cloud TTS & Translation (for audio narration)
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Enable these APIs:
   - **Cloud Text-to-Speech API**
   - **Cloud Translation API**
3. Go to **Credentials** → **Create Credentials** → **API Key**
4. Copy the API key to `server/.env`:
   ```
   GEMINI_API_KEY=your_api_key_here
   ```

**Note:** Without an API key, the app uses browser's built-in text-to-speech (lower quality).

### AI APIs (for future course generation)
- **Google Gemini**: Get key from [Google AI Studio](https://makersuite.google.com/app/apikey)
- **OpenAI**: Get key from [OpenAI Platform](https://platform.openai.com/api-keys)
