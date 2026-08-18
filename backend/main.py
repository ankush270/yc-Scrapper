import os
import json
import logging
from enum import Enum
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, Depends, HTTPException, Header, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from dotenv import load_dotenv

import uuid
from datetime import datetime, timedelta
from db import init_db, get_db, User, Note, Favorite, Collection, SandboxProject, Achievement, UsageStat, PublicTeardown, Streak
from llm import llm_service

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

# Initialize database schema on startup
init_db()

app = FastAPI(title="YC_DECODE Fullstack Backend")

# Setup CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this to your frontend domain (e.g. http://localhost:5173)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =====================================================================
# Authentication Dependency
# =====================================================================

def get_current_user_uid(authorization: Optional[str] = Header(None)) -> str:
    """
    Validates authorization header.
    Expects format: 'Bearer <UID>'
    Under development, it accepts mock UIDs starting with 'mock_'.
    Under production, it can be extended to use firebase-admin token validation.
    """
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header is missing"
        )
    
    parts = authorization.split(" ")
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header format. Expected 'Bearer <UID>'"
        )
    
    uid = parts[1].strip()
    if not uid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token/UID cannot be empty"
        )
        
    return uid

# =====================================================================
# Request/Response Schemas
# =====================================================================

class UserSyncRequest(BaseModel):
    uid: str
    email: Optional[str] = None
    displayName: Optional[str] = None
    photoURL: Optional[str] = None

class NoteUpsertRequest(BaseModel):
    companySlug: str
    noteText: str

class FavoriteCreateRequest(BaseModel):
    companyId: str
    name: str
    industry: Optional[str] = None
    batch: Optional[str] = None

class CollectionCreateRequest(BaseModel):
    name: str
    description: Optional[str] = None
    companyIds: List[str] = []

class SandboxProjectCreateRequest(BaseModel):
    name: str
    oneLiner: Optional[str] = None
    targetAudience: Optional[str] = None
    revenueModel: Optional[str] = None
    features: List[str] = []
    referenceCompanyIds: List[str] = []
    notes: Optional[str] = None
    status: Optional[str] = "idea"

class StatIncrementRequest(BaseModel):
    key: str
    amount: int = 1

class AchievementUnlockRequest(BaseModel):
    achievementId: str


class TeardownPublishRequest(BaseModel):
    companyName: str
    companyOneLiner: Optional[str] = None
    companyBatch: Optional[str] = None
    companyIndustry: Optional[str] = None
    companyWebsite: Optional[str] = None
    teardownTitle: Optional[str] = None
    teardownContent: str
    userDisplayName: Optional[str] = None
    unlockedBadgesCount: Optional[int] = 0

class LLMProvider(str, Enum):
    gemini = "gemini"
    openai = "openai"
    anthropic = "anthropic"
    groq = "groq"
    grok = "grok"
    sarvam = "sarvam"

class AIAnalyzeRequest(BaseModel):
    company: Dict[str, Any]
    mode: str
    similarCompanies: Optional[List[Dict[str, Any]]] = []
    provider: Optional[LLMProvider] = None
    model: Optional[str] = Field(None, max_length=100)
    apiKey: Optional[str] = Field(None, max_length=250)

class AIGenerateIdeaRequest(BaseModel):
    industry: Optional[str] = "Any"
    problemArea: Optional[str] = "Any"
    techStack: Optional[str] = "Modern Web Stack"
    inspirationStartups: Optional[List[Dict[str, Any]]] = []
    provider: Optional[LLMProvider] = None
    model: Optional[str] = Field(None, max_length=100)
    apiKey: Optional[str] = Field(None, max_length=250)

# =====================================================================
# API Endpoints
# =====================================================================

@app.get("/api/health")
def health_check():
    # Reload env variables on check to detect updates immediately
    llm_service.reload()
    llm_status = llm_service.get_status()
    return {
        "status": "ok", 
        "gemini_enabled": llm_status["enabled"], # Maintain frontend compatibility
        "llm": llm_status
    }

