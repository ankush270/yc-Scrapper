import os
import logging
from datetime import datetime
from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, UniqueConstraint, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

# Get connection string from environment
DATABASE_URL = os.getenv("DATABASE_URL", "").strip()

# Fallback to local SQLite if no DB URL is specified
if not DATABASE_URL:
    logger.warning("No DATABASE_URL found in environment variables. Falling back to local SQLite: sqlite:///local.db")
    DATABASE_URL = "sqlite:///local.db"
else:
    # SQLAlchemy requires postgresql:// instead of postgres:// which is sometimes returned by hosted services
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
        logger.info("Updated DATABASE_URL scheme to postgresql://")

# Create engine. For SQLite, allow multi-threaded access.
if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    engine = create_engine(DATABASE_URL, pool_size=5, max_overflow=10, pool_pre_ping=True)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# =====================================================================
# Database Models
# =====================================================================

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    uid = Column(String(255), unique=True, nullable=False, index=True) # Firebase or mock UID
    email = Column(String(255), nullable=True)
    display_name = Column(String(255), nullable=True)
    photo_url = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Note(Base):
    __tablename__ = "notes"
    id = Column(Integer, primary_key=True, index=True)
    user_uid = Column(String(255), nullable=False, index=True)
    company_slug = Column(String(255), nullable=False, index=True)
    note_text = Column(Text, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint("user_uid", "company_slug", name="uq_user_note"),
    )


class Favorite(Base):
    __tablename__ = "favorites"
    id = Column(Integer, primary_key=True, index=True)
    user_uid = Column(String(255), nullable=False, index=True)
    company_id = Column(String(255), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    industry = Column(String(255), nullable=True)
    batch = Column(String(100), nullable=True)
    added_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint("user_uid", "company_id", name="uq_user_favorite"),
    )


class Collection(Base):
    __tablename__ = "collections"
    id = Column(Integer, primary_key=True, index=True)
    user_uid = Column(String(255), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    company_ids = Column(JSON, default=list) # List of company IDs/slugs stored as JSON
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class SandboxProject(Base):
    __tablename__ = "sandbox_projects"
    id = Column(Integer, primary_key=True, index=True)
    user_uid = Column(String(255), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    one_liner = Column(Text, nullable=True)
    target_audience = Column(Text, nullable=True)
    revenue_model = Column(Text, nullable=True)
    features = Column(JSON, default=list) # List of string features
    reference_company_ids = Column(JSON, default=list) # Reference company IDs
    notes = Column(Text, nullable=True)
    status = Column(String(50), default="idea") # idea | research | validating | building | launched
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Achievement(Base):
    __tablename__ = "achievements"
    id = Column(Integer, primary_key=True, index=True)
    user_uid = Column(String(255), nullable=False, index=True)
    achievement_id = Column(String(255), nullable=False)
    unlocked_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint("user_uid", "achievement_id", name="uq_user_achievement"),
    )


class UsageStat(Base):
    __tablename__ = "usage_stats"
    id = Column(Integer, primary_key=True, index=True)
    user_uid = Column(String(255), nullable=False, index=True)
    stat_key = Column(String(255), nullable=False)
    stat_value = Column(Integer, default=0)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint("user_uid", "stat_key", name="uq_user_stat"),
    )


class PublicTeardown(Base):
    __tablename__ = "public_teardowns"
    id = Column(String(50), primary_key=True, index=True)
    user_uid = Column(String(255), nullable=True, index=True)
    company_name = Column(String(255), nullable=False)
    company_one_liner = Column(Text, nullable=True)
    company_batch = Column(String(100), nullable=True)
    company_industry = Column(String(255), nullable=True)
    company_website = Column(Text, nullable=True)
    teardown_title = Column(String(255), nullable=True)
    teardown_content = Column(Text, nullable=False)
    user_display_name = Column(String(255), nullable=True)
    unlocked_badges_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)


# Helper function to initialize database tables
def init_db():
    logger.info("Initializing database schema...")
    Base.metadata.create_all(bind=engine)
    logger.info("Database schema initialized successfully.")

# Dependency to yield session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
