"""
Text-to-Learn: AI-Powered Course Generator
FastAPI Backend
"""
from fastapi import FastAPI, HTTPException, Query, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from dotenv import load_dotenv
import os
import httpx
import base64
import json
import asyncio

load_dotenv()

# ============= Lifespan Events =============
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events"""
    # Startup
    print("🚀 Starting Text-to-Learn API...")
    
    # Initialize database connection
    from config.database import connect_to_database
    db_connected = await connect_to_database()
    
    if not db_connected:
        print("⚠️  Database not connected - running in mock mode")
    
    yield
    
    # Shutdown
    print("👋 Shutting down Text-to-Learn API...")
    from config.database import close_database_connection
    await close_database_connection()


app = FastAPI(title="Text-to-Learn API", lifespan=lifespan)

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============= API Routes =============
# Import and register route modules
from routes.courses import router as courses_router

app.include_router(courses_router)

# ============= Existing Code =============
# YouTube API Key (get from https://console.cloud.google.com/)
YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY", "")

# Google Gemini API Key for TTS and Course Generation
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

# Initialize Google GenAI client if API key exists
genai_client = None
if GEMINI_API_KEY:
    try:
        from google import genai
        genai_client = genai.Client(api_key=GEMINI_API_KEY)
        print("✓ GenAI client initialized")
    except Exception as e:
        print(f"Warning: Could not initialize GenAI client: {e}")

# Initialize LLM Manager
from llm_manager import LLMManager
llm = LLMManager()

# Initialize Task Queue
from task_queue import task_queue, generate_course_async


def generate_mock_course(topic: str) -> dict:
    """Generate a mock course structure for testing."""
    return {
        "course": {
            "title": f"Beginner's Guide to {topic}",
            "description": f"An introductory course that explores the fundamental concepts behind {topic}. This course simplifies complex principles into beginner-friendly lessons.",
            "metadata": {
                "level": "Beginner",
                "estimated_duration": "6-8 weeks",
                "prerequisites": [
                    "Basic high school knowledge",
                    "Curiosity about the subject",
                    "Willingness to learn"
                ]
            },
            "modules": [
                {
                    "id": "module-1",
                    "title": f"Introduction to {topic}",
                    "description": f"Understand what {topic} is and the fundamental principles.",
                    "lessons": [
                        {
                            "id": "lesson-1",
                            "title": f"What is {topic}?",
                            "objectives": [
                                f"Define {topic}",
                                "Understand its purpose",
                                "Identify different applications"
                            ],
                            "key_topics": [
                                f"Definition of {topic}",
                                "Types and categories",
                                "Real-world applications",
                                "History and evolution"
                            ],
                            "content": [
                                {
                                    "type": "heading",
                                    "text": f"Understanding {topic}"
                                },
                                {
                                    "type": "paragraph",
                                    "text": f"{topic} is a fascinating field that encompasses various concepts and applications. It plays a crucial role in modern technology and everyday life."
                                },
                                {
                                    "type": "list",
                                    "items": [
                                        "Core concepts",
                                        "Practical applications",
                                        "Industry standards",
                                        "Future trends"
                                    ]
                                },
                                {
                                    "type": "code",
                                    "language": "python",
                                    "text": f"# Example: Getting started with {topic}\ndef introduction():\n    print('Welcome to {topic}!')\n    return 'Let us begin learning'\n\nintroduction()"
                                },
                                {
                                    "type": "video",
                                    "query": f"{topic} basics explained for beginners"
                                },
                                {
                                    "type": "mcq",
                                    "question": f"What is the primary purpose of studying {topic}?",
                                    "options": [
                                        "To memorize facts",
                                        "To understand and apply concepts",
                                        "To pass exams only",
                                        "None of the above"
                                    ],
                                    "answer": 1,
                                    "explanation": f"Studying {topic} helps you understand fundamental concepts and apply them to real-world scenarios."
                                }
                            ],
                            "resources": [
                                {
                                    "title": f"Introduction to {topic}",
                                    "url": "https://en.wikipedia.org/wiki/" + topic.replace(" ", "_")
                                }
                            ]
                        },
                        {
                            "id": "lesson-2",
                            "title": "History and Evolution",
                            "objectives": [
                                "Learn key milestones",
                                "Understand how it developed",
                                "Recognize major breakthroughs"
                            ],
                            "key_topics": [
                                "Early beginnings",
                                "Major developments",
                                "Modern applications",
                                "Future directions"
                            ],
                            "content": [
                                {
                                    "type": "heading",
                                    "text": "Historical Background"
                                },
                                {
                                    "type": "paragraph",
                                    "text": "The journey of this field spans decades of innovation and discovery. From early concepts to modern applications, let us explore how we got here."
                                },
                                {
                                    "type": "list",
                                    "items": [
                                        "Early pioneers",
                                        "Key inventions",
                                        "Technological breakthroughs",
                                        "Current state"
                                    ]
                                },
                                {
                                    "type": "mcq",
                                    "question": "When did this field gain significant momentum?",
                                    "options": ["1950s", "1980s", "2000s", "2020s"],
                                    "answer": 1,
                                    "explanation": "The 1980s saw significant advancements that propelled this field forward."
                                }
                            ],
                            "resources": [
                                {
                                    "title": "History Timeline",
                                    "url": "https://en.wikipedia.org/wiki/History"
                                }
                            ]
                        },
                        {
                            "id": "lesson-3",
                            "title": "Core Fundamentals",
                            "objectives": [
                                "Master basic principles",
                                "Understand key terminology",
                                "Apply foundational concepts"
                            ],
                            "key_topics": [
                                "Basic principles",
                                "Key terminology",
                                "Fundamental laws",
                                "Core methodologies"
                            ],
                            "content": [
                                {
                                    "type": "heading",
                                    "text": "Building the Foundation"
                                },
                                {
                                    "type": "paragraph",
                                    "text": "Understanding these core principles is essential for mastering the subject. Let us break down the most important aspects."
                                },
                                {
                                    "type": "code",
                                    "language": "javascript",
                                    "text": "// Core concept example\nconst fundamentals = {\n  principle: 'Understand first',\n  practice: 'Then apply',\n  master: function() {\n    return 'Continuous learning';\n  }\n};\n\nconsole.log(fundamentals.master());"
                                },
                                {
                                    "type": "video",
                                    "query": f"core fundamentals of {topic}"
                                },
                                {
                                    "type": "mcq",
                                    "question": "What is the most important step in learning fundamentals?",
                                    "options": [
                                        "Skipping to advanced topics",
                                        "Understanding concepts thoroughly",
                                        "Memorizing without practice",
                                        "Watching only videos"
                                    ],
                                    "answer": 1,
                                    "explanation": "Understanding concepts thoroughly builds a strong foundation for advanced learning."
                                }
                            ],
                            "resources": [
                                {
                                    "title": "Fundamentals Guide",
                                    "url": "https://www.khanacademy.org/"
                                }
                            ]
                        }
                    ]
                },
                {
                    "id": "module-2",
                    "title": "Practical Applications",
                    "description": "Learn how to apply theoretical knowledge in real-world scenarios.",
                    "lessons": [
                        {
                            "id": "lesson-4",
                            "title": "Hands-On Practice",
                            "objectives": [
                                "Apply theoretical knowledge",
                                "Build practical projects",
                                "Solve real problems"
                            ],
                            "key_topics": [
                                "Project-based learning",
                                "Problem-solving techniques",
                                "Best practices",
                                "Common patterns"
                            ],
                            "content": [
                                {
                                    "type": "heading",
                                    "text": "Learning by Doing"
                                },
                                {
                                    "type": "paragraph",
                                    "text": "The best way to master any skill is through hands-on practice. Let us work through some practical examples."
                                },
                                {
                                    "type": "code",
                                    "language": "python",
                                    "text": "# Practical example\ndef solve_problem(input_data):\n    '''\n    Solve a real-world problem\n    Args:\n        input_data: The problem input\n    Returns:\n        Solution output\n    '''\n    # Step 1: Analyze\n    analysis = input_data\n    \n    # Step 2: Process\n    result = analysis\n    \n    # Step 3: Return solution\n    return result\n\nprint(solve_problem('Practice data'))"
                                },
                                {
                                    "type": "list",
                                    "items": [
                                        "Start with simple projects",
                                        "Gradually increase complexity",
                                        "Learn from mistakes",
                                        "Seek feedback"
                                    ]
                                },
                                {
                                    "type": "mcq",
                                    "question": "What is the best approach to learning practical skills?",
                                    "options": [
                                        "Only reading theory",
                                        "Watching others do it",
                                        "Hands-on practice with projects",
                                        "Skipping practice entirely"
                                    ],
                                    "answer": 2,
                                    "explanation": "Hands-on practice with projects is the most effective way to learn practical skills."
                                }
                            ],
                            "resources": [
                                {
                                    "title": "Practice Projects",
                                    "url": "https://github.com/"
                                }
                            ]
                        },
                        {
                            "id": "lesson-5",
                            "title": "Best Practices and Patterns",
                            "objectives": [
                                "Learn industry standards",
                                "Avoid common pitfalls",
                                "Write quality solutions"
                            ],
                            "key_topics": [
                                "Industry standards",
                                "Common patterns",
                                "Anti-patterns to avoid",
                                "Quality assurance"
                            ],
                            "content": [
                                {
                                    "type": "heading",
                                    "text": "Professional Standards"
                                },
                                {
                                    "type": "paragraph",
                                    "text": "Following established best practices ensures quality, maintainability, and efficiency in your work."
                                },
                                {
                                    "type": "code",
                                    "language": "python",
                                    "text": "# Best practice example\ndef well_documented_function(param1, param2):\n    '''\n    A well-documented function example.\n    \n    Args:\n        param1: First parameter description\n        param2: Second parameter description\n    \n    Returns:\n        Combined result of parameters\n    '''\n    # Clear variable names\n    result = param1 + param2\n    \n    # Return with explanation\n    return result\n\n# Usage example\noutput = well_documented_function('Hello', 'World')\nprint(output)"
                                },
                                {
                                    "type": "video",
                                    "query": "best practices and design patterns tutorial"
                                },
                                {
                                    "type": "mcq",
                                    "question": "What is the most important best practice?",
                                    "options": [
                                        "Writing code quickly",
                                        "Documentation and testing",
                                        "Using complex algorithms",
                                        "Avoiding comments"
                                    ],
                                    "answer": 1,
                                    "explanation": "Documentation and testing are crucial for maintainable and reliable code."
                                }
                            ],
                            "resources": [
                                {
                                    "title": "Best Practices Guide",
                                    "url": "https://docs.github.com/"
                                }
                            ]
                        }
                    ]
                },
                {
                    "id": "module-3",
                    "title": "Advanced Topics",
                    "description": "Explore advanced concepts and expert-level techniques.",
                    "lessons": [
                        {
                            "id": "lesson-6",
                            "title": "Expert-Level Concepts",
                            "objectives": [
                                "Explore advanced patterns",
                                "Understand optimization",
                                "Master complex implementations"
                            ],
                            "key_topics": [
                                "Advanced patterns",
                                "Optimization techniques",
                                "Complex scenarios",
                                "Expert methodologies"
                            ],
                            "content": [
                                {
                                    "type": "heading",
                                    "text": "Advanced Mastery"
                                },
                                {
                                    "type": "paragraph",
                                    "text": "At an expert level, understanding these patterns will set you apart as a practitioner in this field."
                                },
                                {
                                    "type": "code",
                                    "language": "javascript",
                                    "text": "// Advanced pattern example\nclass AdvancedPattern {\n  constructor() {\n    this.optimized = true;\n    this.performance = 'high';\n  }\n  \n  execute(data) {\n    // Optimized processing\n    const result = this.optimize(data);\n    return this.validate(result);\n  }\n  \n  optimize(input) {\n    // Complex optimization logic\n    return input;\n  }\n  \n  validate(output) {\n    // Validation logic\n    return { success: true, data: output };\n  }\n}\n\nconst pattern = new AdvancedPattern();\nconsole.log(pattern.execute('advanced data'));"
                                },
                                {
                                    "type": "video",
                                    "query": f"advanced {topic} expert tutorial"
                                },
                                {
                                    "type": "mcq",
                                    "question": "What distinguishes expert-level understanding?",
                                    "options": [
                                        "Memorizing facts",
                                        "Pattern recognition",
                                        "Following tutorials",
                                        "Copying code"
                                    ],
                                    "answer": 1,
                                    "explanation": "Pattern recognition allows experts to solve novel problems effectively."
                                }
                            ],
                            "resources": [
                                {
                                    "title": "Advanced Topics",
                                    "url": "https://stackoverflow.com/"
                                }
                            ]
                        }
                    ]
                }
            ]
        }
    }


@app.get("/")
async def root():
    return {"message": "Text-to-Learn API is running!", "status": "healthy"}


@app.get("/api/health")
async def health_check():
    return {"status": "ok", "service": "text-to-learn-backend"}


# Note: Course generation endpoints moved to routes/courses.py
# - POST /api/generate-course
# - POST /api/generate-course-async
# - GET /api/course-status/{job_id}
# - GET /api/course-result/{job_id}
# These now include Auth0 authentication and MongoDB persistence

# ============= YouTube API =============

@app.get("/api/youtube/search")
async def search_youtube_videos(
    q: str = Query(..., description="Search query for videos"),
    maxResults: int = Query(3, description="Number of results to return")
):
    """Search YouTube videos using the YouTube Data API v3."""
    if not YOUTUBE_API_KEY:
        # Return mock data if no API key is set
        return {
            "items": [
                {
                    "id": {
                        "videoId": "dQw4w9WgXcQ"
                    },
                    "snippet": {
                        "title": f"Sample Video: {q}",
                        "description": "This is a sample video. Add your YouTube API key to fetch real videos.",
                        "thumbnails": {
                            "medium": {
                                "url": "https://via.placeholder.com/320x180?text=Add+YouTube+API+Key"
                            }
                        }
                    }
                }
            ]
        }

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://www.googleapis.com/youtube/v3/search",
                params={
                    "part": "snippet",
                    "q": q,
                    "type": "video",
                    "videoEmbeddable": "true",
                    "maxResults": min(maxResults, 10),  # Max 10 results
                    "key": YOUTUBE_API_KEY
                },
                timeout=10.0
            )
            
            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail="Failed to fetch videos from YouTube"
                )
            
            data = response.json()
            return {"items": data.get("items", [])}
            
    except httpx.HTTPError as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching YouTube videos: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Unexpected error: {str(e)}"
        )


@app.get("/api/youtube/embed/{video_id}")
async def get_youtube_embed_url(video_id: str):
    """Get the embed URL for a YouTube video."""
    return {
        "embedUrl": f"https://www.youtube.com/embed/{video_id}",
        "watchUrl": f"https://www.youtube.com/watch?v={video_id}"
    }


@app.post("/api/tts/synthesize")
async def synthesize_speech(request: dict):
    """
    Convert text to speech using Google Gemini TTS models.
    Primary: gemini-2.5-flash-preview-tts
    Fallback: gemini-2.5-pro (TTS only)
    
    Request body:
    {
        "text": "Text to convert to speech",
        "language": "en-US" | "hi-IN" | "en-IN" (for Hinglish)
    }
    """
    text = request.get("text", "")
    language = request.get("language", "en-US")
    
    if not text:
        raise HTTPException(status_code=400, detail="Text is required")
    
    # If no API key or client not initialized, fall back to browser TTS
    if not GEMINI_API_KEY or not genai_client:
        return {
            "text": text,
            "language": language,
            "useBrowserTTS": True,
            "isMock": True,
            "message": "No API key - using browser SpeechSynthesis"
        }
    
    try:
        from google.genai import types
        
        # Map language codes to Gemini voice names
        voice_map = {
            "en-US": "Kore",      # English US - Female
            "en-GB": "Puck",      # English UK - Male  
            "en-IN": "Aoede",     # English India/Hinglish - Female
            "hi-IN": "Charon",    # Hindi - Male
        }
        
        voice_name = voice_map.get(language, "Kore")
        
        # Embed the language instruction in the content for proper generation
        language_instruction = f"Read this text aloud in {language} with clear pronunciation:"
        contents = f"{language_instruction} {text}"
        
        # Try primary model: Gemini 2.5 Flash Preview TTS
        print(f"[TTS] Trying Flash Preview TTS - voice: {voice_name}, language: {language}")
        
        try:
            response = genai_client.models.generate_content(
                model="gemini-2.5-flash-preview-tts",
                contents=contents,
                config=types.GenerateContentConfig(
                    response_modalities=["AUDIO"],
                    speech_config=types.SpeechConfig(
                        voice_config=types.VoiceConfig(
                            prebuilt_voice_config=types.PrebuiltVoiceConfig(
                                voice_name=voice_name,
                            )
                        )
                    )
                )
            )
            
            # Try to extract audio from Flash model
            audio_result = _extract_audio(response)
            if audio_result:
                print(f"[TTS] ✓ Got audio from Flash Preview TTS")
                audio_result["model"] = "gemini-2.5-flash-preview-tts"
                return audio_result
            else:
                print("[TTS] Flash returned no audio, trying fallback...")
                
        except Exception as flash_error:
            print(f"[TTS] Flash error: {str(flash_error)[:100]}, trying fallback...")
        
        # Fallback: Gemini 2.5 Pro TTS
        print(f"[TTS] Trying Gemini 2.5 Pro TTS fallback - voice: {voice_name}")
        
        try:
            response = genai_client.models.generate_content(
                model="gemini-2.5-pro",
                contents=contents,
                config=types.GenerateContentConfig(
                    response_modalities=["AUDIO"],
                    speech_config=types.SpeechConfig(
                        voice_config=types.VoiceConfig(
                            prebuilt_voice_config=types.PrebuiltVoiceConfig(
                                voice_name=voice_name,
                            )
                        )
                    )
                )
            )
            
            # Try to extract audio from Pro model
            audio_result = _extract_audio(response)
            if audio_result:
                print(f"[TTS] ✓ Got audio from Gemini 2.5 Pro TTS")
                audio_result["model"] = "gemini-2.5-pro"
                return audio_result
            else:
                print("[TTS] Pro returned no audio")
                
        except Exception as pro_error:
            print(f"[TTS] Pro error: {str(pro_error)[:100]}")
        
        # If both models fail, fall back to browser TTS
        return {
            "text": text,
            "language": language,
            "useBrowserTTS": True,
            "isMock": True,
            "fallbackReason": "Both Gemini TTS models failed - using browser SpeechSynthesis"
        }
        
    except ImportError as e:
        return {
            "text": text,
            "language": language,
            "useBrowserTTS": True,
            "isMock": True,
            "fallbackReason": f"GenAI package not available: {str(e)}"
        }
    except Exception as e:
        print(f"[TTS] Unexpected error: {str(e)}")
        return {
            "text": text,
            "language": language,
            "useBrowserTTS": True,
            "isMock": True,
            "fallbackReason": f"Gemini TTS error: {str(e)}"
        }


def _extract_audio(response) -> dict | None:
    """Extract audio data from Gemini API response."""
    if not response:
        return None
        
    if hasattr(response, 'candidates') and response.candidates:
        candidate = response.candidates[0]
        if candidate and hasattr(candidate, 'content') and candidate.content:
            content = candidate.content
            if hasattr(content, 'parts') and content.parts:
                part = content.parts[0]
                if part and hasattr(part, 'inline_data') and part.inline_data:
                    audio_data = part.inline_data.data
                    if audio_data and len(audio_data) > 0:
                        audio_base64 = base64.b64encode(audio_data).decode('utf-8')
                        mime_type = part.inline_data.mime_type or "audio/wav"
                        
                        return {
                            "audioContent": audio_base64,
                            "mimeType": mime_type,
                            "language": language,
                            "voice": voice_name,
                            "isMock": False,
                            "useBrowserTTS": False
                        }
    return None


@app.post("/api/tts/translate")
async def translate_text(request: dict):
    """
    Translate text from English to Hindi/Hinglish.
    
    Request body:
    {
        "text": "Text to translate",
        "targetLanguage": "hi" (Hindi) | "en-IN" (Hinglish)
    }
    """
    text = request.get("text", "")
    target_language = request.get("targetLanguage", "hi")
    
    if not text:
        raise HTTPException(status_code=400, detail="Text is required")
    
    # If no API key, return mock translation
    if not GEMINI_API_KEY:
        return {
            "translatedText": f"[Hindi translation of: {text[:50]}...]",
            "targetLanguage": target_language,
            "isMock": True,
            "message": "Demo mode: Add GEMINI_API_KEY for real translation"
        }
    
    try:
        # Use Google Translate API
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"https://translation.googleapis.com/language/translate/v2?key={GEMINI_API_KEY}",
                json={
                    "q": text,
                    "source": "en",
                    "target": target_language.split("-")[0],  # 'hi' for Hindi
                    "format": "text"
                },
                timeout=30.0
            )
            
            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail="Failed to translate text"
                )
            
            data = response.json()
            translated = data.get("data", {}).get("translations", [{}])[0].get("translatedText", "")
            
            return {
                "translatedText": translated,
                "originalText": text,
                "targetLanguage": target_language,
                "isMock": False
            }
            
    except httpx.HTTPError as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error translating text: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Unexpected error: {str(e)}"
        )


@app.get("/api/tts/voices")
async def list_available_voices():
    """List available TTS voices and languages."""
    return {
        "voices": [
            {
                "languageCode": "en-US",
                "name": "English (US)",
                "gender": "Female"
            },
            {
                "languageCode": "en-GB",
                "name": "English (UK)",
                "gender": "Female"
            },
            {
                "languageCode": "en-IN",
                "name": "English (India) / Hinglish",
                "gender": "Female"
            },
            {
                "languageCode": "hi-IN",
                "name": "Hindi",
                "gender": "Female"
            }
        ]
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)