# --- Auth & Profile ---
@app.post("/api/auth/sync")
def sync_user(req: UserSyncRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.uid == req.uid).first()
    if not user:
        user = User(
            uid=req.uid,
            email=req.email,
            display_name=req.displayName,
            photo_url=req.photoURL
        )
        db.add(user)
    else:
        user.email = req.email
        user.display_name = req.displayName
        user.photo_url = req.photoURL
    db.commit()
    db.refresh(user)
    return {"status": "success", "user": {"uid": user.uid, "displayName": user.display_name}}

# --- Notes ---
@app.get("/api/notes")
def get_notes(uid: str = Depends(get_current_user_uid), db: Session = Depends(get_db)):
    notes = db.query(Note).filter(Note.user_uid == uid).all()
    return {note.company_slug: note.note_text for note in notes}

@app.post("/api/notes")
def upsert_note(req: NoteUpsertRequest, uid: str = Depends(get_current_user_uid), db: Session = Depends(get_db)):
    # Ensure user exists in users table
    user = db.query(User).filter(User.uid == uid).first()
    if not user:
        user = User(uid=uid)
        db.add(user)
        db.commit()

    note = db.query(Note).filter(Note.user_uid == uid, Note.company_slug == req.companySlug).first()
    if not note:
        note = Note(
            user_uid=uid,
            company_slug=req.companySlug,
            note_text=req.noteText
        )
        db.add(note)
    else:
        note.note_text = req.noteText
    db.commit()
    return {"status": "success"}

@app.delete("/api/notes/{company_slug}")
def delete_note(company_slug: str, uid: str = Depends(get_current_user_uid), db: Session = Depends(get_db)):
    note = db.query(Note).filter(Note.user_uid == uid, Note.company_slug == company_slug).first()
    if note:
        db.delete(note)
        db.commit()
    return {"status": "success"}

# --- Favorites ---
@app.get("/api/favorites")
def get_favorites(uid: str = Depends(get_current_user_uid), db: Session = Depends(get_db)):
    favs = db.query(Favorite).filter(Favorite.user_uid == uid).all()
    return [
        {
            "companyId": f.company_id,
            "name": f.name,
            "industry": f.industry,
            "batch": f.batch,
            "addedAt": int(f.added_at.timestamp() * 1000)
        }
        for f in favs
    ]

@app.post("/api/favorites")
def add_favorite(req: FavoriteCreateRequest, uid: str = Depends(get_current_user_uid), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.uid == uid).first()
    if not user:
        user = User(uid=uid)
        db.add(user)
        db.commit()

    existing = db.query(Favorite).filter(Favorite.user_uid == uid, Favorite.company_id == req.companyId).first()
    if not existing:
        fav = Favorite(
            user_uid=uid,
            company_id=req.companyId,
            name=req.name,
            industry=req.industry,
            batch=req.batch
        )
        db.add(fav)
        db.commit()
    return {"status": "success"}

@app.delete("/api/favorites/{company_id}")
def remove_favorite(company_id: str, uid: str = Depends(get_current_user_uid), db: Session = Depends(get_db)):
    fav = db.query(Favorite).filter(Favorite.user_uid == uid, Favorite.company_id == company_id).first()
    if fav:
        db.delete(fav)
        db.commit()
    return {"status": "success"}

# --- Collections ---
@app.get("/api/collections")
def get_collections(uid: str = Depends(get_current_user_uid), db: Session = Depends(get_db)):
    cols = db.query(Collection).filter(Collection.user_uid == uid).all()
    return [
        {
            "id": c.id,
            "name": c.name,
            "description": c.description,
            "companyIds": c.company_ids or [],
            "createdAt": int(c.created_at.timestamp() * 1000),
            "updatedAt": int(c.updated_at.timestamp() * 1000)
        }
        for c in cols
    ]

