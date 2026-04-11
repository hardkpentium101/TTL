"""
LLM Manager for Text-to-Learn
Extensible manager supporting multiple LLM providers.
"""
import os
import json
import re
import requests
from abc import ABC, abstractmethod
from typing import Optional, Dict, Any, List

try:
    import json5
    HAS_JSON5 = True
except ImportError:
    HAS_JSON5 = False
    print("[LLM] json5 not installed, using standard JSON parser")


class LLMProvider(ABC):
    """Base class for all LLM providers."""
    
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.name = self.__class__.__name__
    
    @abstractmethod
    def generate_course(self, topic: str, level: str = "Beginner") -> Optional[Dict[str, Any]]:
        """Generate a course structure."""
        pass

    def generate_quiz(self, topic: str, level: str = "Beginner") -> Optional[Dict[str, Any]]:
        """Generate a 5-question MCQ quiz."""
        pass
    
    def _parse_json_response(self, text: str) -> Optional[Dict[str, Any]]:
        """Parse JSON from LLM response, handling markdown and extra text."""
        if not text:
            return None

        text = text.strip()

        # Remove markdown code blocks if present
        if text.startswith("```"):
            parts = text.split("```")
            if len(parts) >= 2:
                text = parts[1]
                if text.startswith("json"):
                    text = text[4:]
                text = text.strip()

        # Try json5 first (handles unquoted keys, trailing commas, etc.)
        if HAS_JSON5:
            try:
                return json5.loads(text)
            except Exception as e:
                print(f"[{self.name}] json5 parse error: {str(e)[:100]}")

        # Fallback: standard JSON with aggressive cleanup
        text = self._clean_json(text)

        try:
            return json.loads(text)
        except json.JSONDecodeError as e:
            print(f"[{self.name}] JSON parse error: {str(e)[:100]}")

            # Try to extract JSON object
            start = text.find("{")
            end = text.rfind("}") + 1
            if start >= 0 and end > start:
                try:
                    extracted = text[start:end]
                    extracted = self._clean_json(extracted)
                    return json.loads(extracted)
                except Exception as e2:
                    print(f"[{self.name}] Fallback parse failed: {str(e2)[:80]}")

            return None

    def _clean_json(self, text: str) -> str:
        """Clean and fix common JSON issues in LLM responses."""
        # 1. Fix unquoted keys
        text = re.sub(r'([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:', r'\1"\2":', text)
        
        # 2. Remove trailing commas before } or ]
        text = re.sub(r',(\s*[}\]])', r'\1', text)
        
        # 3. Fix missing commas between key-value pairs (common LLM error)
        #    Pattern: "value" followed by newline/whitespace then "key" without comma
        text = re.sub(r'("|\d|\]|\})\s*\n(\s*)"', r'\1,\n\2"', text)
        
        # 4. Fix double commas
        text = re.sub(r',\s*,', ',', text)
        
        # 5. Remove any text before the first { (LLM preamble)
        first_brace = text.find("{")
        if first_brace > 0:
            text = text[first_brace:]
        
        return text
    
    def _get_course_prompt(self, topic: str, level: str) -> str:
        """Standard course generation prompt."""
        return f"""
You are a world-class instructional designer and subject-matter expert.
Your courses are thorough, practical, and deeply educational.
Return ONLY valid JSON. No markdown, no code fences, no text before or after the JSON.

Topic: {topic}
Level: {level}

Generate a comprehensive, in-depth course. Every lesson must be rich with
explanation, examples, and practical application — not just bullet summaries.

Return this exact JSON schema:
{{
  "course": {{
    "title": "string",
    "description": "string — 3 to 5 sentences, sell the course",
    "metadata": {{
      "level": "Beginner | Intermediate | Advanced",
      "estimated_duration": "string — e.g. 12–15 hours",
      "prerequisites": ["string"],
      "learning_outcomes": ["string"],
      "skills_gained": ["string"]
    }},
    "modules": [
      {{
        "id": "module-1",
        "title": "string",
        "description": "string — 2–3 sentences",
        "module_outcomes": ["string"],
        "lessons": [
          {{
            "id": "lesson-1-1",
            "title": "string",
            "duration": "string — e.g. 45 min",
            "objectives": ["string"],
            "key_topics": ["string"],
            "content": [
              {{"type":"heading", "text":"string"}},
              {{"type":"paragraph", "text":"string — 4 to 6 sentences minimum"}},
              {{"type":"paragraph", "text":"string — continue the explanation"}},
              {{"type":"callout", "variant":"info|tip|warning|example", "text":"string"}},
              {{"type":"list", "style":"bullet|numbered", "items":["string"]}},
              {{"type":"heading", "text":"string"}},
              {{"type":"paragraph", "text":"string"}},
              {{"type":"code", "language":"string", "code":"string"}},
              {{"type":"table", "headers":["string"], "rows":[["string"]]}},
              {{"type":"link", "text":"string", "url":"https://..."}},
              {{"type":"video", "title":"string", "query":"YouTube search string"}}
            ],
            "summary": "string — 2–3 sentence recap of the lesson",
            "practice": {{
              "prompt": "string — a hands-on exercise or reflection question",
              "hints": ["string"]
            }},
            "resources": [
              {{"title":"string", "url":"https://...", "type":"article|docs|book|tool"}}
            ]
          }}
        ],
        "module_quiz": {{
          "questions": [
            {{
              "question": "string",
              "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
              "answer": "A",
              "explanation": "string"
            }}
          ]
        }}
      }}
    ]
  }}
}}

Content rules (all mandatory):
1. Generate 5–8 modules, each with 4–6 lessons
2. Every paragraph must be 4–6 sentences minimum — explain WHY, not just WHAT
3. Every lesson must include: heading · paragraph(s) · callout · list · link · video
4. Add code blocks for any technical topic (Python, JS, SQL, shell, etc.)
5. Add tables for comparisons, specs, or structured data (at least 1 per module)
6. callout variants: info = background context · tip = practical shortcut
   warning = common mistake · example = worked real-world example
7. list style: use "numbered" for steps/sequences, "bullet" for options/features
8. Every lesson ends with a practice exercise the learner can actually do
9. Every module ends with a 3-question quiz testing that module's material
10. Progressive difficulty: module-1 foundational → final module advanced/applied
11. Lesson IDs use format "lesson-{{moduleNum}}-{{lessonNum}}" e.g. "lesson-2-3"
12. Strict JSON — double-quoted keys, no trailing commas, no comments in output
"""

    def _get_quiz_prompt(self, topic: str, level: str) -> str:
        """Generate quiz prompt for adaptive assessment."""
        return f"""
You are an expert instructional designer creating an adaptive assessment quiz.
Return ONLY valid JSON. No markdown, no code fences, no explanatory text.

TASK:
Create a 5-question multiple-choice quiz to assess knowledge of: {topic}
Target Level: {level}

OUTPUT REQUIREMENTS:
Return ONLY valid JSON with this exact structure:
{{
  "questions": [
    {{
      "question": "string",
      "options": ["option A", "option B", "option C", "option D"],
      "answer": 0,
      "explanation": "string"
    }}
  ]
}}

RULES:
1. Exactly 5 questions
2. Each question must have exactly 4 options
3. "answer" is the 0-based index of the correct option (0, 1, 2, or 3)
4. "explanation" should briefly explain why the answer is correct
5. Questions should test {level} level understanding of {topic}
6. Vary difficulty across questions but keep them appropriate for {level}
7. Only ONE option per question should be correct
8. Wrong options should be plausible distractors, not obviously incorrect

STRICT JSON ONLY — double-quoted keys, no trailing commas, no comments
"""


