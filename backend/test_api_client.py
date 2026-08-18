import requests
import json

url = "http://127.0.0.1:8000/api/ai/analyze"
headers = {"Content-Type": "application/json"}
payload = {
    "mode": "teardown",
    "company": {
        "name": "Airbnb",
        "one_liner": "Rent unique accommodations from local hosts.",
        "long_description": "Airbnb is an online marketplace that connects people who want to rent out their homes.",
        "industry": "Travel",
        "status": "Active"
    }
}

print("Sending POST request to /api/ai/analyze...")
try:
    response = requests.post(url, json=payload, stream=True)
    print(f"Status Code: {response.status_code}")
    print(f"Headers: {response.headers}")
    print("Streaming content:")
    for chunk in response.iter_content(chunk_size=1024):
        if chunk:
            print(chunk.decode("utf-8"), end="", flush=True)
    print("\nRequest completed.")
except Exception as e:
    print(f"Error occurred: {e}")