@app.post("/api/collections")
def create_collection(req: CollectionCreateRequest, uid: str = Depends(get_current_user_uid), db: Session = Depends(get_db)):
    col = Collection(
        user_uid=uid,
        name=req.name,
        description=req.description,
        company_ids=req.companyIds
    )
    db.add(col)
    db.commit()
    db.refresh(col)
    return {"id": col.id, "status": "success"}

@app.put("/api/collections/{id}")
def update_collection(id: int, req: CollectionCreateRequest, uid: str = Depends(get_current_user_uid), db: Session = Depends(get_db)):
    col = db.query(Collection).filter(Collection.user_uid == uid, Collection.id == id).first()
    if not col:
        raise HTTPException(status_code=404, detail="Collection not found")
    col.name = req.name
    col.description = req.description
    col.company_ids = req.companyIds
    db.commit()
    return {"status": "success"}

@app.delete("/api/collections/{id}")
def delete_collection(id: int, uid: str = Depends(get_current_user_uid), db: Session = Depends(get_db)):
    col = db.query(Collection).filter(Collection.user_uid == uid, Collection.id == id).first()
    if col:
        db.delete(col)
        db.commit()
    return {"status": "success"}

# --- Sandbox Projects ---
@app.get("/api/sandbox")
def get_sandbox_projects(uid: str = Depends(get_current_user_uid), db: Session = Depends(get_db)):
    projs = db.query(SandboxProject).filter(SandboxProject.user_uid == uid).all()
    return [
        {
            "id": p.id,
            "name": p.name,
            "oneLiner": p.one_liner or "",
            "targetAudience": p.target_audience or "",
            "revenueModel": p.revenue_model or "",
            "features": p.features or [],
            "referenceCompanyIds": p.reference_company_ids or [],
            "notes": p.notes or "",
            "status": p.status,
            "createdAt": int(p.created_at.timestamp() * 1000),
            "updatedAt": int(p.updated_at.timestamp() * 1000)
        }
        for p in projs
    ]

@app.post("/api/sandbox")
def create_sandbox_project(req: SandboxProjectCreateRequest, uid: str = Depends(get_current_user_uid), db: Session = Depends(get_db)):
    proj = SandboxProject(
        user_uid=uid,
        name=req.name,
        one_liner=req.oneLiner,
        target_audience=req.targetAudience,
        revenue_model=req.revenueModel,
        features=req.features,
        reference_company_ids=req.referenceCompanyIds,
        notes=req.notes,
        status=req.status
    )
    db.add(proj)
    db.commit()
    db.refresh(proj)
    return {"id": proj.id, "status": "success"}

@app.put("/api/sandbox/{id}")
def update_sandbox_project(id: int, req: SandboxProjectCreateRequest, uid: str = Depends(get_current_user_uid), db: Session = Depends(get_db)):
    proj = db.query(SandboxProject).filter(SandboxProject.user_uid == uid, SandboxProject.id == id).first()
    if not proj:
        raise HTTPException(status_code=404, detail="Sandbox project not found")
    
    proj.name = req.name
    proj.one_liner = req.oneLiner
    proj.target_audience = req.targetAudience
    proj.revenue_model = req.revenueModel
    proj.features = req.features
    proj.reference_company_ids = req.referenceCompanyIds
    proj.notes = req.notes
    proj.status = req.status
    db.commit()
    return {"status": "success"}

@app.delete("/api/sandbox/{id}")
def delete_sandbox_project(id: int, uid: str = Depends(get_current_user_uid), db: Session = Depends(get_db)):
    proj = db.query(SandboxProject).filter(SandboxProject.user_uid == uid, SandboxProject.id == id).first()
    if proj:
        db.delete(proj)
        db.commit()
    return {"status": "success"}

# --- Achievements & Stats ---
@app.get("/api/stats")
def get_stats(uid: str = Depends(get_current_user_uid), db: Session = Depends(get_db)):
    stats = db.query(UsageStat).filter(UsageStat.user_uid == uid).all()
    return {s.stat_key: s.stat_value for s in stats}

