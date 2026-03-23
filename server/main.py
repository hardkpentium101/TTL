"""
Text-to-Learn: AI-Powered Course Generator
FastAPI Backend
"""
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
import httpx

load_dotenv()

app = FastAPI(title="Text-to-Learn API")

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# YouTube API Key (get from https://console.cloud.google.com/)
YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY", "")

# Google Gemini API Key for TTS and Translation (get from https://makersuite.google.com/app/apikey)
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")


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


@app.post("/api/generate-course")
async def generate_course(request: dict):
    """Generate a complete course structure from a topic prompt."""
    topic = request.get("topic", "").strip()

    if not topic:
        raise HTTPException(status_code=400, detail="Topic cannot be empty")

    try:
        # For now, return mock course
        # TODO: Integrate with AI API (Gemini/OpenAI)
        course = generate_mock_course(topic)
        return course
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating course: {str(e)}")


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
    Convert text to speech.
    Returns text for browser-based SpeechSynthesis (works without API key).
    
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
    
    # Return text for browser TTS (most reliable, no API key needed)
    return {
        "text": text,
        "language": language,
        "useBrowserTTS": True,
        "message": "Use browser SpeechSynthesis API"
    }


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
