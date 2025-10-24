import os
import requests
import time
from fastapi import FastAPI, HTTPException, Request
import jwt as pyjwt
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from google import genai
from google.genai.errors import APIError
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# --- CONFIGURATION ---
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "AIzaSyBAKT29y3MAkaE9SmmsLDJBhROvLzEY4M0")  # Better: store in env
NODE_SERVER_URL = os.getenv("NODE_SERVER_URL", "http://localhost:8080/api/data")

app = FastAPI(title="College Hub AI Chatbot")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)

# Gemini client initialization
client = None
MODEL = "gemini-2.5-flash"

if GEMINI_API_KEY:
    try:
        client = genai.Client(api_key=GEMINI_API_KEY)
        print("Gemini Client initialized.")
    except Exception as e:
        print(f"Failed to initialize Gemini client: {e}")
        client = None
else:
    print("ERROR: GEMINI_API_KEY not set.")
    client = None

# --- REQUEST MODELS ---
class Message(BaseModel):
    role: str  # 'User' or 'AI'
    text: str

class ChatRequest(BaseModel):
    user_id: str
    message: str
    history: list[Message] = []

# --- UTILITY FUNCTIONS ---
def get_user_context(user_id: str) -> dict:
    url = f"{NODE_SERVER_URL}/context/{user_id}"
    headers = {}
    
    # Skip adding Authorization header
    # jwt_token = os.getenv("JWT_TOKEN")
    # if jwt_token:
    #     headers["Authorization"] = f"Bearer {jwt_token}"
    
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.HTTPError as e:
        if response.status_code == 404:
            raise HTTPException(status_code=404, detail=f"User {user_id} not found.")
        elif response.status_code == 401:
            raise HTTPException(status_code=401, detail="Authentication required. Please provide valid JWT token.")
        raise HTTPException(status_code=503, detail="Backend data service error.")
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=503, detail="Could not connect to backend service.")

def get_system_instruction(context_data: dict) -> str:
    # Normalize different backend schemas so the assistant gets consistent fields
    # Backend may return keys like `username`, `collegeName`, `universityName`, `academics`.
    # Convert them to the expected keys (`first_name`, `role`, `university.name`, `college.name`, `academicSchedule`).
    try:
        # shallow copy
        ctx = dict(context_data)
    except Exception:
        ctx = {}

    # name
    user_name = ctx.get("first_name") or ctx.get("username") or ctx.get("name") or "Student"
    user_role = ctx.get("role") or ctx.get("user_role") or "Student"

    # university and college
    if isinstance(ctx.get("university"), dict):
        university_name = (ctx.get("university") or {}).get("name", "N/A")
    else:
        university_name = ctx.get("universityName") or ctx.get("university_name") or "N/A"

    if isinstance(ctx.get("college"), dict):
        college_name = (ctx.get("college") or {}).get("name", "N/A")
    else:
        college_name = ctx.get("collegeName") or ctx.get("college_name") or "N/A"

    # Build academicSchedule from different possible backend shapes
    academic_schedule = []
    if isinstance(ctx.get("academicSchedule"), list):
        academic_schedule = ctx.get("academicSchedule")
    elif isinstance(ctx.get("academics"), list):
        # convert academics -> academicSchedule
        for c in ctx.get("academics", []):
            # course may have name/code or courseDetails
            courseDetails = {}
            if isinstance(c, dict):
                courseDetails["title"] = c.get("name") or c.get("title") or c.get("course_name")
                courseDetails["course_code"] = c.get("code") or c.get("course_code") or c.get("courseCode")
            academic_schedule.append({"courseDetails": courseDetails, "grades": c.get("assignments", [])})
    else:
        academic_schedule = []

    current_courses = []
    upcoming_assignments = []

    for enrollment in academic_schedule:
        if not isinstance(enrollment, dict):
            continue
        course = enrollment.get("courseDetails") or {}
        course_name = course.get("title", "Unknown Course")
        course_code = course.get("course_code", "N/A")
        if course_code and course_code != "N/A":
            current_courses.append(f"- {course_code}: {course_name} (Instructor ID: {enrollment.get('instructor_id', 'N/A')})")
        # grades/assignments may be in different shapes
        for grade_data in enrollment.get("grades", []) or []:
            if not isinstance(grade_data, dict):
                continue
            # try both shapes: { assignment: {...}, points_earned } or direct assignment objects
            assignment = grade_data.get("assignment") or grade_data
            upcoming_assignments.append(
                f"- Assignment: {assignment.get('title')}, Course: {course_code}, Due: {assignment.get('due_date', 'N/A')}, "
                f"Score: {grade_data.get('points_earned', 'N/A')} / {assignment.get('max_points', 'N/A')}"
            )

    courses_list = "\n".join(current_courses) or "None found."
    assignments_list = "\n".join(upcoming_assignments) or "No upcoming assignments."

    return f"""
You are the College Hub AI Assistant. You provide personalized academic guidance.

--- USER CONTEXT ---
Name: {user_name}
Role: {user_role}
Institution: {college_name} at {university_name}

Current Courses:
{courses_list}

Upcoming Assignments:
{assignments_list}
--- END CONTEXT ---
Instructions: Respond helpfully and professionally, using the context above.
"""