@app.post("/api/stats/increment")
def increment_stat(req: StatIncrementRequest, uid: str = Depends(get_current_user_uid), db: Session = Depends(get_db)):
    stat = db.query(UsageStat).filter(UsageStat.user_uid == uid, UsageStat.stat_key == req.key).first()
    if not stat:
        stat = UsageStat(user_uid=uid, stat_key=req.key, stat_value=req.amount)
        db.add(stat)
    else:
        stat.stat_value += req.amount
    db.commit()
    db.refresh(stat)
    return {"key": stat.stat_key, "value": stat.stat_value}

@app.get("/api/achievements")
def get_achievements(uid: str = Depends(get_current_user_uid), db: Session = Depends(get_db)):
    achvs = db.query(Achievement).filter(Achievement.user_uid == uid).all()
    return [a.achievement_id for a in achvs]

@app.post("/api/achievements/unlock")
def unlock_achievement(req: AchievementUnlockRequest, uid: str = Depends(get_current_user_uid), db: Session = Depends(get_db)):
    existing = db.query(Achievement).filter(
        Achievement.user_uid == uid, 
        Achievement.achievement_id == req.achievementId
    ).first()
    if not existing:
        ach = Achievement(user_uid=uid, achievement_id=req.achievementId)
        db.add(ach)
        db.commit()
    return {"status": "success"}

# =====================================================================
# AI Analysis & Prompt Builders
# =====================================================================

ANALYSIS_PROMPTS = {
    "teardown": lambda c: f"""
Analyze the YC startup "{c.get('name')}" as an expert VC analyst and startup builder.
Company One-Liner: "{c.get('one_liner')}"
Company Description: "{c.get('long_description') or 'No description provided.'}"
Industry: "{c.get('industry') or 'Unspecified'}"
Subindustry: "{c.get('subindustry') or 'Unspecified'}"
Status: "{c.get('status') or 'Active'}"
Regions/Locations: "{', '.join(c.get('regions') or []) or 'Unspecified'}"

Please provide a structured startup teardown with:
1. **Problem Statement**: What core friction are they solving?
2. **Solution & Value Proposition**: How do they solve it and why is it compelling?
3. **Revenue Model**: How do they (or how should they) monetize this?
4. **Key Lessons**: What can other builders learn from their product design, positioning, or business model?
""",

    "techspec": lambda c: f"""
Generate a modern technical specification and MVP build architecture inspired by YC startup "{c.get('name')}".
Company description and pitch: "{c.get('one_liner')}" / "{c.get('long_description') or ''}"
Industry/Sector: "{c.get('industry') or 'Unspecified'}"

Provide a comprehensive guide:
1. **Recommended Tech Stack**: Suggested database, backend framework, frontend structure, and deployment.
2. **Database Schema**: A simplified PostgreSQL or Firestore schema (SQL table DDL or Firestore collection structures).
3. **Core API Routes**: List of key REST or endpoints needed for the MVP.
4. **MVP Architecture & Flow**: Diagram-like text explaining component interaction (e.g. client -> API -> database).
""",

    "competitive": lambda c, similar: f"""
Analyze the competitive landscape for YC startup "{c.get('name')}".
Company Description: "{c.get('one_liner')}" / "{c.get('long_description') or ''}"

Here are some similar startups in the YC directory for reference:
{"".join([f"- {s.get('name')}: {s.get('one_liner')} (Status: {s.get('status')})\n" for s in similar])}

Please analyze:
1. **Competitive Differentiators**: What makes "{c.get('name')}" unique compared to the list?
2. **Market Position**: Where do they fit in the market (e.g., premium vs budget, developer-focused vs enterprise-focused)?
3. **Unresolved Opportunities**: What gaps or adjacent spaces did this competitor leave open for new startups?
""",

    "buildguide": lambda c: f"""
Create a step-by-step MVP build guide to launch a product in the same space as "{c.get('name')}".
Pitch: "{c.get('one_liner')}"

Provide an actionable execution roadmap:
1. **Phase 1: Feature Scope**: What is the absolute minimum feature set to launch in 2 weeks?
2. **Phase 2: Step-by-Step Milestones**: Dev tasks broken down day-by-day.
3. **Phase 3: Validation Playbook**: How to find and acquire the first 10 user signups without ads.
4. **Phase 4: Scaling Risks**: What technical or operational bottlenecks will occur first, and how to mitigate them.
"""
}

