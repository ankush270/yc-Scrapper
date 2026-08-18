# 🧬 YC_DECODE — The Ultimate Startup Tech Lab

An interactive neobrutalist learning dashboard and builder workspace designed to deconstruct business models, study system architecture, and plan/simulate MVP ideas for founders, software engineers, and student builders.

---

## 🚀 Key Features

*   🖥️ **6,179 Startup Database Explorer**: Search and filter every YC-funded startup since 2005 by batch, industry, region, status, and size.
*   ⚡ **Multi-LLM AI Analyst**: Run AI teardowns, technical specs, competitive landscape matrices, or request a brutal VC roast of your idea.
*   📊 **Trends & Gaps Finder**: Study industry distributions, geographical heatmaps, and white space opportunities in the YC ecosystem.
*   🛠️ **Builder Sandbox**: Drag-and-drop Kanban roadmap planner for structuring your own MVP features with direct reference links to YC startups.
*   🏆 **Arena Weekly Leaderboard**: Competitive gamified arena displaying podium positions (1st, 2nd, 3rd) and a contenders list.
*   🔥 **Streak Counter Badge**: Keep track of daily study streaks, check-in activity, and unlock badges (Explorer, Analyst, AI Whisperer).
*   🎴 **Startup DNA Trading Cards**: High-fidelity digital trading cards generating deterministic stats (Scale, Innovation, Moat) and tech stack profiles. Includes a **native vector SVG downloader** for card exports.
*   📈 **Startup Growth Simulator**: Spreadsheet-style growth calculator to project MRR, churn, runway, and growth margins.
*   📘 **Learning Paths & Certificates**: Structured SaaS 101, Fintech, and Zero to MVP paths with downloadable certificates.
*   🛡️ **Founder GTM Playbook**: AI generated day-by-day launching roadmaps planning first 100 users, pricing, and scaling.

---

## 🛠️ Tech Stack

### Frontend (Client-side)
-   **Core**: React, Vite (ES modules compilation).
-   **Styling**: Tailwind CSS (custom neobrutalist borders & neon theme accents).
-   **Animation**: GSAP (Timeline transitions & loading sequences).
-   **Icons**: Lucide React.
-   **Routing**: State-based client-side hash routing (`#landing`, `#app`, `#teardown/{id}`).

### Backend (Server-side)
-   **Framework**: FastAPI (Python 3.10+).
-   **ORM**: SQLAlchemy.
-   **Database**: SQLite/PostgreSQL.
-   **Server**: Uvicorn.

---

## ⚙️ Local Development Setup

### 1. Backend Server Setup
Navigate into the `backend/` directory:
```bash
# Create a virtual environment
python -m venv .venv

# Activate the virtual environment
# On Windows (PowerShell):
.venv\Scripts\Activate.ps1
# On macOS/Linux:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the development server (automatically triggers SQLite migrations)
python main.py
```
The backend API will run at `http://localhost:8000`.

### 2. Frontend Setup
Navigate into the project root directory:
```bash
# Install dependencies
npm install

# Run the local Vite dev server
npm run dev
```
Open your browser and navigate to `http://localhost:5173`.

---

## 🧪 Testing

We use standard Python `unittest` to verify database integrations, schemas, and endpoints:
```bash
# Run database transaction and model validations
cd backend
.venv\Scripts\python.exe test_teardowns.py
```
