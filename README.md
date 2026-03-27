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
<img width="1748" height="819" alt="image" src="https://github.com/user-attachments/assets/e501dea1-5585-41e9-9429-54db022d875f" />

-   View and manage company registrations\
-   Approve or reject companies\
-   Monitor system activity

### 🏢 HR Dashboard
<img width="1879" height="874" alt="image" src="https://github.com/user-attachments/assets/2ae4fe88-5c24-4efa-a323-0055b421f5b6" />
<img width="1233" height="581" alt="image" src="https://github.com/user-attachments/assets/986c8637-450a-4ef5-8a21-ca67b1c4e52d" />

-   Create and manage organizational hierarchy\
-   Add / update / delete employees\
-   Assign roles and departments\
-   Track employee skill progress ⭐\
-   Upload hierarchy via PDF (AI parsing)\
-   Receive AI insights based on company goals

### 👤 Employee Dashboard
<img width="1893" height="872" alt="image" src="https://github.com/user-attachments/assets/d708ae09-98bc-435f-b3bc-2f4aa37e8eb4" />

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
<img width="708" height="686" alt="erd" src="https://github.com/user-attachments/assets/93df8425-5152-4c29-95e4-93a1f4b00315" />


 

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

**Rosl Tahel**\
- Software Engineer & AI Engineer\
- Passionate about building impactful AI-driven products

GitHub: https://github.com/rosltahel

------------------------------------------------------------------------

## 💬 Final Note

This project represents my journey into building intelligent, scalable
systems that combine **AI, full-stack development, and real-world
problem solving**.