@app.post("/api/ai/analyze")
def api_analyze_startup(req: AIAnalyzeRequest, uid: str = Depends(get_current_user_uid)):
    """
    Streams startup analysis generated by the active LLM.
    """
    llm_service.reload()
    status_info = llm_service.get_status()
    has_override = req.provider is not None and req.apiKey is not None
    if not status_info["enabled"] and not has_override:
        raise HTTPException(status_code=500, detail="No LLM API keys are configured on the backend, and no override credentials were provided.")
        
    mode = req.mode
    company = req.company
    similar = req.similarCompanies or []

    if mode == "competitive":
        prompt = ANALYSIS_PROMPTS["competitive"](company, similar)
    else:
        prompt = ANALYSIS_PROMPTS.get(mode, lambda c: "")(company)

    if not prompt:
        raise HTTPException(status_code=400, detail=f"Invalid analysis mode: {mode}")

    def generate():
        try:
            for chunk in llm_service.stream_completion(
                prompt,
                provider=req.provider.value if req.provider else None,
                model_name=req.model,
                api_key=req.apiKey
            ):
                yield chunk
        except Exception as e:
            logger.error(f"Error generating stream: {e}")
            yield f"\n[Backend Error generating analysis: {str(e)}]"

    return StreamingResponse(
        generate(), 
        media_type="text/plain",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no"
        }
    )


@app.post("/api/ai/generate-idea")
def api_generate_idea(req: AIGenerateIdeaRequest, uid: str = Depends(get_current_user_uid)):
    """
    Streams dynamic startup idea generator outputs.
    """
    llm_service.reload()
    status_info = llm_service.get_status()
    has_override = req.provider is not None and req.apiKey is not None
    if not status_info["enabled"] and not has_override:
        raise HTTPException(status_code=500, detail="No LLM API keys are configured on the backend, and no override credentials were provided.")

    prompt = f"""
You are an expert startup generator at Y Combinator. Generate a premium, highly detailed, and validated startup idea brief based on these constraints:
- Target Industry/Sector: "{req.industry or 'Any'}"
- Problem Area: "{req.problemArea or 'Any'}"
- Preferred Tech Stack: "{req.techStack or 'Modern Web Stack'}"

{f'''
Use these real YC companies as inspiration for business model, features, or go-to-market:
{"".join([f"- {s.get('name')}: {s.get('one_liner')}\n" for s in req.inspirationStartups])}
''' if req.inspirationStartups else ''}

Generate a structured startup proposal in JSON format.
Wrap the JSON payload inside Markdown code fences. It must EXACTLY match the following JSON structure:
{{
  "name": "Creative Name",
  "oneLiner": "One-liner pitch...",
  "targetAudience": "Specific customer profile...",
  "revenueModel": "SaaS / Transactional Fee / etc...",
  "detailedDescription": "A 2-3 paragraph detailed breakdown of the business model, why it is needed, and how it functions.",
  "validationDefense": "Why this business model will succeed, using YC market trends or structural changes (e.g. AI capabilities, shift to remote).",
  "features": [
    "Feature 1: brief desc",
    "Feature 2: brief desc",
    "Feature 3: brief desc",
    "Feature 4: brief desc"
  ]
}}

Only return the Markdown code block containing this JSON object. Do not include any pre-text or post-text.
"""

    def generate():
        try:
            for chunk in llm_service.stream_completion(
                prompt,
                provider=req.provider.value if req.provider else None,
                model_name=req.model,
                api_key=req.apiKey
            ):
                yield chunk
        except Exception as e:
            logger.error(f"Error generating idea: {e}")
            yield f"\n[Backend Error generating idea: {str(e)}]"

    return StreamingResponse(
        generate(), 
        media_type="text/plain",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no"
        }
    )