def format_contents_for_gemini(history: list[Message], current_message: str):
    contents = []
    for msg in history:
        role = 'user' if msg.role.lower() == 'user' else 'model'
        contents.append({"role": role, "parts": [{"text": msg.text}]})
    contents.append({"role": "user", "parts": [{"text": current_message}]})
    return contents

# --- API ENDPOINTS ---
@app.get("/")
async def health_check():
    return {"status": "AI service is running", "port": 8001}

@app.post("/chat")
async def chat_with_hub(request: Request, chat_request: ChatRequest):
    # 1) Try Authorization header (Bearer JWT) and decode to get userId
    user_id = None
    auth_header = request.headers.get('authorization')
    if auth_header and auth_header.lower().startswith('bearer '):
        token = auth_header.split(' ')[1]
        try:
            secret = os.getenv('JWT_SECRET', 'your_jwt_secret_here')
            decoded = pyjwt.decode(token, secret, algorithms=["HS256"])
            user_id = decoded.get('userId') or decoded.get('user_id')
        except Exception:
            # If token invalid, continue to fallbacks (we'll return a helpful error below)
            user_id = None

    # 2) Prefer user_id from request body (frontend should send it). Fallback to cookie.
    if not user_id:
        user_id = getattr(chat_request, 'user_id', None) or request.cookies.get("user_id")

    if not user_id:
        # Helpful error for callers: explain what's expected
        raise HTTPException(status_code=400, detail="user_id is required. Send it in the request body (recommended) or provide a valid Bearer JWT.")

    if not client:
        raise HTTPException(status_code=500, detail="AI service not initialized or invalid API key.")

    # 1. Fetch user context
    context_data = get_user_context(user_id)
    if not isinstance(context_data, dict):
        raise HTTPException(status_code=500, detail="Invalid context data.")

    # Log who asked the question (helpful for debugging)
    try:
        username = context_data.get('username') or context_data.get('first_name') or 'Unknown'
    except Exception:
        username = 'Unknown'
    client_host = getattr(request.client, 'host', 'unknown') if request is not None else 'unknown'
    timestamp = time.strftime('%Y-%m-%d %H:%M:%S', time.localtime())
    # Limit message length in logs to avoid huge dumps
    message_preview = (chat_request.message[:120] + '...') if len(chat_request.message) > 120 else chat_request.message
    print(f"[{timestamp}] Chat request from {username} ({user_id}) from {client_host}: {message_preview}")

    # 2. Build system instruction
    system_instruction = get_system_instruction(context_data)

    # 3. Format history + current message
    contents = format_contents_for_gemini(chat_request.history, chat_request.message)

    # 4. Gemini API call with retry
    max_retries = 3
    delay = 1
    response = None
    for attempt in range(max_retries):
        try:
            response = client.models.generate_content(
                model=MODEL,
                contents=contents,
                config={"systemInstruction": system_instruction, "temperature": 0.5}
            )
            break
        except APIError as e:
            if "503 UNAVAILABLE" in str(e) and attempt < max_retries - 1:
                time.sleep(delay)
                delay *= 2
            else:
                raise HTTPException(status_code=500, detail="Gemini API error.")

    if not response:
        raise HTTPException(status_code=500, detail="Gemini service unavailable after retries.")

    return {"user_id": user_id, "response": response.text}
