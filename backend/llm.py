import os
import json
import logging
from typing import Generator, Optional
import requests
from google import genai
from dotenv import load_dotenv

logger = logging.getLogger(__name__)

load_dotenv()

class LLMService:
    def __init__(self):
        self.provider = "none"
        self.api_key = ""
        self.model_name = ""
        self.gemini_client = None
        self._initialize_provider()

    def _initialize_provider(self):
        # 1. Sarvam Check
        if os.getenv("SARVAM_API_KEY"):
            self.provider = "sarvam"
            self.api_key = os.getenv("SARVAM_API_KEY").strip()
            self.model_name = os.getenv("SARVAM_MODEL", "sarvam-2b-v0.5").strip()
            logger.info(f"Using Sarvam AI provider with model: {self.model_name}")
            return

        # 2. Groq Check
        if os.getenv("GROQ_API_KEY"):
            self.provider = "groq"
            self.api_key = os.getenv("GROQ_API_KEY").strip()
            self.model_name = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile").strip()
            logger.info(f"Using Groq provider with model: {self.model_name}")
            return

        # 2. OpenAI Check
        if os.getenv("OPENAI_API_KEY"):
            self.provider = "openai"
            self.api_key = os.getenv("OPENAI_API_KEY").strip()
            self.model_name = os.getenv("OPENAI_MODEL", "gpt-4o-mini").strip()
            logger.info(f"Using OpenAI provider with model: {self.model_name}")
            return

        # 3. Anthropic (Claude) Check
        if os.getenv("ANTHROPIC_API_KEY"):
            self.provider = "anthropic"
            self.api_key = os.getenv("ANTHROPIC_API_KEY").strip()
            self.model_name = os.getenv("ANTHROPIC_MODEL", "claude-3-5-sonnet-20241022").strip()
            logger.info(f"Using Anthropic provider with model: {self.model_name}")
            return

        # 4. Grok / xAI Check
        if os.getenv("XAI_API_KEY") or os.getenv("GROK_API_KEY"):
            self.provider = "grok"
            self.api_key = (os.getenv("XAI_API_KEY") or os.getenv("GROK_API_KEY")).strip()
            self.model_name = os.getenv("GROK_MODEL", "grok-2-1212").strip()
            logger.info(f"Using Grok (xAI) provider with model: {self.model_name}")
            return

        # 5. Gemini (Default fallback)
        if os.getenv("GEMINI_API_KEY"):
            self.provider = "gemini"
            self.api_key = os.getenv("GEMINI_API_KEY").strip()
            self.model_name = os.getenv("GEMINI_MODEL", "gemini-3.6-flash").strip()
            self.gemini_client = genai.Client(api_key=self.api_key)
            logger.info(f"Using Gemini provider with model: {self.model_name}")
            return

        logger.warning("No LLM API keys found in backend environment variables. AI operations will fail.")

    def reload(self):
        """Reloads the provider details (useful if .env changed)."""
        self._initialize_provider()

    def get_status(self) -> dict:
        """Returns details about the active model provider for the health check API."""
        return {
            "provider": self.provider,
            "model": self.model_name,
            "enabled": self.provider != "none"
        }

    def stream_completion(
        self, 
        prompt: str, 
        provider: Optional[str] = None, 
        model_name: Optional[str] = None, 
        api_key: Optional[str] = None
    ) -> Generator[str, None, None]:
        """
        Streams completion text chunk-by-chunk using the active LLM provider.
        Supports parameter overrides for multi-provider configurations.
        """
        active_provider = provider or self.provider
        active_model = model_name or self.model_name
        active_key = api_key or self.api_key

        if active_provider == "none" or not active_key:
            yield "[Error: No LLM provider or API key configured. Please configure it in Settings.]"
            return

        try:
            if active_provider == "gemini":
                yield from self._stream_gemini(prompt, active_model, active_key)
            elif active_provider == "sarvam":
                yield from self._stream_sarvam(prompt, active_model, active_key)
            elif active_provider == "openai":
                yield from self._stream_openai_compatible("https://api.openai.com/v1/chat/completions", prompt, active_model, active_key)
            elif active_provider == "groq":
                yield from self._stream_openai_compatible("https://api.groq.com/openai/v1/chat/completions", prompt, active_model, active_key)
            elif active_provider == "grok":
                yield from self._stream_openai_compatible("https://api.x.ai/v1/chat/completions", prompt, active_model, active_key)
            elif active_provider == "anthropic":
                yield from self._stream_anthropic(prompt, active_model, active_key)
        except Exception as e:
            logger.error(f"Error streaming from provider {active_provider}: {e}")
            yield f"\n[AI Streaming Error: {str(e)}]"

    # =====================================================================
    # Provider-Specific Generators
    # =====================================================================

    def _stream_gemini(self, prompt: str, model_name: str, api_key: str) -> Generator[str, None, None]:
        if api_key != self.api_key:
            client = genai.Client(api_key=api_key)
        else:
            if not self.gemini_client:
                self.gemini_client = genai.Client(api_key=self.api_key)
            client = self.gemini_client

        chat = client.chats.create(model=model_name)
        response = chat.send_message_stream(prompt)
        for chunk in response:
            if chunk.text:
                yield chunk.text

    def _stream_openai_compatible(self, url: str, prompt: str, model_name: str, api_key: str) -> Generator[str, None, None]:
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": model_name,
            "messages": [{"role": "user", "content": prompt}],
            "stream": True
        }
        
        # Make the request and iterate over lines
        response = requests.post(url, headers=headers, json=payload, stream=True, timeout=30)
        response.raise_for_status()

        for line in response.iter_lines():
            if not line:
                continue
            decoded = line.decode("utf-8").strip()
            if decoded.startswith("data: "):
                data_str = decoded[6:].strip()
                if data_str == "[DONE]":
                    break
                try:
                    data = json.loads(data_str)
                    content = data["choices"][0]["delta"].get("content", "")
                    if content:
                        yield content
                except Exception:
                    pass

    def _stream_anthropic(self, prompt: str, model_name: str, api_key: str) -> Generator[str, None, None]:
        url = "https://api.anthropic.com/v1/messages"
        headers = {
            "x-api-key": api_key,
            "anthropic-version": "2023-06-01",
            "Content-Type": "application/json"
        }
        payload = {
            "model": model_name,
            "messages": [{"role": "user", "content": prompt}],
            "max_tokens": 4000,
            "stream": True
        }
        
        response = requests.post(url, headers=headers, json=payload, stream=True, timeout=30)
        response.raise_for_status()

        for line in response.iter_lines():
            if not line:
                continue
            decoded = line.decode("utf-8").strip()
            if decoded.startswith("data: "):
                data_str = decoded[6:].strip()
                try:
                    data = json.loads(data_str)
                    if data.get("type") == "content_block_delta":
                        text = data["delta"].get("text", "")
                        if text:
                            yield text
                except Exception:
                    pass

    def _stream_sarvam(self, prompt: str, model_name: str, api_key: str) -> Generator[str, None, None]:
        url = "https://api.sarvam.ai/v1/chat/completions"
        headers = {
            "api-subscription-key": api_key,
            "Content-Type": "application/json"
        }
        payload = {
            "model": model_name,
            "messages": [{"role": "user", "content": prompt}],
            "stream": True
        }
        
        response = requests.post(url, headers=headers, json=payload, stream=True, timeout=30)
        response.raise_for_status()

        for line in response.iter_lines():
            if not line:
                continue
            decoded = line.decode("utf-8").strip()
            if decoded.startswith("data: "):
                data_str = decoded[6:].strip()
                if data_str == "[DONE]":
                    break
                try:
                    data = json.loads(data_str)
                    content = data["choices"][0]["delta"].get("content", "")
                    if content:
                        yield content
                except Exception:
                    pass

# Singleton instance
llm_service = LLMService()