class OpenRouterProvider(LLMProvider):
    """OpenRouter provider supporting 100+ models."""
    
    def __init__(self, api_key: str):
        super().__init__(api_key)
        self.base_url = "https://openrouter.ai/api/v1"
        # Models to try in priority order (tested & working)
        self.models = [
            "qwen/qwen3.6-plus:free",                   # Best quality & speed
            "stepfun/step-3.5-flash:free",              # First fallback (~27s)
            "arcee-ai/trinity-large-preview:free",      # Second fallback (~41s)
            "nvidia/nemotron-3-super-120b-a12b:free",   # Third fallback (~40s)
        ]
    
    def generate_course(self, topic: str, level: str = "Beginner") -> Optional[Dict[str, Any]]:
        """Generate course using OpenRouter models."""
        prompt = self._get_course_prompt(topic, level)
        
        for model in self.models:
            try:
                print(f"[OpenRouter] Trying {model}...")
                
                response = requests.post(
                    url=f"{self.base_url}/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json",
                        "HTTP-Referer": "https://github.com/hardkpentium101/TTL",
                        "X-Title": "Text-to-Learn",
                    },
                    data=json.dumps({
                        "model": model,
                        "messages": [{"role": "user", "content": prompt}],
                        "reasoning": {"enabled": True},  # Enable for supported models
                        "max_tokens": 8192,
                        "temperature": 0.7,
                    }),
                    timeout=120
                )
                
                if response.status_code != 200:
                    print(f"[OpenRouter] {model} returned status {response.status_code}")
                    continue
                
                data = response.json()
                
                if data.get("choices") and len(data["choices"]) > 0:
                    text = data["choices"][0]["message"].get("content", "").strip()
                    course_data = self._parse_json_response(text)
                    
                    if course_data and "course" in course_data:
                        print(f"[OpenRouter] ✓ Generated with {model}")
                        return {
                            "_provider": "openrouter",
                            "_model": model,
                            "_ai_generated": True,
                            "_reasoning_tokens": data.get("usage", {}).get("reasoning_tokens", 0),
                            **course_data
                        }
                
                print(f"[OpenRouter] {model} returned no valid response")

            except Exception as e:
                print(f"[OpenRouter] {model} failed: {str(e)[:100]}")
                continue

        return None

    def generate_quiz(self, topic: str, level: str = "Beginner") -> Optional[Dict[str, Any]]:
        """Generate quiz using OpenRouter models."""
        prompt = self._get_quiz_prompt(topic, level)

        for model in self.models:
            try:
                print(f"[OpenRouter] Trying {model} for quiz...")

                response = requests.post(
                    url=f"{self.base_url}/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json",
                        "HTTP-Referer": "https://github.com/hardkpentium101/TTL",
                        "X-Title": "Text-to-Learn",
                    },
                    data=json.dumps({
                        "model": model,
                        "messages": [{"role": "user", "content": prompt}],
                        "reasoning": {"enabled": True},
                        "max_tokens": 4096,
                        "temperature": 0.7,
                    }),
                    timeout=60
                )

                if response.status_code != 200:
                    print(f"[OpenRouter] {model} returned status {response.status_code}")
                    continue

                data = response.json()

                if data.get("choices") and len(data["choices"]) > 0:
                    text = data["choices"][0]["message"].get("content", "").strip()
                    quiz_data = self._parse_json_response(text)

                    if quiz_data and "questions" in quiz_data:
                        print(f"[OpenRouter] ✓ Quiz generated with {model}")
                        return quiz_data

                print(f"[OpenRouter] {model} returned no valid quiz response")

            except Exception as e:
                print(f"[OpenRouter] {model} quiz failed: {str(e)[:100]}")
                continue

        return None


