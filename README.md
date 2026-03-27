# 🚀 AI-Powered HR Management Platform

A full-stack, AI-driven HR platform designed to help companies manage
employees, track skills, and make smarter workforce decisions using
intelligent recommendations.

------------------------------------------------------------------------

## 💡 Overview

This platform allows companies to:

-   Manage employees, roles, and departments\
-   Build organizational hierarchies\
-   Track employee skills and learning progress\
-   Receive AI-powered recommendations for workforce development\
-   Match employees to job requirements using AI

Built with scalability and real-world use in mind, the system supports
**multi-company (multi-tenant)** architecture and is fully **Dockerized
for easy deployment**.

------------------------------------------------------------------------

## 🧠 Key Features

### 👑 Admin Dashboard

-   View and manage company registrations\
-   Approve or reject companies\
-   Monitor system activity

### 🏢 HR Dashboard

-   Create and manage organizational hierarchy\
-   Add / update / delete employees\
-   Assign roles and departments\
-   Track employee skill progress ⭐\
-   Upload hierarchy via PDF (AI parsing)\
-   Receive AI insights based on company goals

### 👤 Employee Dashboard

-   View personal skill progress\
-   Follow learning paths\
-   Interactive UI (3D skill visualization 🌌)

------------------------------------------------------------------------

## 🤖 AI Capabilities

-   📊 **Dashboard Advice**
    -   HR can input company goals\
    -   AI suggests improvements and learning strategies
-   🎯 **Skill Recommendations**
    -   Suggest technologies employees should learn\
    -   Personalized based on role and progress
-   🔍 **Smart Matching**
    -   Input job description → AI finds best employee matches

------------------------------------------------------------------------

## 🏗️ Tech Stack

### Frontend

-   React.js\
-   Tailwind CSS\
-   Axios

### Backend

-   FastAPI (Python)\
-   SQLAlchemy\
-   JWT Authentication

### Database

-   PostgreSQL

### DevOps

-   Docker & Docker Compose

### AI

-   OpenAI API

------------------------------------------------------------------------

## 🐳 Running the Project (Docker)

### 1. Clone the repository

``` bash
git clone https://github.com/rosltahel/HRmanagement.git
cd HRmanagement
```

### 2. Create environment file

``` bash
cp backend/.env.example backend/.env
```

Update values inside `.env`: - Add your OpenAI API key\
- Adjust database settings if needed

### 3. Run the app

``` bash
docker compose up --build
```

### 4. Access the app

-   Frontend → http://localhost:3000\
-   Backend → http://localhost:8001/docs

------------------------------------------------------------------------

## ⚙️ Running Locally (Without Docker)

### Backend

``` bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8001
```

### Frontend

``` bash
cd frontend
npm install
npm start
```

------------------------------------------------------------------------

## 🔐 Environment Variables

Create a `.env` file inside `backend/`:

``` env
DATABASE_URL=postgresql://postgres:password@localhost:5432/hrmanage
OPENAI_API_KEY=your_openai_key_here
```

------------------------------------------------------------------------

## 📊 Database Design

-   Multi-tenant architecture (companies isolated)\
-   Role hierarchy using parent-child relationships\
-   Employee ↔ Skills many-to-many relationship\
-   Scalable and normalized structure

📄 Full report:\
[Database Design Report](./docs/HR_Database_Report.pdf)

------------------------------------------------------------------------

## 🌟 Why This Project Stands Out

-   Combines **AI + HR Tech** in a practical way\
-   Built fully from scratch (frontend + backend + DB + Docker)\
-   Real-world problem solving (employee growth & management)\
-   Designed for scalability and production readiness

------------------------------------------------------------------------

## 🚀 Future Improvements

-   Real-time notifications\
-   Advanced analytics dashboard (D3 / charts)\
-   AI-powered career path predictions\
-   Role-based permissions refinement

------------------------------------------------------------------------

## 👩‍💻 Author

**Rosol Tahel**\
- Software Engineer & AI Engineer\
- Passionate about building impactful AI-driven products

GitHub: https://github.com/rosltahel

------------------------------------------------------------------------

## 💬 Final Note

This project represents my journey into building intelligent, scalable
systems that combine **AI, full-stack development, and real-world
problem solving**.