# --- Public Shareable Teardowns ---
@app.post("/api/teardowns/publish")
def publish_teardown(req: TeardownPublishRequest, uid: str = Depends(get_current_user_uid), db: Session = Depends(get_db)):
    teardown_id = str(uuid.uuid4())
    db_teardown = PublicTeardown(
        id=teardown_id,
        user_uid=uid,
        company_name=req.companyName,
        company_one_liner=req.companyOneLiner,
        company_batch=req.companyBatch,
        company_industry=req.companyIndustry,
        company_website=req.companyWebsite,
        teardown_title=req.teardownTitle,
        teardown_content=req.teardownContent,
        user_display_name=req.userDisplayName,
        unlocked_badges_count=req.unlockedBadgesCount
    )
    db.add(db_teardown)
    db.commit()
    return {"id": teardown_id, "status": "success"}


@app.get("/api/teardowns/{teardown_id}")
def get_public_teardown(teardown_id: str, db: Session = Depends(get_db)):
    teardown = db.query(PublicTeardown).filter(PublicTeardown.id == teardown_id).first()
    if not teardown:
        raise HTTPException(status_code=404, detail="Teardown not found")
    return {
        "companyName": teardown.company_name,
        "companyOneLiner": teardown.company_one_liner,
        "companyBatch": teardown.company_batch,
        "companyIndustry": teardown.company_industry,
        "companyWebsite": teardown.company_website,
        "teardownTitle": teardown.teardown_title,
        "teardownContent": teardown.teardown_content,
        "userDisplayName": teardown.user_display_name,
        "unlockedBadgesCount": teardown.unlocked_badges_count,
        "createdAt": int(teardown.created_at.timestamp() * 1000)
    }


# --- Streaks ---
@app.get("/api/streaks")
def get_user_streak(uid: str = Depends(get_current_user_uid), db: Session = Depends(get_db)):
    streak = db.query(Streak).filter(Streak.user_uid == uid).first()
    if not streak:
        return {"streak": 0, "lastCheckIn": None}
    
    # Check if streak has expired (older than yesterday)
    today_str = datetime.utcnow().strftime("%Y-%m-%d")
    yesterday_str = (datetime.utcnow() - timedelta(days=1)).strftime("%Y-%m-%d")
    
    if streak.last_check_in and streak.last_check_in != today_str and streak.last_check_in != yesterday_str:
        # Reset expired streak
        streak.streak_count = 0
        db.commit()
        db.refresh(streak)
        
    return {"streak": streak.streak_count, "lastCheckIn": streak.last_check_in}


@app.post("/api/streaks/check-in")
def check_in_streak(uid: str = Depends(get_current_user_uid), db: Session = Depends(get_db)):
    today_str = datetime.utcnow().strftime("%Y-%m-%d")
    yesterday_str = (datetime.utcnow() - timedelta(days=1)).strftime("%Y-%m-%d")
    
    # Ensure user exists
    user = db.query(User).filter(User.uid == uid).first()
    if not user:
        user = User(uid=uid)
        db.add(user)
        db.commit()
        
    streak = db.query(Streak).filter(Streak.user_uid == uid).first()
    if not streak:
        streak = Streak(
            user_uid=uid,
            streak_count=1,
            last_check_in=today_str
        )
        db.add(streak)
    else:
        if streak.last_check_in == today_str:
            # Already checked in today
            pass
        elif streak.last_check_in == yesterday_str:
            # Checked in yesterday, increment
            streak.streak_count += 1
            streak.last_check_in = today_str
        else:
            # Missed a day or first check-in
            streak.streak_count = 1
            streak.last_check_in = today_str
            
    db.commit()
    db.refresh(streak)
    return {"streak": streak.streak_count, "lastCheckIn": streak.last_check_in}
