import sys
from dotenv import load_dotenv
from llm import llm_service

load_dotenv()

print("Testing LLM connection...")
print(f"Active Provider: {llm_service.provider}")
print(f"Model Name: {llm_service.model_name}")

try:
    print("Sending prompt...")
    for chunk in llm_service.stream_completion("Hello, say 'ready' in one word."):
        print(chunk, end="", flush=True)
    print("\nTest completed.")
except Exception as e:
    print(f"\nCaught exception: {e}", file=sys.stderr)