class GeminiProvider(LLMProvider):
    """Google Gemini/Gemma provider."""
    
    def __init__(self, api_key: str):
        super().__init__(api_key)
        self.client = None
        self._initialize_client()
        
        # Models to try in priority order
        self.models = [
            "gemma-3-27b",
            "gemma-3-12b",
            "gemma-3-4b",
            "gemma-3-1b",
        ]
    
    def _initialize_client(self):
        """Initialize Gemini client."""
        try:
            from google import genai
            self.client = genai.Client(api_key=self.api_key)
            print(f"[Gemini] ✓ Client initialized")
        except Exception as e:
            print(f"[Gemini] Warning: Could not initialize client: {e}")
    
    def generate_course(self, topic: str, level: str = "Beginner") -> Optional[Dict[str, Any]]:
        """Generate course using Gemini/Gemma models."""
        if not self.client:
            return None
        
        from google.genai import types
        prompt = self._get_course_prompt(topic, level)
        
        for model in self.models:
            try:
                print(f"[Gemini] Trying {model}...")
                
                response = self.client.models.generate_content(
                    model=model,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        temperature=0.7,
                        top_p=0.9,
                        max_output_tokens=8192,
                    )
                )
                
                if response and response.text:
                    text = response.text.strip()
                    course_data = self._parse_json_response(text)
                    
                    if course_data and "course" in course_data:
                        print(f"[Gemini] ✓ Generated with {model}")
                        return {
                            "_provider": "gemini",
                            "_model": model,
                            "_ai_generated": True,
                            **course_data
                        }
                
                print(f"[Gemini] {model} returned empty response")

            except Exception as e:
                print(f"[Gemini] {model} failed: {str(e)[:100]}")
                continue

        return None

    def generate_quiz(self, topic: str, level: str = "Beginner") -> Optional[Dict[str, Any]]:
        """Generate quiz using Gemini/Gemma models."""
        if not self.client:
            return None

        from google.genai import types
        prompt = self._get_quiz_prompt(topic, level)

        for model in self.models:
            try:
                print(f"[Gemini] Trying {model} for quiz...")

                response = self.client.models.generate_content(
                    model=model,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        temperature=0.7,
                        top_p=0.9,
                        max_output_tokens=4096,
                    )
                )

                if response and response.text:
                    text = response.text.strip()
                    quiz_data = self._parse_json_response(text)

                    if quiz_data and "questions" in quiz_data:
                        print(f"[Gemini] ✓ Quiz generated with {model}")
                        return quiz_data

                print(f"[Gemini] {model} returned empty quiz response")

            except Exception as e:
                print(f"[Gemini] {model} quiz failed: {str(e)[:100]}")
                continue

        return None


# Add new providers here
PROVIDER_REGISTRY = {
    "openrouter": OpenRouterProvider,
    "gemini": GeminiProvider,
}


class LLMManager:
    """
    Manages LLM API calls across different providers.
    
    Usage:
        llm = LLMManager()  # Reads LLM_PROVIDER from env
        course = llm.generate_course("Python Basics")
    
    Env variables:
        LLM_PROVIDER: Provider to use (openrouter, gemini, etc.)
        <PROVIDER>_API_KEY: API key for the selected provider
    """
    
    def __init__(self, provider_name: Optional[str] = None):
        """
        Initialize LLM Manager.
        
        Args:
            provider_name: Override provider name (default: reads from LLM_PROVIDER env)
        """
        self.provider_name = (provider_name or os.getenv("LLM_PROVIDER", "gemini")).lower()
        self.provider = self._initialize_provider(self.provider_name)
        
        if self.provider:
            print(f"[LLM] ✓ Using provider: {self.provider_name}")
        else:
            print(f"[LLM] ✗ Provider '{self.provider_name}' not available")
    
    def _initialize_provider(self, name: str) -> Optional[LLMProvider]:
        """Initialize the specified provider."""
        provider_class = PROVIDER_REGISTRY.get(name)
        
        if not provider_class:
            print(f"[LLM] Unknown provider: {name}. Available: {list(PROVIDER_REGISTRY.keys())}")
            return None
        
        # Get API key from env (convention: <PROVIDER>_API_KEY)
        env_key = f"{name.upper()}_API_KEY"
        api_key = os.getenv(env_key)
        
        if not api_key:
            print(f"[LLM] No API key found for {name} (env: {env_key})")
            return None
        
        return provider_class(api_key)
    
    def generate_course(self, topic: str, level: str = "Beginner") -> Optional[Dict[str, Any]]:
        """
        Generate a course using the configured provider.

        Args:
            topic: Course topic
            level: Target audience level

        Returns:
            Course data dict or None if generation fails
        """
        if not self.provider:
            return None

        return self.provider.generate_course(topic, level)

    def generate_quiz(self, topic: str, level: str = "Beginner") -> Optional[Dict[str, Any]]:
        """
        Generate a 5-question MCQ quiz using the configured provider.

        Args:
            topic: Quiz topic
            level: Target quiz level

        Returns:
            Quiz data dict with "questions" array or None if generation fails
        """
        if not self.provider:
            return None

        return self.provider.generate_quiz(topic, level)
    
    @classmethod
    def get_available_providers(cls) -> List[str]:
        """Get list of available/registered providers."""
        return list(PROVIDER_REGISTRY.keys())
    
    @classmethod
    def register_provider(cls, name: str, provider_class: type):
        """
        Register a new provider at runtime.
        
        Usage:
            LLMManager.register_provider("anthropic", AnthropicProvider)
        """
        PROVIDER_REGISTRY[name.lower()] = provider_class
        print(f"[LLM] Registered provider: {name}")
